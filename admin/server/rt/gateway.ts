import type { Server as HttpServer } from "http";
import { Server, Namespace, Socket } from "socket.io";
import { verifyToken, type JWTPayload } from "@/lib/jwt";
import { createRedisAdapter } from "./redis"; // опционально
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

const clientSockets = new Map<string, SocketWithContext>(); // socket.id -> client

type JwtPayload = { userId: string; email: string; role: string; iat?: number; exp?: number };

export function initRtGateway(server: HttpServer) {
  const io = new Server(server, {
    path: "/socket.io",
    transports: ["websocket"], // только ws
    maxHttpBufferSize: SOCKET_MAX_BUFFER,
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
      credentials: true,
    },
  });

  // Неймспейс
  const ns: Namespace = io.of(NAMESPACE); // "/events"

  // Подключаем Redis-адаптер (опционально)
  if (process.env.RT_USE_REDIS === "true") {
    createRedisAdapter(ns);
  }

  ns.on("connection", async (rawSocket: Socket) => {
    const client = rawSocket as SocketWithContext;

    try {
      // 1) Авторизация
      const token = extractSocketToken(client, "socket_token");

      if (!token) {
        client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "NO_TOKEN" });
        return client.disconnect();
      }

      // Проверка JWT (короткоживущий socket_token)
      // Используем отдельный секрет для socket_token или тот же
      const payload = await verifyToken(token);
      
      if (!payload || !payload.userId) {
        client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "INVALID_TOKEN" });
        return client.disconnect();
      }

      client.authorized = true;
      client.user = { id: payload.userId };
      client.accessToken = token;

      // 2) Сохраняем
      clientSockets.set(client.id, client);

      // 3) Комната пользователя (личные оповещения)
      if (client.user?.id) {
        client.join(`u:${client.user.id}`);
      }

      // 4) Базовые хендлеры клиента
      wireClientHandlers(ns, client);

      client.emit(SERVER_EVENTS.AUTH_SUCCESS, { ok: true });
      console.log("[RT] Client authenticated:", client.user?.id);
    } catch (e) {
      console.error("[RT] Auth error:", e);
      client.emit(SERVER_EVENTS.AUTH_ERROR, { error: "INVALID_TOKEN" });
      client.disconnect();
    }
  });

  // Паблишер для API слоёв
  publishApi.setNamespace(ns);

  // Диагностика
  ns.on("connect_error", (err) => {
    console.error("[RT] connect_error:", err.message);
  });
}

function wireClientHandlers(ns: Namespace, client: SocketWithContext) {
  // JOIN (ACK-обязательный)
  client.on(CLIENT_EVENTS.JOIN, async (payload: { rooms: string[] }, ack?: (res: { success: boolean }) => void) => {
    try {
      for (const r of payload.rooms ?? []) {
        client.join(r);
      }
      ack?.({ success: true });
    } catch (e) {
      ack?.({ success: false });
    }
  });

  // LEAVE (ACK-обязательный)
  client.on(CLIENT_EVENTS.LEAVE, async (payload: { rooms: string[] }, ack?: (res: { success: boolean }) => void) => {
    try {
      for (const r of payload.rooms ?? []) {
        client.leave(r);
      }
      ack?.({ success: true });
    } catch (e) {
      ack?.({ success: false });
    }
  });

  // Пере-авторизация (например, после refresh)
  client.on(CLIENT_EVENTS.AUTHORIZE, async (payload: { accessToken?: string; socketToken?: string }, ack?: (res: { success: boolean }) => void) => {
    try {
      const token = payload.socketToken ?? payload.accessToken;
      if (!token) return ack?.({ success: false });

      const decoded = await verifyToken(token);
      if (!decoded || !decoded.userId) {
        return ack?.({ success: false });
      }

      client.authorized = true;
      client.user = { id: decoded.userId };
      client.accessToken = token;

      // гарантия комнаты пользователя
      client.join(`u:${client.user.id}`);

      ack?.({ success: true });
    } catch {
      ack?.({ success: false });
    }
  });

  // Отправка сообщения
  client.on(CLIENT_EVENTS.MESSAGE_SEND, async ({ patientId, sender, content }: any, ack?: (res: { ok: boolean; message?: any; error?: string }) => void) => {
    try {
      if (!patientId || !sender || !content) {
        ack?.({ ok: false, error: "invalid_payload" });
        return;
      }

      const message = await prisma.message.create({
        data: { patientId, sender, content },
      });

      // Отправляем сообщение пользователю через комнату
      publishApi.toUser(patientId, SERVER_EVENTS.MESSAGE_NEW, { message });
      
      ack?.({ ok: true, message });
    } catch (e) {
      console.error("[RT] message:send error:", e);
      ack?.({ ok: false, error: "server_error" });
    }
  });

  // Отладочные
  client.on("disconnect", (reason) => {
    clientSockets.delete(client.id);
  });

  client.on("error", (err) => {
    console.error("[RT] client error:", err);
  });
}

