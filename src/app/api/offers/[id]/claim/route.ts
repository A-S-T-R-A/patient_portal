import { NextRequest, NextResponse } from "next/server";
import { getState, trackOfferClaim } from "@/shared/mockDb";
import { validateOfferId } from "@/shared/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!validateOfferId(id)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 });
    }

    const state = getState();
    const offer = state.offers.find((offer) => offer.id === id);

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    trackOfferClaim(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to claim offer" },
      { status: 500 }
    );
  }
}
