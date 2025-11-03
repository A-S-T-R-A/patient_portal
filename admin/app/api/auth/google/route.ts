import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL;
  const PATIENT_PORTAL_URL = process.env.PATIENT_PORTAL_URL;

  if (!ADMIN_BASE_URL) {
    return NextResponse.json(
      { error: "ADMIN_BASE_URL environment variable is required" },
      { status: 500 }
    );
  }
  if (!PATIENT_PORTAL_URL) {
    return NextResponse.json(
      { error: "PATIENT_PORTAL_URL environment variable is required" },
      { status: 500 }
    );
  }
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "patient";
  const redirectAfter = searchParams.get("redirect") || "";

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  // Only allow patient role via OAuth (admin uses email/password)
  if (role !== "patient") {
    return NextResponse.redirect("/auth/login?error=oauth_patients_only");
  }

  // Always use admin base URL for callback (OAuth callback always goes to admin backend)
  const redirectUri = `${ADMIN_BASE_URL}/api/auth/callback`;

  // Store redirectAfter and role in state for callback
  const state = Buffer.from(JSON.stringify({ role, redirectAfter })).toString(
    "base64"
  );

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("access_type", "online");

  return NextResponse.redirect(googleAuthUrl.toString());
}
