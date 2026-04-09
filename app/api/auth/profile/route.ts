import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readAuthFromCookie } from "@/lib/auth";
import {
  normalizeAvatarUrl,
  normalizePrintersInput,
  rowToPublicProfile,
} from "@/lib/user-profile";

export async function PATCH(request: Request) {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = db
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

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    displayName?: unknown;
    avatarUrl?: unknown;
    address?: unknown;
    printers?: unknown;
  };

  let displayNameStored = existing.display_name;
  if (typeof body.displayName === "string") {
    const d = body.displayName.trim().slice(0, 120);
    displayNameStored = d.length > 0 ? d : null;
  }

  let avatarStored = existing.avatar_url;
  if (typeof body.avatarUrl === "string") {
    const norm = normalizeAvatarUrl(body.avatarUrl);
    if (!norm.ok) {
      return NextResponse.json({ error: norm.error }, { status: 400 });
    }
    avatarStored = norm.value.length > 0 ? norm.value : null;
  }

  let addressStored = existing.address;
  if (typeof body.address === "string") {
    const a = body.address.trim().slice(0, 2000);
    addressStored = a.length > 0 ? a : null;
  }

  let printersJson = existing.printers_json ?? "[]";
  if (body.printers !== undefined) {
    printersJson = JSON.stringify(normalizePrintersInput(body.printers));
  }

  db.prepare(
    `UPDATE users SET display_name = ?, avatar_url = ?, address = ?, printers_json = ? WHERE id = ?`,
  ).run(displayNameStored, avatarStored, addressStored, printersJson, auth.userId);

  const row = db
    .prepare(
      "SELECT email, display_name, avatar_url, address, printers_json FROM users WHERE id = ?",
    )
    .get(auth.userId) as {
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      address: string | null;
      printers_json: string | null;
    };

  return NextResponse.json({
    ok: true,
    user: rowToPublicProfile(row, auth.userId, auth.email),
  });
}
