import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/events";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const request = await prisma.rescheduleRequest.update({
    where: { id: requestId },
    data: { status: "declined", decidedAt: new Date() },
    include: { appointment: true },
  });
  broadcast(
    "reschedule.declined",
    { request },
    { patientId: request.appointment.patientId }
  );
  return Response.json({ request });
}
