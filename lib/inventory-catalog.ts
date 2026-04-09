import bambuColorsData from "@/data/bambu-colors.json";
import sunluColorsData from "@/data/sunlu-colors.json";
import { BAMBU_BRAND, SUNLU_BRAND, type CatalogColorJson, type Item, normalizeKey } from "@/lib/inventory-types";

export const bambuColors = bambuColorsData as CatalogColorJson[];
export const sunluColors = sunluColorsData as CatalogColorJson[];

export function colorsForBrandCatalog(brand: string): CatalogColorJson[] {
  const bk = normalizeKey(brand);
  if (bk === normalizeKey(BAMBU_BRAND)) return bambuColors;
  if (bk === normalizeKey(SUNLU_BRAND)) return sunluColors;
  return [];
}

/** Workspace brands with a fixed color table (same UX as Bambu Lab tables). */
export function workspaceBrandHasColorCatalog(brand: string): boolean {
  const bk = normalizeKey(brand);
  return bk === normalizeKey(SUNLU_BRAND);
}

export function catalogHasMaterialLine(brand: string, material: string): boolean {
  const mk = normalizeKey(material);
  return colorsForBrandCatalog(brand).some((e) => normalizeKey(e.material) === mk);
}

/** Matches a catalog row: same brand + material + color name (legacy names with material suffix OK). */
export function itemMatchesBrandCatalogEntry(item: Item, catalogBrand: string, entry: CatalogColorJson): boolean {
  if (normalizeKey(item.brand) !== normalizeKey(catalogBrand)) return false;
  if (normalizeKey(item.type) !== normalizeKey(entry.material)) return false;
  const cn = normalizeKey(item.color);
  const en = normalizeKey(entry.name);
  if (cn === en) return true;
  const fullName = normalizeKey(item.name);
  if (fullName === en) return true;
  if (fullName.startsWith(en + " ") || fullName.startsWith(en + "(")) return true;
  return false;
}

export function itemMatchesCatalogEntry(item: Item, entry: CatalogColorJson): boolean {
  return itemMatchesBrandCatalogEntry(item, BAMBU_BRAND, entry);
}

export function itemMatchesAnyCatalogEntry(item: Item): boolean {
  if (bambuColors.some((e) => itemMatchesBrandCatalogEntry(item, BAMBU_BRAND, e))) return true;
  if (sunluColors.some((e) => itemMatchesBrandCatalogEntry(item, SUNLU_BRAND, e))) return true;
  return false;
}
