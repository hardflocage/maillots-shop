import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mlt_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type SessionPayload = { uid: string; role: "CUSTOMER" | "ADMIN" };

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum).");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string") return null;
    return { uid: payload.uid, role: payload.role === "ADMIN" ? "ADMIN" : "CUSTOMER" };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
