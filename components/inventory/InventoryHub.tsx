"use client";

import Link from "next/link";
import { useMemo } from "react";
import { bambuColors, statsForBambuLabCatalogOverall } from "@/lib/inventory-item";
import { useInventoryWorkspaceContext } from "@/components/inventory/InventoryWorkspaceContext";

export function InventoryHub() {
  const { authChecked, user, items } = useInventoryWorkspaceContext();
  const ready = authChecked && Boolean(user);

  const bambuLineCount = useMemo(() => new Set(bambuColors.map((e) => e.material)).size, []);
  const bambuBrand = useMemo(() => statsForBambuLabCatalogOverall(items), [items]);

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
    </div>
  );
}
