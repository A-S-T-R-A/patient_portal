import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/events";
import { getIO } from "@/lib/io";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  const { datetime } = await req.json();
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { datetime: new Date(datetime) },
  });
  broadcast(
    "appointment.update",
    { appointment: updated },
    { patientId: updated.patientId }
  );
  // Emit socket event for real-time updates
  const { emitAppointmentUpdate } = await import("@/server/rt/publish");
  emitAppointmentUpdate(updated.patientId, updated);
  return Response.json({ appointment: updated });
}
