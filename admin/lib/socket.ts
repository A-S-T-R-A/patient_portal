// Client-side only import; this module is used by client components
import { io, Socket } from "socket.io-client";

const NAMESPACE = "/events";
let singleton: Socket | null = null;
const joinedRooms = new Set<string>(); // для авто-восстановления по reconnect

type ConnectOpts = {
  baseUrl: string; // http(s)://host:port
};

export function getSocket(opts: ConnectOpts): Socket {
  if (singleton) return singleton;

  // Для веба часто достаточно cookie "socket_token", но на всякий
  // случай можно передать auth/headers
  singleton = io(`${opts.baseUrl}${NAMESPACE}`, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
    auth: (cb) => {
      // Если хотите дополнительно передавать заголовок/токен
      cb({});
    },
  });

  // Лайф-циклы
  singleton.on("connect", () => {
    // восстановим глобальные обработчики и комнаты
    rewire();
  });

  singleton.io.on("reconnect", () => rewire());

  singleton.on("disconnect", (reason) => {
    console.log("[WS] disconnected:", reason);
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

// Legacy export для совместимости
export function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}): Socket {
  const baseUrl =
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");
  const socket = getSocket({ baseUrl });
  
  // Автоматически присоединяемся к комнатам
  if (params?.patientId) {
    joinRoom(`patient:${params.patientId}`);
  }
  if (params?.doctorId) {
    joinRoom(`doctor:${params.doctorId}`);
  }
  
  return socket;
}

