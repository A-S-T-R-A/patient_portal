// Client-side only import; this module is used by client components
import { io, Socket } from "socket.io-client";

const NAMESPACE = "/events";
let singleton: Socket | null = null;
const joinedRooms = new Set<string>(); // для авто-восстановления по reconnect
let socketTokenPromise: Promise<string> | null = null;

type ConnectOpts = {
  baseUrl: string; // http(s)://host:port
  socketToken?: string; // опционально, если уже получен
};

async function fetchSocketToken(baseUrl: string): Promise<string> {
  console.log("[socket] Fetching socket_token from:", `${baseUrl}/api/rt/issue-socket-token`);
  const res = await fetch(`${baseUrl}/api/rt/issue-socket-token`, {
    credentials: "include",
  });
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

  // Если socket уже существует, но не подключен, пересоздаем
  if (singleton && !singleton.connected) {
    singleton.disconnect();
    singleton = null;
  }

  if (!singleton) {
    console.log("[socket] Creating new socket connection to:", `${opts.baseUrl}${NAMESPACE}`);
    singleton = io(`${opts.baseUrl}${NAMESPACE}`, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: {
        socket_token: token,
      },
      extraHeaders: {
        socket_token: token,
      },
    });
    console.log("[socket] Socket created, connecting...");

    // Лайф-циклы
    singleton.on("connect", () => {
      console.log("[socket] Connected! Socket ID:", singleton?.id);
      // восстановим глобальные обработчики и комнаты
      rewire();
    });

    singleton.io.on("reconnect", () => rewire());

    singleton.on("disconnect", (reason) => {
      console.log("[WS] disconnected:", reason);
    });

    singleton.on("connect_error", (err) => {
      console.error("[WS] connect_error:", err.message);
      // При ошибке авторизации - получаем новый токен
      if (err.message?.includes("AUTH_ERROR") || err.message?.includes("INVALID_TOKEN")) {
        console.log("[WS] Auth error, will retry with new token");
        socketTokenPromise = null; // Сброс для нового токена
      }
    });

    singleton.on("core:auth:error", (data: any) => {
      console.error("[WS] Auth error from server:", data);
      // Отключаемся и очищаем для переподключения
      singleton?.disconnect();
      singleton = null;
      socketTokenPromise = null;
    });

    singleton.on("core:auth:success", () => {
      console.log("[WS] Auth success");
    });

    // Восстановление подписок
    function rewire() {
      // глобальные
      rewireGlobalHandlers(singleton!);
      // комнаты
      if (joinedRooms.size) {
        singleton!.emit("join", { rooms: Array.from(joinedRooms) }, () => {});
      }
    }
  }

  return singleton;
}

// join/leave с запоминанием
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

// глобальные обработчики (пример)
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

// Legacy export для совместимости (async)
export async function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}): Promise<Socket> {
  const baseUrl =
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");
  const socket = await getSocket({ baseUrl });
  
  // Автоматически присоединяемся к комнатам
  if (params?.patientId) {
    joinRoom(`patient:${params.patientId}`);
  }
  if (params?.doctorId) {
    joinRoom(`doctor:${params.doctorId}`);
  }
  
  return socket;
}

