import type { Socket } from "socket.io";

export function extractCookie(
  rawCookie: string | undefined,
  key: string
): string | null {
  if (!rawCookie) return null;
  // Simple cookie parser (можно заменить на библиотеку 'cookie')
  const cookies = rawCookie.split(";").reduce((acc, cookie) => {
    const [k, v] = cookie.trim().split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {} as Record<string, string>);
  return cookies[key] ?? null;
}

export function extractSocketToken(
  client: Socket,
  key = "socket_token"
): string | null {
  const auth = (client.handshake as any).auth ?? {};
  const headers = client.handshake.headers ?? {};
  const cookieHeader = headers.cookie as string | undefined;

  // Проверяем все источники
  const fromAuth = auth[key];
  const fromHeaders = headers[key] as string | undefined;
  const fromCookie = extractCookie(cookieHeader, key);

  // Логируем для отладки (только если токен не найден)
  if (!fromAuth && !fromHeaders && !fromCookie) {
    console.log(`[Socket Utils] No token found for ${client.id}, checked:`, {
      hasAuth: !!auth && Object.keys(auth).length > 0,
      hasHeaders: !!headers && Object.keys(headers).length > 0,
      hasCookie: !!cookieHeader,
      cookieKeys: cookieHeader
        ? cookieHeader
            .split(";")
            .map((c) => c.split("=")[0]?.trim())
            .filter(Boolean)
        : [],
    });
  }

  const token = fromAuth || fromHeaders || fromCookie || null;

  if (token) {
    console.log(`[Socket Utils] Token extracted for ${client.id} from:`, {
      fromAuth: !!fromAuth,
      fromHeaders: !!fromHeaders,
      fromCookie: !!fromCookie,
    });
  }

  return token;
}
