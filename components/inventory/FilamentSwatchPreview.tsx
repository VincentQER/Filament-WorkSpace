"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogColorJson } from "@/lib/inventory-item";

/** Fallback store URL when no direct variant link is available. */
function bambuStoreFallbackUrl(material: string, color: string): string {
  const q = encodeURIComponent(`${material} ${color}`);
  return `https://us.store.bambulab.com/search?type=product&q=${q}`;
}

type ImageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error" };

// Module-level cache so we never fetch the same color twice across the session
const resolvedUrlCache = new Map<string, string | null>();

type Props = {
  entry: CatalogColorJson;
  catalogLabel?: string;
};

export function FilamentSwatchPreview({ entry, catalogLabel = "Bambu Lab" }: Props) {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Image resolution ─────────────────────────────────────────────────────
  // Priority: (1) previewUrl baked into the JSON,  (2) API fetch,  (3) hex colour
  const staticPreview = entry.previewUrl?.trim() || null;
  const cacheKey = `${entry.material}|${entry.name}`;
  const [imgState, setImgState] = useState<ImageState>(() => {
    if (staticPreview) return { status: "ready", url: staticPreview };
    const cached = resolvedUrlCache.get(cacheKey);
    if (cached !== undefined) return cached ? { status: "ready", url: cached } : { status: "error" };
    return { status: "idle" };
  });

  /** Kick off the API fetch the first time this swatch is hovered. */
  const fetchImage = useCallback(() => {
    if (imgState.status !== "idle") return;
    setImgState({ status: "loading" });

    const params = new URLSearchParams({ material: entry.material, color: entry.name });
    fetch(`/api/bambu-image?${params}`)
      .then((r) => r.json() as Promise<{ url: string | null }>)
      .then(({ url }) => {
        resolvedUrlCache.set(cacheKey, url);
        setImgState(url ? { status: "ready", url } : { status: "error" });
      })
      .catch(() => {
        setImgState({ status: "error" });
      });
  }, [imgState.status, entry.material, entry.name, cacheKey]);

  // ── Popover positioning ──────────────────────────────────────────────────
  const position = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 10;
    const cardW = 224;
    let left = r.right + gap;
    if (left + cardW > window.innerWidth - 12) left = Math.max(12, r.left - gap - cardW);
    setCoords({ left, top: r.top + r.height / 2 });
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    position();
    setOpen(true);
    fetchImage();           // ← triggers fetch on first hover
  }, [position, fetchImage]);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => { setOpen(false); setCoords(null); }, 180);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
  }, []);

  useEffect(() => {
    if (!open) return;
    const reposition = () => position();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, position]);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  const hex = entry.hex;
  // Prefer the exact variant URL (pre-selects the color on the Bambu store page)
  const productPageUrl = entry.storeUrl ?? bambuStoreFallbackUrl(entry.material, entry.name);
  const resolvedUrl = imgState.status === "ready" ? imgState.url : null;

  return (
    <>
      {/* The coloured swatch chip — hover for popover, click to open Bambu store */}
      <a
        ref={anchorRef}
        href={productPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative inline-block"
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        title={`${entry.material} · ${entry.name} — click to view on Bambu Lab`}
        aria-label={`${entry.name} (${entry.material}) — view on Bambu Lab`}
      >
        <span
          className="inline-block h-10 w-10 rounded-xl border border-white/15 shadow-md ring-1 ring-black/20 transition-transform hover:scale-110 hover:ring-emerald-400/60"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
      </a>

      {/* Hover popover — rendered in document.body to escape table stacking context */}
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[9999] w-56 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-white/8"
              style={{ left: coords.left, top: coords.top, pointerEvents: "auto" }}
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
              role="tooltip"
            >
              {/* ── Product image area ── */}
              <div className="relative h-44 w-full bg-white">
                {/* Solid colour background — always visible */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    backgroundColor: hex,
                    // Fade out the solid colour once the photo is ready
                    opacity: resolvedUrl ? 0 : 1,
                  }}
                  aria-hidden
                />

                {/* Loading shimmer */}
                {imgState.status === "loading" && (
                  <div className="absolute inset-0 animate-pulse bg-zinc-700/40" />
                )}

                {/* Official Bambu product photo */}
                {resolvedUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvedUrl}
                    alt={`${entry.name} filament spool`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* "View on Bambu Lab" pill — bottom-right corner */}
                <a
                  href={productPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-emerald-600 hover:text-white"
                >
                  View on Bambu
                  <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M1.5 8.5 8.5 1.5M8.5 1.5H5M8.5 1.5V5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              {/* ── Info strip ── */}
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">{catalogLabel}</p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-100">{entry.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: hex }}
                    aria-hidden
                  />
                  <span className="font-mono text-[11px] text-zinc-500">{hex}</span>
                  <span className="text-[11px] text-zinc-600">· {entry.material}</span>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
