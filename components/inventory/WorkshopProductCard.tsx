"use client";

import { type WorkshopProduct, amazonUrl } from "@/data/workshop-products";

type Props = {
  product: WorkshopProduct;
  /** Highlight this card if the user has matching materials in inventory */
  relevant?: boolean;
};

export function WorkshopProductCard({ product, relevant = false }: Props) {
  const href = amazonUrl(product.asin);

  function trackAffiliateClick() {
    const payload = {
      productId: product.id,
      asin: product.asin,
      category: product.category,
      relevant,
      sourcePage: "/my-inventory/workshop",
    };
    const body = JSON.stringify(payload);

    // sendBeacon is preferred so navigation is not blocked by analytics.
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/workshop/click", blob);
      return;
    }

    void fetch("/api/workshop/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={trackAffiliateClick}
      className={`group flex flex-col rounded-2xl border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 ${
        relevant
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-zinc-900/80 hover:border-emerald-400/50"
          : "border-white/[0.07] bg-zinc-900/60 hover:border-white/15"
      }`}
    >
      {/* Top strip */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {product.brand}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {relevant && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Matches your inventory
            </span>
          )}
          {product.badge && !relevant && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              {product.badge}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <p className="text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
          {product.name}
        </p>
        <p className="text-xs font-medium text-emerald-400/90">{product.tagline}</p>
        <p className="text-[11px] leading-relaxed text-zinc-500">{product.whyItMatters}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3">
        <span className="text-sm font-semibold tabular-nums text-zinc-300">
          {product.priceRange}
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 transition-colors group-hover:bg-amber-400/20">
          View on Amazon
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1.5 8.5 8.5 1.5M8.5 1.5H5M8.5 1.5V5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  );
}
