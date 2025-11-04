import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken } from "@/lib/jwt";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 1) Проверяем авторизацию (получаем userId из существующего токена)
    const payload = await getAuthPayload(req);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2) Генерируем краткоживущий socket_token (30 минут)
    const socketToken = await signToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }, "30m");

    // 3a) Веб: кладём httpOnly cookie
    const response = NextResponse.json({ ok: true, socketToken });
    
    const cookie = `socket_token=${socketToken}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; SameSite=Lax; Path=/; Max-Age=${60 * 30}`;
    response.headers.set("Set-Cookie", cookie);

    // 3b) Возвращаем и в body (на Expo возьмём из JSON)
    return response;
  } catch (error) {
    console.error("[issue-socket-token] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

