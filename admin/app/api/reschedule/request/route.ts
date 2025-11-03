import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { appointmentId, requestedWhen, requestedBy } = await req.json();
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appt)
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  const r = await prisma.rescheduleRequest.create({
    data: {
      appointmentId,
      requestedWhen: new Date(requestedWhen),
      requestedBy: requestedBy || "patient",
    },
  });
  broadcast(
    "reschedule.request",
    { request: r, appointment: appt },
    { doctorId: undefined, patientId: appt.patientId }
  );
  return Response.json({ request: r });
}
