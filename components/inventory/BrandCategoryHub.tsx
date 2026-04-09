"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useInventoryWorkspace } from "@/hooks/useInventoryWorkspace";
import {
  materialLinesForWorkspaceBrand,
  statsForWorkspaceBrandMaterial,
  statsForWorkspaceBrandOverall,
} from "@/lib/inventory-item";

export function BrandCategoryHub({ brand }: { brand: string }) {
  const { items, authReady } = useInventoryWorkspace();

  const overall = useMemo(() => statsForWorkspaceBrandOverall(items, brand), [items, brand]);
  const lines = useMemo(() => materialLinesForWorkspaceBrand(items, brand), [items, brand]);

  const lineCards = useMemo(() => {
    return lines.map((name) => ({
      name,
      stats: statsForWorkspaceBrandMaterial(items, brand, name),
    }));
  }, [lines, items, brand]);

  if (!authReady) {
    return <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (!brand.trim()) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        <p>Missing brand.</p>
        <Link href="/my-inventory" className="mt-3 inline-block text-violet-400 underline">
          ← Inventory home
        </Link>
      </div>
    );
  }

  return (
    <div className="relative text-zinc-100">
      <div className="mb-6">
        <Link href="/my-inventory" className="text-xs font-medium text-zinc-500 hover:text-violet-400/90">
          ← Inventory home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{brand}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Same flow as Bambu Lab: pick a material line below, then use the color table (swatch, SKU, full, refill, open
          grams).
        </p>
      </div>

      <section className="mb-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-violet-950/25 p-5 shadow-lg shadow-black/20 sm:p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">Your brand · totals</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{brand}</h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            {overall.materialLineCount} material lines (curated for popular brands, merged with types from your saved rolls).
            Open a line and use <span className="text-zinc-300">Add color</span> there — no separate filament page.
          </p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Material lines</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{overall.materialLineCount}</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">catalog + your custom types</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Saved color rows</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-violet-300">{overall.savedColorLines}</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Colors with stock</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-violet-300">{overall.colorsWithStock}</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Total rolls</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-violet-300">{overall.totalRolls}</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">full + refills · open {overall.openG} g</dd>
          </div>
        </dl>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lineCards.map((line) => (
          <li key={line.name}>
            <Link
              href={`/my-inventory/brands/${encodeURIComponent(brand)}/${encodeURIComponent(line.name)}`}
              className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 transition hover:border-violet-500/35 hover:bg-violet-500/5"
            >
              <span className="font-medium text-white">{line.name}</span>

              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3 text-xs">
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Saved colors</span>
                  <span className="tabular-nums font-medium text-zinc-300">{line.stats.availableColors}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Colors with stock</span>
                  <span className="tabular-nums font-medium text-zinc-300">{line.stats.colorsWithStock}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Full spools</span>
                  <span className="tabular-nums text-zinc-300">{line.stats.fullSpools}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Refills</span>
                  <span className="tabular-nums text-zinc-300">{line.stats.refills}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-400">
                  <span className="font-medium text-violet-400/80">Total rolls</span>
                  <span className="tabular-nums font-semibold text-violet-300">{line.stats.totalRolls}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Open spool</span>
                  <span className="tabular-nums text-zinc-400">{line.stats.openG} g</span>
                </div>
              </div>

              <span className="mt-4 text-xs font-medium text-violet-400/90">Open table →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
