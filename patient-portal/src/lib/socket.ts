// Expo/React Native socket client
import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";

const NAMESPACE = "/events";
let singleton: Socket | null = null;
const joinedRooms = new Set<string>(); // для авто-восстановления по reconnect

type ConnectOpts = {
  baseUrl: string; // http(s)://host:port
  socketToken: string; // полученный с бэка
};

function computeDefaultSocketBase(): string {
  // Web: use current hostname
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const host = window.location.hostname || "localhost";
      return `http://${host}:3001`;
    } catch {}
  }
  // Native: infer LAN IP from Expo hostUri
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    const hostUri: string | undefined =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}:3001`;
    }
  } catch {}
  return process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:3001";
}

async function fetchSocketToken(baseUrl: string): Promise<string> {
  // Для веба используем тот же origin, для native - вычисляем auth base
  let authBase = baseUrl;
  if (Platform.OS !== "web") {
    // На native нужно получить токен с Railway backend
    authBase = process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") || 
               "https://patient-portal-admin-service-production.up.railway.app";
  }
  
  console.log("[socket] Fetching socket_token from:", `${authBase}/api/rt/issue-socket-token`);
  
  // Используем fetchWithAuth из api.ts для автоматической передачи токена
  const { fetchWithAuth } = await import("./api");
  
  const res = await fetchWithAuth(`${authBase}/api/rt/issue-socket-token`);
  if (!res.ok) {
    const errorText = await res.text();
    console.error("[socket] Failed to get socket token:", res.status, errorText);
    throw new Error(`Failed to get socket token: ${res.status}`);
  }
  
  const data = await res.json();
  if (!data?.socketToken) {
    console.error("[socket] No socketToken in response:", data);
    throw new Error("No socketToken in response");
  }
  
  console.log("[socket] socket_token received, length:", data.socketToken.length);
  return data.socketToken;
}

let socketTokenPromise: Promise<string> | null = null;

export async function getSocket(opts: ConnectOpts): Promise<Socket> {
  if (singleton && singleton.connected) {
    console.log("[socket] Reusing existing connected socket");
    return singleton;
  }

  // Получаем socket_token если не передан
  let token = opts.socketToken;
  if (!token) {
    console.log("[socket] No token provided, fetching...");
    if (!socketTokenPromise) {
      socketTokenPromise = fetchSocketToken(opts.baseUrl);
    }
    token = await socketTokenPromise;
    socketTokenPromise = null; // Сброс после использования
    console.log("[socket] Token obtained, length:", token.length);
  } else {
    console.log("[socket] Using provided token");
  }

  if (singleton && !singleton.connected) {
    console.log("[socket] Socket exists but not connected, recreating...");
    singleton.disconnect();
    singleton = null;
  }

  if (!singleton) {
    console.log("[socket] Creating new socket connection to:", `${opts.baseUrl}${NAMESPACE}`, "with token length:", token.length);
    singleton = io(`${opts.baseUrl}${NAMESPACE}`, {
      path: "/socket.io",
      transports: ["websocket"], // RN: только ws
      auth: {
        socket_token: token, // главный вариант
      },
      extraHeaders: {
        socket_token: token, // резерв, если auth не прокинется
      },
    });
    console.log("[socket] Socket created, connecting...");

    singleton.on("connect", () => {
      console.log("[socket] Connected! Socket ID:", singleton?.id);
      rewire();
    });

    singleton.io.on("reconnect", () => rewire());

    singleton.on("disconnect", (reason) => {
      console.log("[WS] RN disconnected:", reason);
    });

    singleton.on("connect_error", (err) => {
      console.error("[WS] RN connect_error:", err.message);
      // При ошибке авторизации - получаем новый токен
      if (err.message?.includes("AUTH_ERROR") || err.message?.includes("INVALID_TOKEN")) {
        console.log("[WS] RN Auth error, will retry with new token");
        socketTokenPromise = null; // Сброс для нового токена
      }
    });

    singleton.on("core:auth:error", (data: any) => {
      console.error("[WS] RN Auth error from server:", data);
      // Отключаемся и очищаем для переподключения
      singleton?.disconnect();
      singleton = null;
      socketTokenPromise = null;
    });

    singleton.on("core:auth:success", () => {
      console.log("[WS] RN Auth success");
    });

    function rewire() {
      rewireGlobalHandlers(singleton!);
      if (joinedRooms.size) {
        singleton!.emit("join", { rooms: Array.from(joinedRooms) }, () => {});
      }
    }
  }

  return singleton;
}

export function joinRoom(room: string) {
  const s = singleton;
  if (!s || !s.connected) return;
  s.emit("join", { rooms: [room] }, (res: { success: boolean }) => {
    if (res?.success) joinedRooms.add(room);
  });
}

export function leaveRoom(room: string) {
  const s = singleton;
  if (!s || !s.connected) return;
  s.emit("leave", { rooms: [room] }, (res: { success: boolean }) => {
    if (res?.success) joinedRooms.delete(room);
  });
}

// глобальные обработчики
const globalHandlers = new Map<string, (...args: any[]) => void>();

export function setGlobalHandler(event: string, handler: (...args: any[]) => void) {
  const s = singleton;
  const prev = globalHandlers.get(event);
  if (prev && s) s.off(event, prev);
  globalHandlers.set(event, handler);
  if (s) s.on(event, handler);
}

function rewireGlobalHandlers(s: Socket) {
  globalHandlers.forEach((h, ev) => {
    s.off(ev, h);
    s.on(ev, h);
  });
}

// Инициализация socket с автоматическим получением токена
export async function initSocket(): Promise<Socket> {
  const baseUrl = computeDefaultSocketBase();
  const socketToken = await fetchSocketToken(baseUrl);
  return getSocket({ baseUrl, socketToken });
}

// Legacy export для совместимости
export function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}): Promise<Socket> {
  return initSocket().then((socket) => {
    // Автоматически присоединяемся к комнатам
    if (params?.patientId) {
      joinRoom(`patient:${params.patientId}`);
    }
    if (params?.doctorId) {
      joinRoom(`doctor:${params.doctorId}`);
    }
    return socket;
  });
}

