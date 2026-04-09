"use client";

import { useEffect, useState } from "react";
import {
  AMAZON_TAG,
  WORKSHOP_PRODUCTS,
  WORKSHOP_CATEGORIES,
  type ProductTag,
} from "@/data/workshop-products";
import { WorkshopProductCard } from "@/components/inventory/WorkshopProductCard";
import { type Item, normalizeItem } from "@/lib/inventory-item";

export function WorkshopGearSection() {
  const [activeCategory, setActiveCategory] = useState<ProductTag | "all">("all");
  const [userMaterials, setUserMaterials] = useState<Set<string>>(new Set());

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

  const isRelevant = (product: (typeof WORKSHOP_PRODUCTS)[0]) =>
    product.relevantMaterials?.some((m) => userMaterials.has(m)) ?? false;

  const filtered =
    activeCategory === "all"
      ? WORKSHOP_PRODUCTS
      : WORKSHOP_PRODUCTS.filter((p) => p.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    const ra = isRelevant(a) ? 0 : 1;
    const rb = isRelevant(b) ? 0 : 1;
    return ra - rb;
  });

  const relevantCount = WORKSHOP_PRODUCTS.filter(isRelevant).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Workshop</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Curated 3D printing tools and supplies — tested by the community.
        </p>
        {AMAZON_TAG === "YOUR_TAG-20" && (
          <p className="mt-2 rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-2 text-[11px] text-amber-300">
            Affiliate tag is not configured. Update <code>AMAZON_TAG</code> in
            <code> data/workshop-products.ts</code> before launch.
          </p>
        )}

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((product) => (
          <WorkshopProductCard key={product.id} product={product} relevant={isRelevant(product)} />
        ))}
      </div>

      <p className="text-center text-[11px] text-zinc-600">
        Prices are approximate and may vary. Always verify on Amazon before purchasing.
      </p>
    </div>
  );
}
