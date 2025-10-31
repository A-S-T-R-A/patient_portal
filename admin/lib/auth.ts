import { prisma } from "@/lib/db";

export async function getMockDoctorId(req: Request): Promise<string | null> {
  // Allow header override for local dev
  const headerDoctor = req.headers.get("x-doctor-id");
  let id = headerDoctor || undefined;
  if (!id) {
    // Fallback to seed doctor for now
    const d = await prisma.doctor.findFirst({
      where: { email: "doctor@example.com" },
    });
    id = d?.id;
  }
  return id ?? null;
}

export async function requireDoctor(req: Request): Promise<string> {
  const id = await getMockDoctorId(req);
  if (!id)
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  return id;
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
