import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie-name";

const COOKIE_NAME = AUTH_COOKIE_NAME;

const DEV_FALLBACK = "dev-insecure-secret-change-me";

function authSecretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!s || s === DEV_FALLBACK) {
      throw new Error(
        "AUTH_SECRET must be set to a long random string in production (Vercel Environment Variables).",
      );
    }
    return new TextEncoder().encode(s);
  }
  return new TextEncoder().encode(s || DEV_FALLBACK);
}

export async function createAuthToken(userId: number, email: string) {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecretKey());
}

export async function readAuthFromCookie() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    return {
      userId: Number(payload.userId),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/", expires: new Date(0) });
}
