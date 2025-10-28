import { NextRequest, NextResponse } from "next/server";
import { getState, toggleNotificationSettings } from "@/shared/mockDb";
import { validateNotificationSettings } from "@/shared/validators";

export async function GET() {
  try {
    const state = getState();
    return NextResponse.json(state.notificationSettings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!validateNotificationSettings(body)) {
      return NextResponse.json(
        { error: "Invalid notification settings" },
        { status: 400 }
      );
    }

    const updatedSettings = toggleNotificationSettings(body);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
