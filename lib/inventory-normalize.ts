import { BAMBU_BRAND, DEFAULT_LOCATION, type CatalogColorJson, type Item, normalizeHex } from "@/lib/inventory-types";

export function recalculateItem(item: Item): Item {
  const totals = item.stockByLocation.reduce(
    (acc, s) => ({
      spools: acc.spools + s.spools,
      refills: acc.refills + s.refills,
      openSpoolWeight: acc.openSpoolWeight + s.openSpoolWeight,
    }),
    { spools: 0, refills: 0, openSpoolWeight: 0 },
  );
  return { ...item, ...totals };
}

export function normalizeItem(raw: Item): Item {
  const locations =
    Array.isArray(raw.locations) && raw.locations.length > 0 ? raw.locations : [raw.location || DEFAULT_LOCATION];
  const stockByLocation =
    Array.isArray(raw.stockByLocation) && raw.stockByLocation.length > 0
      ? raw.stockByLocation.map((s) => ({
          location: s.location || DEFAULT_LOCATION,
          spools: Math.max(0, Math.floor(Number(s.spools) || 0)),
          refills: Math.max(0, Math.floor(Number(s.refills) || 0)),
          openSpoolWeight: Math.min(1000, Math.max(0, Math.floor(Number(s.openSpoolWeight) || 0))),
        }))
      : [
          {
            location: raw.location || DEFAULT_LOCATION,
            spools: Math.max(0, Math.floor(Number(raw.spools) || 0)),
            refills: Math.max(0, Math.floor(Number(raw.refills) || 0)),
            openSpoolWeight: Math.min(1000, Math.max(0, Math.floor(Number(raw.openSpoolWeight) || 0))),
          },
        ];
  return recalculateItem({
    ...raw,
    locations,
    location: locations.includes(raw.location) ? raw.location : locations[0]!,
    stockByLocation,
    sku: typeof raw.sku === "string" ? raw.sku : "",
    colorHex: normalizeHex(raw.colorHex),
    minStock: Math.max(0, Math.floor(Number(raw.minStock) || 0)),
    favorite: Boolean(raw.favorite),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
  });
}

export function makeCatalogItem(entry: CatalogColorJson, catalogBrand: string = BAMBU_BRAND): Item {
  return {
    id: crypto.randomUUID(),
    name: entry.name,
    brand: catalogBrand,
    type: entry.material,
    color: entry.name,
    sku: entry.sku ?? "",
    colorHex: normalizeHex(entry.hex),
    location: DEFAULT_LOCATION,
    locations: [DEFAULT_LOCATION],
    stockByLocation: [{ location: DEFAULT_LOCATION, spools: 0, refills: 0, openSpoolWeight: 0 }],
    status: "owned",
    buyMore: false,
    spools: 0,
    refills: 0,
    openSpoolWeight: 0,
    minStock: 0,
    favorite: false,
    updatedAt: Date.now(),
    note: "",
  };
}

export function makeCustomFilamentItem(opts: {
  brand: string;
  type: string;
  color: string;
  name?: string;
  sku?: string;
  colorHex?: string;
  spools?: number;
  refills?: number;
  openSpoolWeight?: number;
}): Item {
  const color = opts.color.trim();
  const name = (opts.name?.trim() || color) || "Unnamed";
  return normalizeItem({
    id: crypto.randomUUID(),
    name,
    brand: opts.brand.trim() || "Other",
    type: opts.type.trim() || "Filament",
    color: color || name,
    sku: opts.sku?.trim() ?? "",
    colorHex: normalizeHex(opts.colorHex),
    location: DEFAULT_LOCATION,
    locations: [DEFAULT_LOCATION],
    stockByLocation: [
      {
        location: DEFAULT_LOCATION,
        spools: Math.max(0, Math.floor(opts.spools ?? 0)),
        refills: Math.max(0, Math.floor(opts.refills ?? 0)),
        openSpoolWeight: Math.min(
          1000,
          Math.max(0, Math.floor(opts.openSpoolWeight ?? 0)),
        ),
      },
    ],
    status: "owned",
    buyMore: false,
    spools: 0,
    refills: 0,
    openSpoolWeight: 0,
    minStock: 0,
    favorite: false,
    updatedAt: Date.now(),
    note: "",
  });
}
