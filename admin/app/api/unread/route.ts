import { prisma } from "@/lib/db";
import { requireDoctor } from "@/lib/auth";

export async function GET(req: Request) {
  const authDoctorId = await requireDoctor(req).catch((r) => {
    if (r instanceof Response) return r;
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  });
  if (authDoctorId instanceof Response) return authDoctorId;

  const sinceParam = new URL(req.url).searchParams.get("since");
  const since = sinceParam
    ? new Date(sinceParam)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const links = await prisma.doctorPatient.findMany({
    where: { doctorId: authDoctorId },
    select: { patientId: true },
  });
  const patientIds = links.map((l) => l.patientId);

  const perPatient = await prisma.message.groupBy({
    by: ["patientId"],
    where: {
      patientId: { in: patientIds },
      sender: "patient",
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });

  const unreadByPatient: Record<string, number> = {};
  for (const row of perPatient)
    unreadByPatient[row.patientId] = row._count._all;

  return Response.json({ since, unreadByPatient });
}
