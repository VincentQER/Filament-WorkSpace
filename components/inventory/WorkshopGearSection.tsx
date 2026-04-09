"use client";

import { useEffect, useState } from "react";
import {
  AMAZON_TAG,
  WORKSHOP_PRODUCTS,
  WORKSHOP_CATEGORIES,
  type ProductTag,
  type WorkshopProduct,
} from "@/data/workshop-products";
import { WorkshopProductCard } from "@/components/inventory/WorkshopProductCard";
import { type Item, normalizeItem } from "@/lib/inventory-item";
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";

/** Convert a DB row to the WorkshopProduct shape the existing card component expects. */
function rowToProduct(row: AffiliateProductRow): WorkshopProduct {
  // material_type is stored as a comma-separated string, e.g. "PLA,PETG"
  const relevantMaterials = row.material_type
    ? row.material_type.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  return {
    id:               String(row.id),
    name:             row.title,
    brand:            row.brand,
    asin:             row.asin,
    tagline:          row.description,
    whyItMatters:     row.highlights,
    priceRange:       row.price_range,
    category:         row.category as ProductTag,
    relevantMaterials,
    // If image_url is an Amazon CDN URL, extract the imageId so the card can
    // also build its own URL. Otherwise just store the full URL in imageId
    // and let the card render it directly (card already does: src={amazonImageUrl(imageId)}
    // when imageId is set, but we override via a custom property below).
    imageId:          row.image_url || undefined,
  };
}

export function WorkshopGearSection() {
  const [activeCategory, setActiveCategory] = useState<ProductTag | "all">("all");
  const [userMaterials, setUserMaterials] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<WorkshopProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Load products from DB; fall back to hardcoded list if DB returns empty
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/workshop/products");
        if (res.ok) {
          const data = (await res.json()) as {
            products: AffiliateProductRow[];
            source: string;
          };
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products.map(rowToProduct));
            setProductsLoaded(true);
            return;
          }
        }
      } catch {
        // network error — fall through to hardcoded
      }
      // Fallback: use the hardcoded list from data/workshop-products.ts
      setProducts(WORKSHOP_PRODUCTS);
      setProductsLoaded(true);
    })();
  }, []);

  // Load user's inventory for personalisation
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) return;
      const inv = (await res.json()) as { items: Item[] };
      if (!Array.isArray(inv.items)) return;
      const mats = new Set(inv.items.map(normalizeItem).map((i) => i.type));
      setUserMaterials(mats);
    })();
  }, []);

  const isRelevant = (product: WorkshopProduct) =>
    product.relevantMaterials?.some((m) => userMaterials.has(m)) ?? false;

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    const ra = isRelevant(a) ? 0 : 1;
    const rb = isRelevant(b) ? 0 : 1;
    return ra - rb;
  });

  const relevantCount = products.filter(isRelevant).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Workshop</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Curated 3D printing tools and supplies — tested by the community.
        </p>
        <p className="mt-3 rounded-xl border border-white/[0.06] bg-zinc-900/60 px-4 py-2.5 text-[11px] leading-relaxed text-zinc-500">
          <span className="font-semibold text-zinc-400">Disclosure:</span> Links on this page are Amazon
          affiliate links. If you purchase through them, we earn a small commission at no extra cost to you.
          We only recommend products we&apos;d actually use.
        </p>
      </div>

      {relevantCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-3">
          <span className="mt-0.5 text-lg" aria-hidden>
            ✦
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Personalised for your inventory</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {relevantCount} product{relevantCount !== 1 ? "s" : ""} matched to the materials you already
              track. They&apos;re highlighted in green.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            activeCategory === "all"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
          }`}
        >
          All
        </button>
        {WORKSHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === cat.key
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {!productsLoaded ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-800/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((product) => (
            <WorkshopProductCard key={product.id} product={product} relevant={isRelevant(product)} />
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-600">
        Prices are approximate and may vary. Always verify on Amazon before purchasing.
      </p>
    </div>
  );
}
