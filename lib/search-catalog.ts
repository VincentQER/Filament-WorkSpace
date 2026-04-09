import searchCatalogJson from "@/data/search-catalog.json";

export type SearchCatalog = typeof searchCatalogJson;

export const searchCatalog: SearchCatalog = searchCatalogJson;

/** When a brand has no curated row and no DB aggregate yet. */
export const FALLBACK_THIRD_PARTY_MATERIAL_LINES: string[] = [
  "PLA",
  "PLA+",
  "PETG",
  "ABS",
  "ASA",
  "TPU",
  "PC",
  "PA / Nylon",
  "PVA",
  "Other",
];

export function thirdPartyCatalogLinesForBrand(brandKeyNormalized: string): string[] | undefined {
  const mats = searchCatalog.brandMaterials as Record<string, string[] | undefined>;
  const lines = mats[brandKeyNormalized];
  if (Array.isArray(lines) && lines.length > 0) return [...lines];
  return undefined;
}
