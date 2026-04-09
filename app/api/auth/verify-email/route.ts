import { NextResponse } from "next/server";
import db from "@/lib/db";

function redirect(request: Request, query: string) {
  const base = new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/auth/login?${query}`, base));
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return redirect(request, "verify=invalid");

  const row = db
    .prepare(
      "SELECT id, verification_expires_at FROM users WHERE verification_token = ? AND COALESCE(email_verified, 0) = 0",
    )
    .get(token) as { id: number; verification_expires_at: string | null } | undefined;

  if (!row) return redirect(request, "verify=invalid");

  const exp = row.verification_expires_at ? new Date(row.verification_expires_at).getTime() : 0;
  if (!exp || Number.isNaN(exp) || exp < Date.now()) {
    return redirect(request, "verify=expired");
  }

  db.prepare(
    "UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE id = ?",
  ).run(row.id);

  return redirect(request, "verified=1");
}
