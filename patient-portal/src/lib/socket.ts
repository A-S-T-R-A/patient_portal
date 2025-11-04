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
  
  // Используем fetchWithAuth из api.ts для автоматической передачи токена
  const { fetchWithAuth } = await import("./api");
  
  const res = await fetchWithAuth(`${authBase}/api/rt/issue-socket-token`);
  if (!res.ok) throw new Error("Failed to get socket token");
  
  const data = await res.json();
  if (!data?.socketToken) throw new Error("No socketToken");
  return data.socketToken;
}

export function getSocket(opts: ConnectOpts): Socket {
  if (singleton) return singleton;

  singleton = io(`${opts.baseUrl}${NAMESPACE}`, {
    path: "/socket.io",
    transports: ["websocket"], // RN: только ws
    auth: {
      socket_token: opts.socketToken, // главный вариант
    },
    extraHeaders: {
      socket_token: opts.socketToken, // резерв, если auth не прокинется
    },
  });

  singleton.on("connect", () => rewire());

  singleton.io.on("reconnect", () => rewire());

  singleton.on("disconnect", (reason) => {
    console.log("[WS] RN disconnected:", reason);
  });

  function rewire() {
    rewireGlobalHandlers(singleton!);
    if (joinedRooms.size) {
      singleton!.emit("join", { rooms: Array.from(joinedRooms) }, () => {});
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

