import {
  FALLBACK_THIRD_PARTY_MATERIAL_LINES,
  thirdPartyCatalogLinesForBrand,
} from "@/lib/search-catalog";
import {
  bambuColors,
  colorsForBrandCatalog,
  itemMatchesAnyCatalogEntry,
  itemMatchesBrandCatalogEntry,
  sunluColors,
} from "@/lib/inventory-catalog";
import { mergeMatches } from "@/lib/inventory-utils";
import { normalizeItem } from "@/lib/inventory-normalize";
import { BAMBU_BRAND, SUNLU_BRAND, type Item, normalizeKey } from "@/lib/inventory-types";

/** Per fixed color catalog material line (Bambu Lab, SUNLU, ...). */
export function statsForBrandCatalogLine(items: Item[], catalogBrand: string, material: string) {
  const n = items.map(normalizeItem);
  const mk = normalizeKey(material);
  const entries = colorsForBrandCatalog(catalogBrand).filter((e) => normalizeKey(e.material) === mk);
  let fullSpools = 0;
  let refills = 0;
  let openG = 0;
  let colorsWithStock = 0;
  for (const entry of entries) {
    const matches = n.filter((i) => itemMatchesBrandCatalogEntry(i, catalogBrand, entry));
    if (matches.length === 0) continue;
    const merged = mergeMatches(matches);
    fullSpools += merged.spools;
    refills += merged.refills;
    openG += merged.openSpoolWeight;
    if (merged.spools + merged.refills + merged.openSpoolWeight > 0) {
      colorsWithStock += 1;
    }
  }
  return {
    availableColors: entries.length,
    colorsWithStock,
    fullSpools,
    refills,
    openG,
    /** Full spools + refills (each counts as one roll). */
    totalRolls: fullSpools + refills,
  };
}

/** Per official Bambu catalog material line (e.g. PLA Basic, ABS). */
export function statsForBambuCatalogLine(items: Item[], material: string) {
  return statsForBrandCatalogLine(items, BAMBU_BRAND, material);
}

/** All official catalog lines combined - "Bambu Lab" brand totals only. */
export function statsForBambuLabCatalogOverall(items: Item[]) {
  const materials = [...new Set(bambuColors.map((e) => e.material))];
  let totalRolls = 0;
  let openG = 0;
  let colorsWithStock = 0;
  for (const m of materials) {
    const s = statsForBambuCatalogLine(items, m);
    totalRolls += s.totalRolls;
    openG += s.openG;
    colorsWithStock += s.colorsWithStock;
  }
  return {
    catalogColorSlots: bambuColors.length,
    colorsWithStock,
    totalRolls,
    openG,
  };
}

/**
 * Bambu Lab: official lines from `bambu-colors.json` plus any extra `type` values on saved rolls.
 * Other brands: curated + DB-aggregated lines from `search-catalog.json` (see `npm run sync:catalog`),
 * then generic fallbacks if needed, then any custom `type` values from your inventory.
 */
export function materialLinesForWorkspaceBrand(items: Item[], brand: string): string[] {
  const bk = normalizeKey(brand);
  const fromItems = new Set<string>();
  const n = items.map(normalizeItem);
  for (const i of n) {
    if (itemMatchesAnyCatalogEntry(i)) continue;
    if (normalizeKey(i.brand) !== bk) continue;
    const t = i.type?.trim();
    if (t) fromItems.add(t);
  }

  const catalogMaterials =
    bk === normalizeKey(BAMBU_BRAND)
      ? [...new Set(bambuColors.map((e) => e.material))]
      : bk === normalizeKey(SUNLU_BRAND)
        ? [...new Set(sunluColors.map((e) => e.material))].sort((a, b) => a.localeCompare(b))
        : thirdPartyCatalogLinesForBrand(bk) ?? [...FALLBACK_THIRD_PARTY_MATERIAL_LINES];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of catalogMaterials) {
    seen.add(normalizeKey(m));
    out.push(m);
  }
  for (const t of [...fromItems].sort((a, b) => a.localeCompare(b))) {
    if (!seen.has(normalizeKey(t))) {
      seen.add(normalizeKey(t));
      out.push(t);
    }
  }
  return out;
}

export function itemsForWorkspaceBrandMaterial(items: Item[], brand: string, material: string): Item[] {
  const n = items.map(normalizeItem);
  const mk = normalizeKey(material);
  const bk = normalizeKey(brand);
  return n.filter(
    (i) => !itemMatchesAnyCatalogEntry(i) && normalizeKey(i.brand) === bk && normalizeKey(i.type) === mk,
  );
}

/** Per material line for a third-party brand (matches Bambu line card field names). */
export function statsForWorkspaceBrandMaterial(items: Item[], brand: string, material: string) {
  const mk = normalizeKey(material);
  const catLine = colorsForBrandCatalog(brand).some((e) => normalizeKey(e.material) === mk);
  if (catLine) {
    return statsForBrandCatalogLine(items, brand, material);
  }
  const rows = itemsForWorkspaceBrandMaterial(items, brand, material);
  let fullSpools = 0;
  let refills = 0;
  let openG = 0;
  let colorsWithStock = 0;
  for (const i of rows) {
    fullSpools += i.spools;
    refills += i.refills;
    openG += i.openSpoolWeight;
    if (i.spools + i.refills + i.openSpoolWeight > 0) colorsWithStock += 1;
  }
  return {
    /** Saved color rows for this material (your data, not a fixed catalog count). */
    availableColors: rows.length,
    colorsWithStock,
    fullSpools,
    refills,
    openG,
    totalRolls: fullSpools + refills,
  };
}

export function statsForWorkspaceBrandOverall(items: Item[], brand: string) {
  const n = items.map(normalizeItem);
  const bk = normalizeKey(brand);
  const rows = n.filter((i) => normalizeKey(i.brand) === bk);
  let fullSpools = 0;
  let refills = 0;
  let openG = 0;
  let colorsWithStock = 0;
  for (const i of rows) {
    fullSpools += i.spools;
    refills += i.refills;
    openG += i.openSpoolWeight;
    if (i.spools + i.refills + i.openSpoolWeight > 0) colorsWithStock += 1;
  }
  const lines = materialLinesForWorkspaceBrand(items, brand);
  return {
    materialLineCount: lines.length,
    savedColorLines: rows.length,
    colorsWithStock,
    totalRolls: fullSpools + refills,
    openG,
  };
}

/** Compact stats for workspace sidebar (Bambu catalog vs other brands). */
export function summarizeInventoryForShell(items: Item[]) {
  const n = items.map(normalizeItem);
  const bambu = n.filter((i) => i.brand === BAMBU_BRAND);
  const withStock = new Set<string>();
  let bambuSpools = 0;
  let bambuRefills = 0;
  let bambuOpen = 0;
  for (const i of bambu) {
    bambuSpools += i.spools;
    bambuRefills += i.refills;
    bambuOpen += i.openSpoolWeight;
    if (i.spools + i.refills + i.openSpoolWeight > 0) {
      withStock.add(`${i.type}|${i.color.trim().toLowerCase()}`);
    }
  }
  const other = n.filter((i) => normalizeKey(i.brand) !== normalizeKey(BAMBU_BRAND));
  let otherSpools = 0;
  let otherRefills = 0;
  let otherOpen = 0;
  for (const i of other) {
    otherSpools += i.spools;
    otherRefills += i.refills;
    otherOpen += i.openSpoolWeight;
  }
  const totalFullRolls = bambuSpools + bambuRefills + otherSpools + otherRefills;
  return {
    bambuColorKinds: withStock.size,
    bambuSpools,
    bambuRefills,
    bambuOpen,
    otherLines: other.length,
    otherSpools,
    otherRefills,
    otherOpen,
    totalFullRolls,
  };
}
