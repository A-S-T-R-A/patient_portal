import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/shared/mockDb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const state = getState();
    const messages = state.chatMessages
      .sort(
        (a, b) =>
          new Date(a.timestampISO).getTime() -
          new Date(b.timestampISO).getTime()
      )
      .slice(-limit);

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
