import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "inventory_auth";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-insecure-secret-change-me");

export async function createAuthToken(userId: number, email: string) {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function readAuthFromCookie() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
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
