import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const origin = req.headers.get("origin");

  // Allowed origins for CORS
  const allowedOrigins: string[] = [
    "https://dist-d1mwb5e18-jesuitdelrays-projects.vercel.app",
    "https://dist-zhivgufre-jesuitdelrays-projects.vercel.app",
    "https://dist-5gypofs1u-jesuitdelrays-projects.vercel.app",
    "https://dist-jpqeq2jak-jesuitdelrays-projects.vercel.app",
    "https://dist-8yli5carz-jesuitdelrays-projects.vercel.app",
    "https://dist-o150a8to0-jesuitdelrays-projects.vercel.app",
    "https://dist-268n4g9ut-jesuitdelrays-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:8081",
    ...(origin ? [origin] : []), // Current origin if present
  ];

  // Apply CORS only for API routes
  if (req.nextUrl.pathname.startsWith("/api")) {
    // Check if origin is allowed
    const isAllowed =
      !origin ||
      (origin &&
        allowedOrigins.some(
          (allowed) => origin.includes(allowed) || allowed.includes(origin)
        ));

    if (isAllowed && origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
    } else {
      res.headers.set("Access-Control-Allow-Origin", "*");
    }

    res.headers.set(
      "Access-Control-Allow-Headers",
      req.headers.get("Access-Control-Request-Headers") ||
        "Content-Type, Authorization, X-Requested-With"
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      req.headers.get("Access-Control-Request-Method") ||
        "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");
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
