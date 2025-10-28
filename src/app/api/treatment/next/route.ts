import { NextResponse } from "next/server";
import { getState, advanceStep } from "@/shared/mockDb";

export async function POST() {
  try {
    const state = getState();
    const currentStep = state.treatmentSteps.find(
      (step) => step.status === "current"
    );

    if (!currentStep) {
      return NextResponse.json(
        { error: "No current step found" },
        { status: 404 }
      );
    }

    const success = advanceStep(currentStep.id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to advance step" },
        { status: 500 }
      );
    }

    const updatedState = getState();
    return NextResponse.json({
      steps: updatedState.treatmentSteps,
      progress: updatedState.userSummary.progress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to advance to next step" },
      { status: 500 }
    );
  }
}
