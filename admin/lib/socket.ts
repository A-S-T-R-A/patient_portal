// Client-side only import; this module is used by client components
import { io, Socket } from "socket.io-client";

const NAMESPACE = "/events";
let singleton: Socket | null = null;
const joinedRooms = new Set<string>();

type ConnectOpts = {
  baseUrl: string;
  socketToken?: string;
};

export function getSocket(opts: ConnectOpts): Socket {
  if (singleton && singleton.connected) {
    console.log("[Socket Client] Reusing existing socket");
    return singleton;
  }

  if (singleton) {
    console.log("[Socket Client] Disconnecting old socket");
    singleton.disconnect();
    singleton = null;
  }

  const url = `${opts.baseUrl}${NAMESPACE}`;
  console.log("[Socket Client] Creating new socket connection to:", url);

  // Подготовка auth объекта
  const auth: any = {};
  if (opts.socketToken) {
    auth.socket_token = opts.socketToken;
  }

  singleton = io(url, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Обработка подключения
  singleton.on("connect", () => {
    console.log("[Socket Client] Connected:", singleton?.id);
    rewire();
  });

  // Обработка успешной авторизации
  singleton.on("core:auth:success", (data: any) => {
    console.log("[Socket Client] Auth success:", data);
  });

  // Обработка ошибки авторизации
  singleton.on("core:auth:error", (data: any) => {
    console.error("[Socket Client] Auth error:", data);
    // При ошибке авторизации переподключаемся с новым токеном
    if (data?.error === "INVALID_TOKEN" || data?.error === "NO_TOKEN") {
      setTimeout(() => {
        // Попытка получить новый токен и переподключиться
        fetch("/api/rt/issue-socket-token")
          .then((res) => res.json())
          .then((data) => {
            if (data?.socketToken && singleton) {
              singleton.auth = { socket_token: data.socketToken };
              singleton.connect();
            }
          })
          .catch((err) =>
            console.error("[Socket Client] Failed to refresh token:", err)
          );
      }, 2000);
    }
  });

  // Обработка переподключения
  singleton.io.on("reconnect", (attemptNumber: number) => {
    console.log(`[Socket Client] Reconnected after ${attemptNumber} attempts`);
    rewire();
  });

  // Обработка отключения
  singleton.on("disconnect", (reason: string) => {
    console.log("[Socket Client] Disconnected:", reason);
  });

  // Обработка ошибок подключения
  singleton.on("connect_error", (error: Error) => {
    console.error("[Socket Client] Connection error:", error.message);
  });

  // Восстановление подписок
  function rewire() {
    if (!singleton || !singleton.connected) {
      console.log("[Socket Client] Cannot rewire: socket not connected");
      return;
    }

    console.log("[Socket Client] Rewiring handlers and rooms");
    rewireGlobalHandlers(singleton);

    // Переприсоединяемся к комнатам
    if (joinedRooms.size > 0) {
      const rooms = Array.from(joinedRooms);
      console.log("[Socket Client] Rejoining rooms:", rooms);
      singleton.emit("join", { rooms }, (res: { success: boolean }) => {
        if (res?.success) {
          console.log("[Socket Client] Successfully rejoined rooms");
        } else {
          console.error("[Socket Client] Failed to rejoin rooms");
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
    console.warn("[Socket Client] Cannot join room: socket not initialized");
    return;
  }

  if (!s.connected) {
    console.warn("[Socket Client] Cannot join room: socket not connected");
    // Добавляем в список, присоединимся после подключения
    joinedRooms.add(room);
    return;
  }

  if (joinedRooms.has(room)) {
    console.log(`[Socket Client] Already in room: ${room}`);
    return;
  }

  console.log(`[Socket Client] Joining room: ${room}`);
  s.emit("join", { rooms: [room] }, (res: { success: boolean }) => {
    if (res?.success) {
      joinedRooms.add(room);
      console.log(`[Socket Client] Successfully joined room: ${room}`);
    } else {
      console.error(`[Socket Client] Failed to join room: ${room}`);
    }
  });
}

// Выход из комнаты
export function leaveRoom(room: string) {
  const s = singleton;
  if (!s || !s.connected) {
    console.warn("[Socket Client] Cannot leave room: socket not connected");
    joinedRooms.delete(room);
    return;
  }

  if (!joinedRooms.has(room)) {
    return;
  }

  console.log(`[Socket Client] Leaving room: ${room}`);
  s.emit("leave", { rooms: [room] }, (res: { success: boolean }) => {
    if (res?.success) {
      joinedRooms.delete(room);
      console.log(`[Socket Client] Successfully left room: ${room}`);
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
    console.warn(`[Socket Client] Cannot set handler: socket not initialized`);
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
  console.log(`[Socket Client] Global handler set for event: ${event}`);
}

function rewireGlobalHandlers(s: Socket) {
  console.log(
    `[Socket Client] Rewiring ${globalHandlers.size} global handlers`
  );
  globalHandlers.forEach((handler, event) => {
    s.off(event, handler);
    s.on(event, handler);
  });
}

// Отключение сокета
export function disconnectSocket() {
  if (singleton) {
    console.log("[Socket Client] Disconnecting socket");
    singleton.disconnect();
    singleton = null;
    joinedRooms.clear();
    globalHandlers.clear();
  }
}

// Legacy export для совместимости
export function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}): Socket {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3001";

  // Пытаемся получить токен из cookie (будет автоматически)
  // Для явной передачи токена нужно вызывать getSocket напрямую

  const socket = getSocket({ baseUrl });

  // Автоматически присоединяемся к комнатам после подключения
  socket.on("core:auth:success", () => {
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
}
