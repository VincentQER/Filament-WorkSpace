import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readAuthFromCookie } from "@/lib/auth";
import { rowToPublicProfile } from "@/lib/user-profile";

export async function GET() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ authenticated: false }, { status: 401 });

  const row = db
    .prepare(
      "SELECT email, display_name, avatar_url, address, printers_json FROM users WHERE id = ?",
    )
    .get(auth.userId) as
    | {
        email: string;
        display_name: string | null;
        avatar_url: string | null;
        address: string | null;
        printers_json: string | null;
      }
    | undefined;

  if (!row) {
    return NextResponse.json({
      authenticated: true,
      user: rowToPublicProfile(
        {
          email: auth.email,
          display_name: null,
          avatar_url: null,
          address: null,
          printers_json: null,
        },
        auth.userId,
        auth.email,
      ),
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: rowToPublicProfile(row, auth.userId, auth.email),
  });
}
