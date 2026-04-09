import { NextResponse } from "next/server";
import {
  userFindVerificationPendingByToken,
  userMarkEmailVerified,
} from "@/lib/repos/users";

function redirect(request: Request, query: string) {
  const base = new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/auth/login?${query}`, base));
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return redirect(request, "verify=invalid");

  const row = await userFindVerificationPendingByToken(token);

  if (!row) return redirect(request, "verify=invalid");

  const exp = row.verification_expires_at ? new Date(row.verification_expires_at).getTime() : 0;
  if (!exp || Number.isNaN(exp) || exp < Date.now()) {
    return redirect(request, "verify=expired");
  }

  await userMarkEmailVerified(row.id);

  return redirect(request, "verified=1");
}
