import { prisma } from "@/lib/db";
import { assertSameDoctor, requireDoctor } from "@/lib/auth";

async function resolveDoctorId(id: string) {
  if (id === "seed") {
    const d = await prisma.doctor.findFirst({
      where: { email: "doctor@example.com" },
    });
    return d?.id ?? null;
  }
  return id;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const authDoctorId = await requireDoctor(_req).catch((r) => {
    if (r instanceof Response) return r;
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  });
  if (authDoctorId instanceof Response) return authDoctorId;
  const { doctorId: raw } = await params;
  const doctorId = await resolveDoctorId(raw);
  if (!doctorId)
    return new Response(JSON.stringify({ error: "Doctor not found" }), {
      status: 404,
    });
  const forbidden = await (async () => {
    try {
      await assertSameDoctor(authDoctorId, doctorId);
      return null;
    } catch (r) {
      if (r instanceof Response) return r;
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }
  })();
  if (forbidden) return forbidden;
  const links = await prisma.doctorPatient.findMany({
    where: { doctorId },
    include: { patient: true },
  });
  return Response.json({ patients: links.map((l) => l.patient) });
}
