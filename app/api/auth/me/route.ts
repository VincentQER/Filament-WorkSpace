import { NextResponse } from "next/server";
import { readAuthFromCookie } from "@/lib/auth";
import { rowToPublicProfile } from "@/lib/user-profile";
import { userGetProfileRow } from "@/lib/repos/users";

export async function GET() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ authenticated: false }, { status: 401 });

  const row = await userGetProfileRow(auth.userId);

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
