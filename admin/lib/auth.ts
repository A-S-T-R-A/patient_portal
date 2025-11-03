import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, JWTPayload } from "@/lib/jwt";

export async function getAuthToken(req: NextRequest): Promise<string | null> {
  return (
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1] ||
    null
  );
}

export async function getAuthPayload(
  req: NextRequest
): Promise<JWTPayload | null> {
  const token = await getAuthToken(req);
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const payload = await getAuthPayload(req);
  if (!payload) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  return payload;
}

export async function requireDoctor(req: NextRequest): Promise<string> {
  const payload = await requireAuth(req);
  if (payload.role !== "doctor") {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }
  return payload.userId;
}

// Fallback for backward compatibility
export async function getMockDoctorId(
  req: NextRequest
): Promise<string | null> {
  // Try JWT first
  const payload = await getAuthPayload(req);
  if (payload?.role === "doctor") {
    return payload.userId;
  }

  // Allow header override for local dev
  const headerDoctor = req.headers.get("x-doctor-id");
  if (headerDoctor) return headerDoctor;

  // Fallback to seed doctor for now (only in dev)
  if (process.env.NODE_ENV !== "production") {
    const d = await prisma.doctor.findFirst({
      where: { email: "doctor@example.com" },
    });
    return d?.id ?? null;
  }

  return null;
}

export async function assertSameDoctor(
  authDoctorId: string,
  routeDoctorId: string
) {
  if (routeDoctorId === "seed") return; // legacy mapping resolves to seed doctor
  if (authDoctorId !== routeDoctorId) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
}
