import { NextRequest, NextResponse } from "next/server";
import { getState, advanceStep } from "@/shared/mockDb";
import { validateStepId } from "@/shared/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stepId } = body;

    if (!validateStepId(stepId)) {
      return NextResponse.json({ error: "Invalid stepId" }, { status: 400 });
    }

    const success = advanceStep(stepId);
    if (!success) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const state = getState();
    return NextResponse.json({
      steps: state.treatmentSteps,
      progress: state.userSummary.progress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to complete step" },
      { status: 500 }
    );
  }
}
