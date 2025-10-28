import { NextResponse } from "next/server";
import { getState } from "@/shared/mockDb";

export async function GET() {
  try {
    const state = getState();
    return NextResponse.json(state.offers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}
