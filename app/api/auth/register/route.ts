import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { newVerificationToken, verificationExpiryIso } from "@/lib/verification";

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

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (existing) return NextResponse.json({ error: "That email is already registered." }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const token = newVerificationToken();
  const expires = verificationExpiryIso(48);

  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_expires_at)
       VALUES (?, ?, 0, ?, ?)`,
    )
    .run(email, hash, token, expires);

  const userId = Number(result.lastInsertRowid);

  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const sent = await sendVerificationEmail({ to: email, verifyUrl });
  if (!sent.ok) {
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    return NextResponse.json({ error: sent.error }, { status: 500 });
  }

  const payload: {
    ok: true;
    needsVerification: true;
    email: string;
    devVerificationUrl?: string;
  } = { ok: true, needsVerification: true, email };

  if (sent.devLogged && process.env.NODE_ENV === "development") {
    payload.devVerificationUrl = verifyUrl;
  }

  return NextResponse.json(payload);
}
