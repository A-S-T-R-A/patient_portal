import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const origin = req.headers.get("origin") || "*";

  // Apply CORS only for API routes
  if (req.nextUrl.pathname.startsWith("/api")) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set(
      "Access-Control-Allow-Headers",
      req.headers.get("Access-Control-Request-Headers") || "*"
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      req.headers.get("Access-Control-Request-Method") || "GET,POST,OPTIONS"
    );
  }

  // Handle preflight
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
    return new NextResponse(null, {
      status: 204,
      headers: res.headers,
    });
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
