"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bambuColors, statsForBambuLabCatalogOverall } from "@/lib/inventory-item";
import { useInventoryWorkspaceContext } from "@/components/inventory/InventoryWorkspaceContext";
import { WORKSHOP_PRODUCTS, amazonUrl, amazonImageUrl } from "@/data/workshop-products";
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";

/** An item is considered low-stock if it has nothing sealed and under 200 g open. */
function isLowStock(item: { spools: number; refills: number; openSpoolWeight: number }) {
  return item.spools + item.refills === 0 && item.openSpoolWeight < 200;
}

/** Get the best display image URL for an affiliate product row. */
function rowImageUrl(row: AffiliateProductRow): string | null {
  if (!row.image_url) return null;
  return row.image_url;
}

/** Get the best display image URL for a hardcoded product. */
function hardcodedImageUrl(imageId: string | undefined): string | null {
  if (!imageId) return null;
  if (imageId.startsWith("http")) return imageId;
  return amazonImageUrl(imageId);
}

export function InventoryHub() {
  const { authChecked, user, items } = useInventoryWorkspaceContext();
  const ready = authChecked && Boolean(user);

  const bambuLineCount = useMemo(() => new Set(bambuColors.map((e) => e.material)).size, []);
  const bambuBrand = useMemo(() => statsForBambuLabCatalogOverall(items), [items]);

  // Fetch DB affiliate products for low-stock suggestions
  const [dbProducts, setDbProducts] = useState<AffiliateProductRow[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/workshop/products");
        if (!res.ok) return;
        const data = (await res.json()) as { products: AffiliateProductRow[] };
        if (Array.isArray(data.products)) setDbProducts(data.products);
      } catch {
        // ignore — will fall back to hardcoded
      }
    })();
  }, []);

  /** Types that are running low */
  const lowStockTypes = useMemo(
    () => new Set(items.filter((i) => i.status === "owned" && isLowStock(i)).map((i) => i.type)),
    [items],
  );

  /**
   * Up to 2 filament suggestions for low-stock banner.
   * Prefer DB products; fall back to hardcoded if DB is empty.
   */
  const restockSuggestions = useMemo(() => {
    if (lowStockTypes.size === 0) return [];

    if (dbProducts.length > 0) {
      return dbProducts
        .filter(
          (p) =>
            p.category === "filament" &&
            p.material_type
              .split(",")
              .map((s) => s.trim())
              .some((m) => lowStockTypes.has(m)),
        )
        .slice(0, 2)
        .map((p) => ({
          id:         String(p.id),
          name:       p.title,
          asin:       p.asin,
          amazon_url: p.amazon_url,
          image:      rowImageUrl(p),
          price:      p.price_range,
        }));
    }

    // Hardcoded fallback
    return WORKSHOP_PRODUCTS.filter(
      (p) =>
        p.category === "filament" &&
        p.relevantMaterials?.some((m) => lowStockTypes.has(m)),
    )
      .slice(0, 2)
      .map((p) => ({
        id:         p.id,
        name:       p.name,
        asin:       p.asin,
        amazon_url: amazonUrl(p.asin),
        image:      hardcodedImageUrl(p.imageId),
        price:      p.priceRange,
      }));
  }, [lowStockTypes, dbProducts]);

  if (!ready) {
    return <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">Loading…</div>;
  }

  return (
    <div className="relative space-y-10 text-zinc-100">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">Stock</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Inventory home</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Guests use the{" "}
          <Link href="/" className="text-emerald-400/90 underline-offset-2 hover:underline">
            handbook
          </Link>
          . This workspace tracks <span className="text-zinc-300">Bambu Lab</span> filament only: pick a material line,
          then use the color table (swatch, SKU, full spools, refills, open grams).
        </p>
      </header>

      <section className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-emerald-950/25 p-5 shadow-lg shadow-black/20 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">Official catalog</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Bambu Lab</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              {bambuLineCount} material lines. Swatch, color, SKU, full, refill, open grams.
            </p>
          </div>
          <Link
            href="/my-inventory/bambu"
            className="shrink-0 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400"
          >
            Enter Bambu Lab →
          </Link>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Available colors</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{bambuBrand.catalogColorSlots}</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Colors with stock</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-emerald-300">{bambuBrand.colorsWithStock}</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Total rolls</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-emerald-300">{bambuBrand.totalRolls}</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">full + refills</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Open on spool</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-zinc-200">{bambuBrand.openG} g</dd>
          </div>
        </dl>
      </section>

      {/* Low-stock restock suggestions */}
      {restockSuggestions.length > 0 && (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl" aria-hidden>⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-300">Running low on filament</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Some of your tracked materials are nearly out. Consider restocking before your next print.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {restockSuggestions.map((product) => (
              <a
                key={product.id}
                href={product.amazon_url}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/60 px-4 py-3 transition hover:border-amber-400/30 hover:bg-zinc-900/90"
              >
                {product.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-lg object-contain"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{product.price}</p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-amber-400">
                  Amazon →
                </span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-zinc-600">
            Amazon affiliate links — we earn a small commission at no extra cost to you.
          </p>
        </section>
      )}
    </div>
  );
}
