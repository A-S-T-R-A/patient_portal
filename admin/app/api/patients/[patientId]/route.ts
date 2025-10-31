import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  const plans = await prisma.treatmentPlan.findMany({ where: { patientId } });
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    orderBy: { datetime: "asc" },
  });
  const messages = await prisma.message.findMany({
    where: { patientId },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ patient, plans, appointments, messages });
}
