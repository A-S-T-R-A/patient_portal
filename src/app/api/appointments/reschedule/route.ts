import { NextRequest, NextResponse } from "next/server";
import { getState, rescheduleAppointment } from "@/shared/mockDb";
import { validateDateISO } from "@/shared/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateISO } = body;

    if (!validateDateISO(dateISO)) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const success = rescheduleAppointment(dateISO);
    if (!success) {
      return NextResponse.json(
        { error: "No appointment found to reschedule" },
        { status: 404 }
      );
    }

    const state = getState();
    return NextResponse.json(state.userSummary.nextAppointment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reschedule appointment" },
      { status: 500 }
    );
  }
}
