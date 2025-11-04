import type { Server as HttpServer } from "http";
import { Server, Namespace, Socket } from "socket.io";
import { verifyToken } from "@/lib/jwt";
import { createRedisAdapter } from "./redis";
import { extractSocketToken } from "./utils";
import { SocketWithContext } from "./types";
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  NAMESPACE,
  SOCKET_MAX_BUFFER,
} from "./events";
import { publishApi } from "./publish";
import { prisma } from "@/lib/db";

const clientSockets = new Map<string, SocketWithContext>();

export function initRtGateway(server: HttpServer) {
  console.log("[RT Gateway] Initializing Socket.IO server...");

  const io = new Server(server, {
    path: "/socket.io",
    transports: ["websocket", "polling"], // поддержка polling как fallback
    maxHttpBufferSize: SOCKET_MAX_BUFFER,
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || "*",
      credentials: true,
      methods: ["GET", "POST"],
    },
    allowEIO3: true, // совместимость со старыми клиентами
  });

  // Создаем namespace
  const ns: Namespace = io.of(NAMESPACE);
  console.log(`[RT Gateway] Namespace ${NAMESPACE} created`);

  // Подключаем Redis адаптер если нужно
  if (process.env.RT_USE_REDIS === "true") {
    try {
      createRedisAdapter(ns);
      console.log("[RT Gateway] Redis adapter enabled");
    } catch (e) {
      console.error("[RT Gateway] Redis adapter error:", e);
    }
  }

  // Обработка подключения
  ns.on("connection", async (rawSocket: Socket) => {
    const client = rawSocket as SocketWithContext;
    console.log(`[RT Gateway] New connection attempt: ${client.id}`);

    try {
      // 1. Извлекаем токен
      const token = extractSocketToken(client, "socket_token");
      console.log(`[RT Gateway] Token extracted: ${!!token}`);

      if (!token) {
        console.log(`[RT Gateway] No token found for ${client.id}`);
        client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "NO_TOKEN" });
        client.disconnect();
        return;
      }

      // 2. Проверяем токен
      let payload;
      try {
        payload = await verifyToken(token);
        console.log(
          `[RT Gateway] Token verified: ${!!payload}, userId: ${
            payload?.userId
          }`
        );
      } catch (e) {
        console.error(`[RT Gateway] Token verification failed:`, e);
        client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "INVALID_TOKEN" });
        client.disconnect();
        return;
      }

      if (!payload || !payload.userId) {
        console.log(`[RT Gateway] Invalid payload for ${client.id}`);
        client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "INVALID_TOKEN" });
        client.disconnect();
        return;
      }

      // 3. Устанавливаем контекст
      client.authorized = true;
      client.user = { id: payload.userId };
      client.accessToken = token;

      // 4. Сохраняем socket
      clientSockets.set(client.id, client);
      console.log(
        `[RT Gateway] Client authenticated: ${client.id}, userId: ${payload.userId}`
      );

      // 5. Присоединяемся к персональной комнате пользователя
      const userRoom = `u:${client.user.id}`;
      client.join(userRoom);
      console.log(`[RT Gateway] Client ${client.id} joined room ${userRoom}`);

      // 6. Настраиваем обработчики
      wireClientHandlers(ns, client);

      // 7. Отправляем успешную авторизацию
      client.emit(SERVER_EVENTS.AUTH_SUCCESS, {
        ok: true,
        userId: client.user.id,
      });
      console.log(`[RT Gateway] Auth success sent to ${client.id}`);
    } catch (e) {
      console.error(`[RT Gateway] Connection error for ${client.id}:`, e);
      client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "INTERNAL_ERROR" });
      client.disconnect();
    }
  });

  // Устанавливаем namespace в publishApi
  publishApi.setNamespace(ns);
  console.log("[RT Gateway] Publish API initialized");

  // Диагностика
  ns.on("connect_error", (err) => {
    console.error("[RT Gateway] connect_error:", err.message);
  });

  io.on("connection", (socket) => {
    console.log(`[RT Gateway] Root namespace connection: ${socket.id}`);
  });

  console.log("[RT Gateway] Initialization complete");
}

function wireClientHandlers(ns: Namespace, client: SocketWithContext) {
  console.log(`[RT Gateway] Wiring handlers for ${client.id}`);

  // JOIN комнат
  client.on(
    CLIENT_EVENTS.JOIN,
    async (
      payload: { rooms: string[] },
      ack?: (res: { success: boolean }) => void
    ) => {
      try {
        if (!client.authorized) {
          console.log(
            `[RT Gateway] Unauthorized join attempt from ${client.id}`
          );
          return ack?.({ success: false });
        }

        const rooms = payload?.rooms || [];
        console.log(`[RT Gateway] Join request from ${client.id}:`, rooms);

        for (const room of rooms) {
          if (typeof room === "string" && room) {
            client.join(room);
            console.log(
              `[RT Gateway] Client ${client.id} joined room: ${room}`
            );
          }
        }

        ack?.({ success: true });
      } catch (e) {
        console.error(`[RT Gateway] Join error for ${client.id}:`, e);
        ack?.({ success: false });
      }
    }
  );

  // LEAVE комнат
  client.on(
    CLIENT_EVENTS.LEAVE,
    async (
      payload: { rooms: string[] },
      ack?: (res: { success: boolean }) => void
    ) => {
      try {
        if (!client.authorized) {
          return ack?.({ success: false });
        }

        const rooms = payload?.rooms || [];
        console.log(`[RT Gateway] Leave request from ${client.id}:`, rooms);

        for (const room of rooms) {
          if (typeof room === "string" && room) {
            client.leave(room);
            console.log(`[RT Gateway] Client ${client.id} left room: ${room}`);
          }
        }

        ack?.({ success: true });
      } catch (e) {
        console.error(`[RT Gateway] Leave error for ${client.id}:`, e);
        ack?.({ success: false });
      }
    }
  );

  // Отправка сообщения
  client.on(
    CLIENT_EVENTS.MESSAGE_SEND,
    async (
      payload: { patientId?: string; sender?: string; content?: string },
      ack?: (res: { ok: boolean; message?: any; error?: string }) => void
    ) => {
      try {
        if (!client.authorized) {
          return ack?.({ ok: false, error: "unauthorized" });
        }

        const { patientId, sender, content } = payload || {};
        console.log(`[RT Gateway] Message send from ${client.id}:`, {
          patientId,
          sender,
          hasContent: !!content,
        });

        if (!patientId || !sender || !content) {
          return ack?.({ ok: false, error: "invalid_payload" });
        }

        // Создаем сообщение в БД
        const message = await prisma.message.create({
          data: { patientId, sender, content },
        });

        console.log(`[RT Gateway] Message created: ${message.id}`);

        // Отправляем через publishApi в комнату пациента
        publishApi.toUser(patientId, SERVER_EVENTS.MESSAGE_NEW, { message });

        // Также отправляем в комнату patient:xxx на случай если клиент там
        publishApi.toRoom(`patient:${patientId}`, SERVER_EVENTS.MESSAGE_NEW, {
          message,
        });

        ack?.({ ok: true, message });
      } catch (e) {
        console.error(`[RT Gateway] Message send error for ${client.id}:`, e);
        ack?.({ ok: false, error: "server_error" });
      }
    }
  );

  // Пере-авторизация
  client.on(
    CLIENT_EVENTS.AUTHORIZE,
    async (
      payload: { accessToken?: string; socketToken?: string },
      ack?: (res: { success: boolean }) => void
    ) => {
      try {
        const token = payload?.socketToken || payload?.accessToken;
        if (!token) {
          return ack?.({ success: false });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) {
          return ack?.({ success: false });
        }

        client.authorized = true;
        client.user = { id: decoded.userId };
        client.accessToken = token;

        const userRoom = `u:${client.user.id}`;
        client.join(userRoom);

        ack?.({ success: true });
      } catch {
        ack?.({ success: false });
      }
    }
  );

  // Отключение
  client.on("disconnect", (reason) => {
    console.log(`[RT Gateway] Client ${client.id} disconnected: ${reason}`);
    clientSockets.delete(client.id);
  });

  // Ошибки
  client.on("error", (err) => {
    console.error(`[RT Gateway] Client ${client.id} error:`, err);
  });

  console.log(`[RT Gateway] Handlers wired for ${client.id}`);
}
