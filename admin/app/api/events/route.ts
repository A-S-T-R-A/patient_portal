import { NextRequest } from "next/server";
import { subscribe } from "@/lib/events";

// Hook Prisma writes to emit events (simple example)
// In production, use DB triggers or queues
// Not implemented here to avoid overhead; admin and portal currently poll via actions

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId") || undefined;
  const doctorId = searchParams.get("doctorId") || undefined;

  const stream = subscribe({
    patientId: patientId || undefined,
    doctorId: doctorId || undefined,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
      Vary: "Origin",
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        req.headers.get("access-control-request-headers") || "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export const runtime = "nodejs";
