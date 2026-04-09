import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { userFindByEmailForLogin } from "@/lib/repos/users";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim() ?? "";
  if (!email || !password)
    return NextResponse.json({ error: "Please enter email and password." }, { status: 400 });

  const user = await userFindByEmailForLogin(email);
  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const token = await createAuthToken(user.id, user.email);
  await setAuthCookie(token);
  return NextResponse.json({ ok: true, email: user.email });
}
