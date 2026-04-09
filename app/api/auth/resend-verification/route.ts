import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { newVerificationToken, verificationExpiryIso } from "@/lib/verification";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim() ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Please enter email and password." }, { status: 400 });
  }

  const user = db
    .prepare(
      "SELECT id, password_hash, COALESCE(email_verified, 0) AS email_verified FROM users WHERE email = ?",
    )
    .get(email) as { id: number; password_hash: string; email_verified: number } | undefined;

  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (user.email_verified) {
    return NextResponse.json({ error: "This email is already verified. Sign in instead." }, { status: 400 });
  }

  const token = newVerificationToken();
  const expires = verificationExpiryIso(48);
  db.prepare("UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?").run(
    token,
    expires,
    user.id,
  );

  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const sent = await sendVerificationEmail({ to: email, verifyUrl });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 500 });
  }

  const payload: { ok: true; devVerificationUrl?: string } = { ok: true };
  if (sent.devLogged && process.env.NODE_ENV === "development") {
    payload.devVerificationUrl = verifyUrl;
  }

  return NextResponse.json(payload);
}
