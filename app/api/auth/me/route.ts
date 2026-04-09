import { NextResponse } from "next/server";
import { readAuthFromCookie } from "@/lib/auth";
import { rowToPublicProfile } from "@/lib/user-profile";
import { userGetProfileRow, userGetRole } from "@/lib/repos/users";

export async function GET() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ authenticated: false }, { status: 401 });

  // Fetch profile and role in parallel — role is needed for isAdmin on the client.
  const [row, role] = await Promise.all([
    userGetProfileRow(auth.userId),
    userGetRole(auth.userId),
  ]);

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
          role,
        },
        auth.userId,
        auth.email,
      ),
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: rowToPublicProfile({ ...row, role }, auth.userId, auth.email),
  });
}
