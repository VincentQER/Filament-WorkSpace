"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bambuColors,
  normalizeItem,
  statsForBambuCatalogLine,
  statsForBambuLabCatalogOverall,
  type Item,
} from "@/lib/inventory-item";

export default function BambuLinesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meRes = await fetch("/api/auth/me");
      if (cancelled) return;
      if (!meRes.ok) {
        router.push("/auth/login");
        return;
      }
      const invRes = await fetch("/api/inventory");
      if (cancelled) return;
      if (!invRes.ok) {
        setItems([]);
      } else {
        const inv = (await invRes.json()) as { items: Item[] };
        setItems(Array.isArray(inv.items) ? inv.items.map(normalizeItem) : []);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const brandTotals = useMemo(() => statsForBambuLabCatalogOverall(items), [items]);

  const lines = useMemo(() => {
    const names = [...new Set(bambuColors.map((e) => e.material))].sort((a, b) => a.localeCompare(b));
    return names.map((name) => {
      const st = statsForBambuCatalogLine(items, name);
      return { name, ...st };
    });
  }, [items]);

  if (!ready) {
    return <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">Loading…</div>;
  }

  return (
    <div className="relative text-zinc-100">
      <div className="mb-6">
        <Link href="/my-inventory" className="text-xs font-medium text-zinc-500 hover:text-emerald-400/90">
          ← Stock
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Bambu Lab</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Each line lists catalog colors vs what you have logged. Total rolls = full spools + refills.
        </p>
      </div>

      <section className="mb-8 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-emerald-950/25 p-5 shadow-lg shadow-black/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">Bambu Lab · catalog totals</p>
        <p className="mt-3 text-sm text-zinc-400">Official color catalog only (not third-party rolls).</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Available colors</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{brandTotals.catalogColorSlots}</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">slots in catalog data</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Colors with stock</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-emerald-300">{brandTotals.colorsWithStock}</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">any full / refill / open &gt; 0</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Total rolls</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-emerald-300">{brandTotals.totalRolls}</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">full spools + refills</dd>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Open on spool</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-zinc-200">{brandTotals.openG} g</dd>
            <dd className="mt-0.5 text-[11px] text-zinc-600">across all lines</dd>
          </div>
        </dl>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lines.map((line) => (
          <li key={line.name}>
            <Link
              href={`/my-inventory/bambu/${encodeURIComponent(line.name)}`}
              className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 transition hover:border-emerald-500/35 hover:bg-emerald-500/5"
            >
              <span className="font-medium text-white">{line.name}</span>

              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3 text-xs">
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Available colors</span>
                  <span className="tabular-nums font-medium text-zinc-300">{line.availableColors}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Colors with stock</span>
                  <span className="tabular-nums font-medium text-zinc-300">{line.colorsWithStock}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Full spools</span>
                  <span className="tabular-nums text-zinc-300">{line.fullSpools}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Refills</span>
                  <span className="tabular-nums text-zinc-300">{line.refills}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-400">
                  <span className="font-medium text-emerald-400/80">Total rolls</span>
                  <span className="tabular-nums font-semibold text-emerald-300">{line.totalRolls}</span>
                </div>
                <div className="flex justify-between gap-2 text-zinc-500">
                  <span>Open spool</span>
                  <span className="tabular-nums text-zinc-400">{line.openG} g</span>
                </div>
              </div>

              <span className="mt-4 text-xs font-medium text-emerald-400/90">Open table →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
