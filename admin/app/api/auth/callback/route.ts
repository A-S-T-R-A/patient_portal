import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL;
  const PATIENT_PORTAL_URL = process.env.PATIENT_PORTAL_URL;

  if (!ADMIN_BASE_URL) {
    const fallbackUrl = PATIENT_PORTAL_URL || "http://localhost:8081";
    return NextResponse.redirect(
      `${fallbackUrl}?error=config_missing&msg=ADMIN_BASE_URL`
    );
  }
  if (!PATIENT_PORTAL_URL) {
    return NextResponse.json(
      { error: "PATIENT_PORTAL_URL environment variable is required" },
      { status: 500 }
    );
  }
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${PATIENT_PORTAL_URL}?error=oauth_missing_params`
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${PATIENT_PORTAL_URL}?error=oauth_not_configured`
    );
  }

  let state: { role: string; redirectAfter?: string };
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64").toString());
  } catch {
    return NextResponse.redirect(`${PATIENT_PORTAL_URL}?error=invalid_state`);
  }

  const { role, redirectAfter } = state;

  // Only allow patient role via OAuth
  if (role !== "patient") {
    return NextResponse.redirect(
      `${PATIENT_PORTAL_URL}?error=oauth_patients_only`
    );
  }

  try {
    const client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${ADMIN_BASE_URL}/api/auth/callback`
    );

    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.redirect(`${PATIENT_PORTAL_URL}?error=no_id_token`);
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.redirect(`${PATIENT_PORTAL_URL}?error=invalid_token`);
    }

    const { email, name, picture, sub: googleId } = payload;

    // Find or create patient
    let patient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          email,
          name: name || email.split("@")[0],
          googleId,
          picture: picture || null,
        },
      });
    } else {
      // Update patient if googleId or picture changed
      if (googleId && patient.googleId !== googleId) {
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: { googleId, picture: picture || patient.picture },
        });
      }
    }

    // Generate JWT token for patient
    const token = await signToken({
      userId: patient.id,
      email: patient.email,
      role: "patient",
      googleId: patient.googleId || undefined,
    });

    // Determine redirect URL - always redirect to patient portal for patients
    let redirectUrl = PATIENT_PORTAL_URL!;

    // If redirectAfter is provided and is a valid patient portal URL, use it
    if (redirectAfter) {
      try {
        const redirectUrlObj = new URL(redirectAfter);
        const patientPortalUrlObj = new URL(PATIENT_PORTAL_URL!);
        // Only use redirectAfter if it's from the same origin as patient portal
        if (redirectUrlObj.origin === patientPortalUrlObj.origin) {
          redirectUrl = redirectAfter;
        }
      } catch (e) {
        // Invalid URL, use default patient portal
        console.warn("Invalid redirectAfter URL:", redirectAfter);
      }
    }

    // Check if redirect URL is cross-domain (different origin)
    const redirectOrigin = redirectUrl ? new URL(redirectUrl).origin : null;
    const adminOrigin = new URL(ADMIN_BASE_URL!).origin;
    const isCrossDomain = redirectOrigin !== adminOrigin;

    // Create response
    const response = NextResponse.redirect(redirectUrl);

    if (isCrossDomain) {
      // Cross-domain: add token to URL as fallback (will be saved to localStorage)
      const url = new URL(redirectUrl);
      url.searchParams.set("_auth_token", token);
      return NextResponse.redirect(url.toString());
    } else {
      // Same-domain: set HTTP-only cookie
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });
      return response;
    }
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    // Ensure PATIENT_PORTAL_URL is set before redirecting
    const errorRedirect = PATIENT_PORTAL_URL || "http://localhost:8081";
    return NextResponse.redirect(
      `${errorRedirect}?error=oauth_failed&details=${encodeURIComponent(
        error?.message || "Unknown error"
      )}`
    );
  }
}
