import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createAuthToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim() ?? "";
  if (!email || !password)
    return NextResponse.json({ error: "Please enter email and password." }, { status: 400 });

  const user = db
    .prepare(
      "SELECT id, email, password_hash, COALESCE(email_verified, 0) AS email_verified FROM users WHERE email = ?",
    )
    .get(email) as { id: number; email: string; password_hash: string; email_verified: number } | undefined;
  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!user.email_verified) {
    return NextResponse.json(
      {
        error: "Verify your email first: open the link we sent you, then sign in.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
  }

  const token = await createAuthToken(user.id, user.email);
  await setAuthCookie(token);
  return NextResponse.json({ ok: true, email: user.email });
}
