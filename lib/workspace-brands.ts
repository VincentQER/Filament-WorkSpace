import type { Item } from "@/lib/inventory-item";
import { BAMBU_BRAND, normalizeKey } from "@/lib/inventory-item";

const RESERVED = /^bambu\s*lab$/i;

export function isReservedWorkspaceBrand(name: string): boolean {
  return RESERVED.test(name.trim());
}

export function normalizeWorkspaceBrandInput(raw: string): string | null {
  const t = raw.trim().slice(0, 80);
  if (!t) return null;
  if (isReservedWorkspaceBrand(t)) return null;
  return t;
}

export function parseWorkspaceBrandsJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of p) {
      if (typeof x !== "string") continue;
      const n = normalizeWorkspaceBrandInput(x);
      if (!n || seen.has(n.toLowerCase())) continue;
      seen.add(n.toLowerCase());
      out.push(n);
    }
    return out.sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function serializeWorkspaceBrands(brands: string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of brands) {
    const n = normalizeWorkspaceBrandInput(b);
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push(n);
  }
  out.sort((a, b) => a.localeCompare(b));
  return JSON.stringify(out);
}

/** Brands appearing on non-catalog inventory rows (excludes reserved). */
export function distinctBrandsFromOtherItems(items: Item[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of items) {
    if (normalizeKey(i.brand) === normalizeKey(BAMBU_BRAND)) continue;
    const b = normalizeWorkspaceBrandInput(i.brand || "");
    if (!b) continue;
    if (seen.has(b.toLowerCase())) continue;
    seen.add(b.toLowerCase());
    out.push(b);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}
