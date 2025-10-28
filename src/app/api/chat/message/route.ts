import { NextRequest, NextResponse } from "next/server";
import { appendMessage } from "@/shared/mockDb";
import { validateMessageText } from "@/shared/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!validateMessageText(text)) {
      return NextResponse.json(
        { error: "Invalid message text" },
        { status: 400 }
      );
    }

    const newMessage = appendMessage(text);
    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
