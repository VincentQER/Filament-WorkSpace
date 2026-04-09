import { NextResponse } from "next/server";
import { readAuthFromCookie } from "@/lib/auth";
import {
  normalizeAvatarUrl,
  normalizePrintersInput,
  rowToPublicProfile,
} from "@/lib/user-profile";
import { userGetProfileRow, userUpdateProfileFields } from "@/lib/repos/users";

export async function PATCH(request: Request) {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await userGetProfileRow(auth.userId);

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

  await userUpdateProfileFields({
    userId: auth.userId,
    displayName: displayNameStored,
    avatarUrl: avatarStored,
    address: addressStored,
    printersJson,
  });

  const row = await userGetProfileRow(auth.userId);

  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: rowToPublicProfile(row, auth.userId, auth.email),
  });
}
