import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/events";
import { getIO } from "@/lib/io";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const request = await prisma.rescheduleRequest.findUnique({
    where: { id: requestId },
    include: { appointment: true },
  });
  if (!request)
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  const appt = await prisma.appointment.update({
    where: { id: request.appointmentId },
    data: { datetime: request.requestedWhen },
  });
  const updatedReq = await prisma.rescheduleRequest.update({
    where: { id: requestId },
    data: { status: "approved", decidedAt: new Date() },
  });
  broadcast(
    "reschedule.approved",
    { request: updatedReq, appointment: appt },
    { patientId: appt.patientId }
  );
  broadcast(
    "appointment.update",
    { appointment: appt },
    { patientId: appt.patientId }
  );
  try {
    const io = getIO();
    io?.to(`patient:${appt.patientId}`).emit("appointment:update", {
      appointment: appt,
      by: "patient",
    });
  } catch {}
  return Response.json({ request: updatedReq, appointment: appt });
}
