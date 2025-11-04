import type { Socket } from "socket.io";

export function extractCookie(rawCookie: string | undefined, key: string): string | null {
  if (!rawCookie) return null;
  // Simple cookie parser (можно заменить на библиотеку 'cookie')
  const cookies = rawCookie.split(";").reduce((acc, cookie) => {
    const [k, v] = cookie.trim().split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {} as Record<string, string>);
  return cookies[key] ?? null;
}

export function extractSocketToken(client: Socket, key = "socket_token"): string | null {
  const auth = (client.handshake as any).auth ?? {};
  const headers = client.handshake.headers ?? {};
  return (
    auth[key] ||
    headers[key] ||
    extractCookie(headers.cookie as string | undefined, key) ||
    null
  );
}

