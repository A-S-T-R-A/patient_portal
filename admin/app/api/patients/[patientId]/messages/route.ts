import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/events";
import { wsBroadcast } from "@/lib/ws";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const messages = await prisma.message.findMany({
    where: { patientId },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const { sender, content } = await req.json();
  const message = await prisma.message.create({
    data: { patientId, sender, content },
  });
  broadcast("message.new", { message }, { patientId });
  wsBroadcast("message.new", { message }, { patientId });
  // Emit socket event for real-time updates
  const { emitNewMessage } = await import("@/server/rt/publish");
  emitNewMessage(patientId, message);
  return Response.json({ message });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;

  // Delete all messages for this patient
  await prisma.message.deleteMany({
    where: { patientId },
  });

  // Emit socket event to notify patient
  const { publishApi } = await import("@/server/rt/publish");
  publishApi.toUser(patientId, "messages:cleared", { patientId });

  return Response.json({ success: true });
}
