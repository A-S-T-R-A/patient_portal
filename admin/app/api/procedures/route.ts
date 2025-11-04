import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      treatmentPlanId,
      appointmentId,
      title,
      description,
      scheduledDate,
    } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
      });
    }

    const procedure = await prisma.procedure.create({
      data: {
        treatmentPlanId: treatmentPlanId || undefined,
        appointmentId: appointmentId || undefined,
        title,
        description: description || undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        status: "planned",
      },
      include: {
        treatmentPlan: {
          select: {
            id: true,
            title: true,
          },
        },
        appointment: {
          select: {
            id: true,
            title: true,
            datetime: true,
          },
        },
      },
    });

    // Emit socket event for real-time updates
    if (treatmentPlanId) {
      const plan = await prisma.treatmentPlan.findUnique({
        where: { id: treatmentPlanId },
        select: { patientId: true },
      });
      if (plan) {
        const { emitTreatmentUpdate } = await import("@/server/rt/publish");
        emitTreatmentUpdate(plan.patientId, procedure);
      }
    }

    return Response.json({ procedure });
  } catch (error: any) {
    console.error("Create procedure error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create procedure" }),
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Procedure ID is required" }),
        { status: 400 }
      );
    }

    const procedure = await prisma.procedure.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
        ...(updates.scheduledDate && {
          scheduledDate: new Date(updates.scheduledDate),
        }),
        ...(updates.status && { status: updates.status }),
        ...(updates.completedDate && {
          completedDate: new Date(updates.completedDate),
        }),
      },
      include: {
        treatmentPlan: {
          select: {
            id: true,
            patientId: true,
          },
        },
      },
    });

    // Emit socket event
    if (procedure.treatmentPlan) {
      const { emitTreatmentUpdate } = await import("@/server/rt/publish");
      emitTreatmentUpdate(procedure.treatmentPlan.patientId, procedure);
    }

    return Response.json({ procedure });
  } catch (error: any) {
    console.error("Update procedure error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update procedure" }),
      { status: 500 }
    );
  }
}
