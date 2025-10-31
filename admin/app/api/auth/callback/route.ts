import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/api/auth/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect("/auth/error?message=missing_params");
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect("/auth/error?message=not_configured");
  }

  try {
    const { role, redirectAfter } = JSON.parse(state);

    // Exchange code for tokens
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.id_token) {
      throw new Error("No ID token received");
    }

    // Verify ID token and get user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid token payload");
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      throw new Error("Missing email or Google ID");
    }

    // Find or create user
    let userId: string;
    if (role === "doctor") {
      const doctor = await prisma.doctor.upsert({
        where: { email },
        update: {
          googleId,
          picture: picture || undefined,
          name: name || email.split("@")[0],
        },
        create: {
          email,
          googleId,
          picture: picture || undefined,
          name: name || email.split("@")[0],
        },
      });
      userId = doctor.id;
    } else {
      const patient = await prisma.patient.upsert({
        where: { email },
        update: {
          googleId,
          picture: picture || undefined,
          name: name || email.split("@")[0],
        },
        create: {
          email,
          googleId,
          picture: picture || undefined,
          name: name || email.split("@")[0],
        },
      });
      userId = patient.id;
    }

    // Generate JWT
    const token = await signToken({
      userId,
      email,
      role: role as "doctor" | "patient",
      googleId,
    });

    // Redirect with token
    const redirectUrl = new URL(redirectAfter || "/", request.url.split("/api")[0]);
    redirectUrl.searchParams.set("token", token);

    const response = NextResponse.redirect(redirectUrl);
    
    // Also set HTTP-only cookie for security
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `/auth/error?message=${encodeURIComponent(error.message || "unknown_error")}`
    );
  }
}

