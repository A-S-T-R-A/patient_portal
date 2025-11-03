import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  const plans = await prisma.treatmentPlan.findMany({
    where: { patientId },
    include: {
      procedures: {
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              datetime: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: {
      procedures: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        },
      },
    },
    orderBy: { datetime: "asc" },
  });
  const messages = await prisma.message.findMany({
    where: { patientId },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ patient, plans, appointments, messages });
}
