/** Shared profile fields for /api/auth/me and client state. */
export type PublicUserProfile = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string;
  address: string;
  printers: string[];
};

export function parsePrintersJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function normalizePrintersInput(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((x) => x.slice(0, 120));
}

/** Returns cleaned URL or empty if invalid / disallowed. */
export function normalizeAvatarUrl(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const t = input.trim().slice(0, 2048);
  if (!t) return { ok: true, value: "" };
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "Avatar URL must start with http:// or https://" };
    }
    return { ok: true, value: t };
  } catch {
    return { ok: false, error: "Invalid avatar URL" };
  }
}

export function rowToPublicProfile(
  row: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    address: string | null;
    printers_json: string | null;
  },
  userId: number,
  fallbackEmail: string,
): PublicUserProfile {
  const email = row.email || fallbackEmail;
  return {
    id: userId,
    email,
    displayName: row.display_name?.trim() ?? "",
    avatarUrl: row.avatar_url?.trim() ?? "",
    address: row.address?.trim() ?? "",
    printers: parsePrintersJson(row.printers_json),
  };
}
