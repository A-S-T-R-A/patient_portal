import type { Namespace } from "socket.io";

export function createRedisAdapter(ns: Namespace) {
  // Опционально: установите @socket.io/redis-adapter и ioredis для масштабирования
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAdapter } = require("@socket.io/redis-adapter");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("ioredis");
    const pub = new Redis(process.env.REDIS_URL!);
    const sub = new Redis(process.env.REDIS_URL!);
    // @ts-ignore - Socket.IO adapter typing issue
    ns.adapter = createAdapter(pub, sub);
    return { pub, sub };
  } catch (e) {
    console.warn("[RT] Redis adapter not available. Install @socket.io/redis-adapter and ioredis for scaling.");
    return null;
  }
}

