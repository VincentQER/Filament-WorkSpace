export const BAMBU_BRAND = "Bambu Lab";
export const SUNLU_BRAND = "SUNLU";
export const DEFAULT_LOCATION = "Default";

export type ItemStatus = "none" | "wishlist" | "owned";
export type LocationStock = {
  location: string;
  spools: number;
  refills: number;
  openSpoolWeight: number;
};

export type Item = {
  id: string;
  name: string;
  brand: string;
  type: string;
  color: string;
  sku?: string;
  colorHex?: string;
  location: string;
  locations: string[];
  stockByLocation: LocationStock[];
  status: ItemStatus;
  buyMore: boolean;
  spools: number;
  refills: number;
  openSpoolWeight: number;
  minStock: number;
  favorite: boolean;
  updatedAt: number;
  note: string;
};

export type BambuColorJson = {
  material: string;
  name: string;
  hex: string;
  sku?: string;
  /** Optional official / product reference image (URL or `/public` path). */
  previewUrl?: string;
  /** Direct link to the exact color variant on the Bambu Lab store (?id=VARIANT_ID). */
  storeUrl?: string;
  source?: string;
};
export type CatalogColorJson = BambuColorJson;

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeHex(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  const prefixed = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9A-Fa-f]{6}$/.test(prefixed) ? prefixed.toUpperCase() : undefined;
}
