import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import type { Namespace } from "socket.io";

export function createRedisAdapter(ns: Namespace) {
  const pub = new Redis(process.env.REDIS_URL!);
  const sub = new Redis(process.env.REDIS_URL!);
  const adapter = createAdapter(pub, sub);
  (ns as any).adapter = adapter;
  return { pub, sub };
}

