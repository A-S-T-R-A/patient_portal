import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-secret-key-min-32-chars"
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: "doctor" | "patient";
  googleId?: string;
  [key: string]: string | undefined; // Index signature for jose compatibility
}

export async function signToken(payload: JWTPayload, expiresIn: string = "7d"): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
