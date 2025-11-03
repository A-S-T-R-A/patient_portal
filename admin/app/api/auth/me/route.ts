import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Debug: log headers and cookies
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const cookieToken = request.cookies.get("auth_token")?.value;

  console.log("[auth/me] Debug:", {
    hasAuthHeader: !!authHeader,
    hasCookieHeader: !!cookieHeader,
    hasCookieToken: !!cookieToken,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
  });

  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) {
    console.log("[auth/me] No token found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    console.log("[auth/me] Invalid token");
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Fetch user data from DB to include name
  try {
    if (payload.role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { id: payload.userId },
        select: { name: true, email: true, picture: true },
      });
      if (doctor) {
        return NextResponse.json({
          ...payload,
          name: doctor.name,
          picture: doctor.picture,
        });
      }
    } else if (payload.role === "patient") {
      const patient = await prisma.patient.findUnique({
        where: { id: payload.userId },
        select: { name: true, email: true, picture: true },
      });
      if (patient) {
        return NextResponse.json({
          ...payload,
          name: patient.name,
          picture: patient.picture,
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    // Fallback to payload without name
  }

  return NextResponse.json(payload);
}
