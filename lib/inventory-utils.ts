import { normalizeItem, recalculateItem } from "@/lib/inventory-normalize";
import { type Item } from "@/lib/inventory-types";

export function mergeMatches(matches: Item[]): Item {
  if (matches.length === 1) return normalizeItem(matches[0]!);
  const base = normalizeItem(matches[0]!);
  const sum = matches.reduce(
    (a, i) => ({
      spools: a.spools + i.spools,
      refills: a.refills + i.refills,
      open: a.open + i.openSpoolWeight,
    }),
    { spools: 0, refills: 0, open: 0 },
  );
  return recalculateItem({
    ...base,
    stockByLocation: base.stockByLocation.map((s, idx) =>
      idx === 0
        ? {
            ...s,
            spools: sum.spools,
            refills: sum.refills,
            openSpoolWeight: Math.min(1000, sum.open),
          }
        : s,
    ),
    updatedAt: Date.now(),
  });
}
