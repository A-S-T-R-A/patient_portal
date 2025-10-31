import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/events";
import { wsBroadcast } from "@/lib/ws";

export async function GET(
  _req: Request,
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
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const { sender, content } = await req.json();
  const message = await prisma.message.create({
    data: { patientId, sender, content },
  });
  broadcast("message.new", { message }, { patientId });
  wsBroadcast("message.new", { message }, { patientId });
  return Response.json({ message });
}
