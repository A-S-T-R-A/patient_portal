import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireDoctor } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authDoctorId = await requireDoctor(req).catch((r) => {
    if (r instanceof Response) return r;
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  });
  if (authDoctorId instanceof Response) return authDoctorId;

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const patientLinks = await prisma.doctorPatient.findMany({
    where: { doctorId: authDoctorId },
    select: { patientId: true },
  });
  const patientIds = patientLinks.map((l) => l.patientId);

  const [
    patientsCount,
    upcomingAppointmentsCount,
    unreadMessagesCount,
    pendingReschedulesCount,
    nextAppointment,
  ] = await Promise.all([
    prisma.doctorPatient.count({ where: { doctorId: authDoctorId } }),
    prisma.appointment.count({
      where: { patientId: { in: patientIds }, datetime: { gte: now } },
    }),
    prisma.message.count({
      where: {
        patientId: { in: patientIds },
        sender: "patient",
        createdAt: { gte: since },
      },
    }),
    prisma.rescheduleRequest.count({
      where: {
        status: "pending",
        appointment: { patientId: { in: patientIds } },
      },
    }),
    prisma.appointment.findFirst({
      where: { patientId: { in: patientIds }, datetime: { gte: now } },
      orderBy: { datetime: "asc" },
    }),
  ]);

  return Response.json({
    patientsCount,
    upcomingAppointmentsCount,
    unreadMessagesCount,
    pendingReschedulesCount,
    nextAppointment,
  });
}
