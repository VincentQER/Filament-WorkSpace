import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { userCreateActiveAccount, userFindExistingIdByEmail } from "@/lib/repos/users";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Invalid email or password. Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const existing = await userFindExistingIdByEmail(email);
  if (existing) return NextResponse.json({ error: "That email is already registered." }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const userId = await userCreateActiveAccount({ email, password_hash: hash });

  const token = await createAuthToken(userId, email);
  await setAuthCookie(token);

  return NextResponse.json({ ok: true, email });
}
