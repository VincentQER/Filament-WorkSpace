"use client";

import { type WorkshopProduct, amazonUrl, amazonImageUrl } from "@/data/workshop-products";

type Props = {
  product: WorkshopProduct;
  /** Highlight this card if the user has matching materials in inventory */
  relevant?: boolean;
};

/** Category icon fallback when no imageId is available */
const CATEGORY_ICONS: Record<string, string> = {
  essential: "🔧",
  storage: "📦",
  filament: "🎨",
  "post-processing": "✨",
  printers: "🖨️",
};

/**
 * Resolve the display image URL for a product.
 *
 * - DB products store the full URL in imageId (see rowToProduct in WorkshopGearSection).
 * - Hardcoded Phase-1 products store a bare Amazon image hash (e.g. "41W4+oUpeNL").
 *   We detect the difference by whether the value starts with "http".
 */
function resolveImageUrl(imageId: string | undefined): string | null {
  if (!imageId) return null;
  if (imageId.startsWith("http")) return imageId;       // full URL (DB product)
  return amazonImageUrl(imageId);                        // bare hash (hardcoded product)
}

export function WorkshopProductCard({ product, relevant = false }: Props) {
  // Prefer the stored direct URL (covers amzn.to short links and cases where
  // ASIN was left blank in the admin form). Fall back to building from ASIN.
  const href = product.directUrl ?? amazonUrl(product.asin);
  const imageUrl = resolveImageUrl(product.imageId);

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
      navigator.sendBeacon("/api/affiliate-click", blob);
      return;
    }

    void fetch("/api/affiliate-click", {
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
      {/* Product image or icon placeholder */}
      <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-white/[0.03]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            width={160}
            height={160}
            className="h-32 w-32 object-contain transition-transform duration-150 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl opacity-30">
            {CATEGORY_ICONS[product.category] ?? "📦"}
          </span>
        )}
        {/* Badge overlay */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {relevant && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
              Matches your inventory
            </span>
          )}
          {product.badge && !relevant && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-sm">
              {product.badge}
            </span>
          )}
        </div>
      </div>

      {/* Top strip */}
      <div className="px-4 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {product.brand}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-2">
        <p className="text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
          {product.name}
        </p>
        {product.tagline && (
          <p className="border-l-2 border-emerald-500/40 pl-2.5 text-[11px] italic leading-relaxed text-zinc-400">
            &ldquo;{product.tagline}&rdquo;
          </p>
        )}
        {product.whyItMatters && (
          <p className="text-[11px] leading-relaxed text-zinc-500">{product.whyItMatters}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3">
        <span className="text-sm font-semibold tabular-nums text-zinc-300">
          {product.priceRange}
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 transition-colors group-hover:bg-amber-400/20">
          Check Price
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1.5 8.5 8.5 1.5M8.5 1.5H5M8.5 1.5V5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  );
}
