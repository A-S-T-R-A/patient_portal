import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  try {
    // Get all patients who have messages
    const patientsWithMessages = await prisma.message.findMany({
      select: {
        patientId: true,
      },
      distinct: ["patientId"],
    });

    const patientIds = [
      ...new Set(patientsWithMessages.map((m) => m.patientId)),
    ];

    if (patientIds.length === 0) {
      return Response.json({ chats: [] });
    }

    // Build where clause
    const where: any = {
      id: { in: patientIds },
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    // Get patients with their latest message
    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get latest message for each patient
    const chats = await Promise.all(
      patients.map(async (patient) => {
        const latestMessage = await prisma.message.findFirst({
          where: { patientId: patient.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            sender: true,
            createdAt: true,
          },
        });

        // Count unread messages (messages from patient after last doctor message)
        const lastDoctorMessage = await prisma.message.findFirst({
          where: {
            patientId: patient.id,
            sender: "doctor",
          },
          orderBy: { createdAt: "desc" },
        });

        const unreadCount = lastDoctorMessage
          ? await prisma.message.count({
              where: {
                patientId: patient.id,
                sender: "patient",
                createdAt: { gt: lastDoctorMessage.createdAt },
              },
            })
          : await prisma.message.count({
              where: {
                patientId: patient.id,
                sender: "patient",
              },
            });

        return {
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            picture: patient.picture,
          },
          latestMessage: latestMessage
            ? {
                content: latestMessage.content,
                sender: latestMessage.sender,
                createdAt: latestMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by latest message time
    chats.sort((a, b) => {
      if (!a.latestMessage && !b.latestMessage) return 0;
      if (!a.latestMessage) return 1;
      if (!b.latestMessage) return -1;
      return (
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
      );
    });

    return Response.json({ chats });
  } catch (e) {
    console.error("Chats API error:", e);
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 500,
    });
  }
}
