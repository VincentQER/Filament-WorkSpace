import { NextResponse } from "next/server";

/** MVP: email verification disabled; keep route so old clients get a clear response. */
export async function POST() {
  return NextResponse.json(
    { error: "Email verification is not used. Sign in with the password you chose at registration." },
    { status: 410 },
  );
}
