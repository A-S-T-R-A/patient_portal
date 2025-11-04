// Expo/React Native socket client
import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";

const NAMESPACE = "/events";
let singleton: Socket | null = null;
const joinedRooms = new Set<string>();

type ConnectOpts = {
  baseUrl: string;
  socketToken: string;
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

  // Fallback to environment variable or default
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (envUrl) {
    return envUrl.replace(/\/socket\.io$/, "");
  }

  return "http://localhost:3001";
}

async function fetchSocketToken(baseUrl: string): Promise<string> {
  console.log("[Socket Client RN] Fetching socket token from:", baseUrl);

  // Определяем базовый URL для API
  let authBase = baseUrl;
  if (Platform.OS !== "web") {
    // На native используем Railway backend
    authBase =
      process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") ||
      "https://patient-portal-admin-service-production.up.railway.app";
  }

  // Используем fetchWithAuth из api.ts для автоматической передачи токена
  const { fetchWithAuth } = await import("./api");

  try {
    const res = await fetchWithAuth(`${authBase}/api/rt/issue-socket-token`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        "[Socket Client RN] Failed to get socket token:",
        res.status,
        errorText
      );
      throw new Error(`Failed to get socket token: ${res.status}`);
    }

    const data = await res.json();
    if (!data?.socketToken) {
      console.error("[Socket Client RN] No socketToken in response:", data);
      throw new Error("No socketToken in response");
    }

    console.log("[Socket Client RN] Socket token obtained");
    return data.socketToken;
  } catch (error) {
    console.error("[Socket Client RN] Error fetching socket token:", error);
    throw error;
  }
}

export function getSocket(opts: ConnectOpts): Socket {
  if (singleton && singleton.connected) {
    console.log("[Socket Client RN] Reusing existing socket");
    return singleton;
  }

  if (singleton) {
    console.log("[Socket Client RN] Disconnecting old socket");
    singleton.disconnect();
    singleton = null;
  }

  const url = `${opts.baseUrl}${NAMESPACE}`;
  console.log("[Socket Client RN] Creating new socket connection to:", url);

  singleton = io(url, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: {
      socket_token: opts.socketToken,
    },
    extraHeaders: {
      socket_token: opts.socketToken,
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Обработка подключения
  singleton.on("connect", () => {
    console.log("[Socket Client RN] Connected:", singleton?.id);
    rewire();
  });

  // Обработка успешной авторизации
  singleton.on("core:auth:success", (data: any) => {
    console.log("[Socket Client RN] Auth success:", data);
  });

  // Обработка ошибки авторизации
  singleton.on("core:auth:error", (data: any) => {
    console.error("[Socket Client RN] Auth error:", data);
    // При ошибке авторизации пытаемся получить новый токен и переподключиться
    if (data?.error === "INVALID_TOKEN" || data?.error === "NO_TOKEN") {
      setTimeout(async () => {
        try {
          const baseUrl = computeDefaultSocketBase();
          const newToken = await fetchSocketToken(baseUrl);
          if (newToken && singleton) {
            (singleton as any).auth = { socket_token: newToken };
            (singleton as any).io.opts.extraHeaders = {
              socket_token: newToken,
            };
            singleton.connect();
          }
        } catch (err) {
          console.error("[Socket Client RN] Failed to refresh token:", err);
        }
      }, 2000);
    }
  });

  // Обработка переподключения
  singleton.io.on("reconnect", (attemptNumber: number) => {
    console.log(
      `[Socket Client RN] Reconnected after ${attemptNumber} attempts`
    );
    rewire();
  });

  // Обработка отключения
  singleton.on("disconnect", (reason: string) => {
    console.log("[Socket Client RN] Disconnected:", reason);
  });

  // Обработка ошибок подключения
  singleton.on("connect_error", (error: Error) => {
    console.error("[Socket Client RN] Connection error:", error.message);
  });

  // Восстановление подписок
  function rewire() {
    if (!singleton || !singleton.connected) {
      console.log("[Socket Client RN] Cannot rewire: socket not connected");
      return;
    }

    console.log("[Socket Client RN] Rewiring handlers and rooms");
    rewireGlobalHandlers(singleton);

    // Переприсоединяемся к комнатам
    if (joinedRooms.size > 0) {
      const rooms = Array.from(joinedRooms);
      console.log("[Socket Client RN] Rejoining rooms:", rooms);
      singleton.emit("join", { rooms }, (res: { success: boolean }) => {
        if (res?.success) {
          console.log("[Socket Client RN] Successfully rejoined rooms");
        } else {
          console.error("[Socket Client RN] Failed to rejoin rooms");
        }
      });
    }
  }

  return singleton;
}

// Присоединение к комнате
export function joinRoom(room: string) {
  const s = singleton;
  if (!s) {
    console.warn("[Socket Client RN] Cannot join room: socket not initialized");
    return;
  }

  if (!s.connected) {
    console.warn("[Socket Client RN] Cannot join room: socket not connected");
    // Добавляем в список, присоединимся после подключения
    joinedRooms.add(room);
    return;
  }

  if (joinedRooms.has(room)) {
    console.log(`[Socket Client RN] Already in room: ${room}`);
    return;
  }

  console.log(`[Socket Client RN] Joining room: ${room}`);
  s.emit("join", { rooms: [room] }, (res: { success: boolean }) => {
    if (res?.success) {
      joinedRooms.add(room);
      console.log(`[Socket Client RN] Successfully joined room: ${room}`);
    } else {
      console.error(`[Socket Client RN] Failed to join room: ${room}`);
    }
  });
}

// Выход из комнаты
export function leaveRoom(room: string) {
  const s = singleton;
  if (!s || !s.connected) {
    console.warn("[Socket Client RN] Cannot leave room: socket not connected");
    joinedRooms.delete(room);
    return;
  }

  if (!joinedRooms.has(room)) {
    return;
  }

  console.log(`[Socket Client RN] Leaving room: ${room}`);
  s.emit("leave", { rooms: [room] }, (res: { success: boolean }) => {
    if (res?.success) {
      joinedRooms.delete(room);
      console.log(`[Socket Client RN] Successfully left room: ${room}`);
    }
  });
}

// Глобальные обработчики событий
const globalHandlers = new Map<string, (...args: any[]) => void>();

export function setGlobalHandler(
  event: string,
  handler: (...args: any[]) => void
) {
  const s = singleton;
  if (!s) {
    console.warn(
      `[Socket Client RN] Cannot set handler: socket not initialized`
    );
    // Сохраняем для будущего использования
    globalHandlers.set(event, handler);
    return;
  }

  // Удаляем предыдущий обработчик если есть
  const prev = globalHandlers.get(event);
  if (prev) {
    s.off(event, prev);
  }

  // Устанавливаем новый
  globalHandlers.set(event, handler);
  s.on(event, handler);
  console.log(`[Socket Client RN] Global handler set for event: ${event}`);
}

function rewireGlobalHandlers(s: Socket) {
  console.log(
    `[Socket Client RN] Rewiring ${globalHandlers.size} global handlers`
  );
  globalHandlers.forEach((handler, event) => {
    s.off(event, handler);
    s.on(event, handler);
  });
}

// Отключение сокета
export function disconnectSocket() {
  if (singleton) {
    console.log("[Socket Client RN] Disconnecting socket");
    singleton.disconnect();
    singleton = null;
    joinedRooms.clear();
    globalHandlers.clear();
  }
}

// Инициализация socket с автоматическим получением токена
export async function initSocket(): Promise<Socket> {
  const baseUrl = computeDefaultSocketBase();
  console.log("[Socket Client RN] Initializing socket, baseUrl:", baseUrl);

  const socketToken = await fetchSocketToken(baseUrl);
  return getSocket({ baseUrl, socketToken });
}

// Legacy export для совместимости
export function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}): Promise<Socket> {
  return initSocket().then((socket) => {
    // Автоматически присоединяемся к комнатам после авторизации
    socket.once("core:auth:success", () => {
      if (params?.patientId) {
        joinRoom(`patient:${params.patientId}`);
      }
      if (params?.doctorId) {
        joinRoom(`doctor:${params.doctorId}`);
      }
    });

    // Если уже подключен, присоединяемся сразу
    if (socket.connected) {
      if (params?.patientId) {
        joinRoom(`patient:${params.patientId}`);
      }
      if (params?.doctorId) {
        joinRoom(`doctor:${params.doctorId}`);
      }
    }

    return socket;
  });
}
