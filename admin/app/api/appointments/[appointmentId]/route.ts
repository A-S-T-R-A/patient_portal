import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  try {
    // Get appointment before deleting to get patientId
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { patientId: true },
    });

    if (!appointment) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
      });
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    // Emit socket event for real-time updates
    const { emitAppointmentCancelled } = await import("@/server/rt/publish");
    emitAppointmentCancelled(appointment.patientId, appointmentId, "doctor");

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Delete appointment error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete appointment" }),
      { status: 500 }
    );
  }
}
