"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilamentSwatchPreview } from "@/components/inventory/FilamentSwatchPreview";
import { FilamentStepper } from "@/components/FilamentStepper";
import { useInventoryWorkspace } from "@/hooks/useInventoryWorkspace";
import {
  type BambuColorJson,
  bambuColors,
  itemMatchesCatalogEntry,
  makeCatalogItem,
  mergeMatches,
  normalizeItem,
  recalculateItem,
} from "@/lib/inventory-item";

function isValidCatalogMaterial(material: string): boolean {
  return bambuColors.some((e) => e.material === material);
}

export function BambuMaterialStock({ material }: { material: string }) {
  const { items, authReady, updateItems, undo, undoStackLength } = useInventoryWorkspace();
  const [search, setSearch] = useState("");

  const catalogRows = useMemo(() => {
    return bambuColors
      .filter((e) => e.material === material)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [material]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogRows;
    return catalogRows.filter((e) => `${e.name} ${e.sku ?? ""}`.toLowerCase().includes(q));
  }, [catalogRows, search]);

  const rowQuantities = useMemo(() => {
    const map = new Map<string, { spools: number; refills: number; open: number }>();
    for (const entry of catalogRows) {
      const matches = items.filter((i) => itemMatchesCatalogEntry(i, entry));
      if (matches.length === 0) {
        map.set(`${entry.material}|${entry.name}`, { spools: 0, refills: 0, open: 0 });
        continue;
      }
      const m = mergeMatches(matches);
      map.set(`${entry.material}|${entry.name}`, {
        spools: m.spools,
        refills: m.refills,
        open: m.openSpoolWeight,
      });
    }
    return map;
  }, [catalogRows, items]);

  const materialSummary = useMemo(() => {
    let spools = 0;
    let refills = 0;
    let open = 0;
    for (const entry of catalogRows) {
      const q = rowQuantities.get(`${entry.material}|${entry.name}`);
      if (q) {
        spools += q.spools;
        refills += q.refills;
        open += q.open;
      }
    }
    return { colors: catalogRows.length, spools, refills, open };
  }, [catalogRows, rowQuantities]);

  function adjustRow(entry: BambuColorJson, field: "spools" | "refills" | "openSpoolWeight", delta: number) {
    updateItems((prev) => {
      const matches = prev.filter((i) => itemMatchesCatalogEntry(i, entry));
      const rest = prev.filter((i) => !itemMatchesCatalogEntry(i, entry));
      let merged = matches.length ? mergeMatches(matches) : makeCatalogItem(entry);
      merged = normalizeItem(merged);
      let spools = merged.spools;
      let refills = merged.refills;
      let open = merged.openSpoolWeight;
      if (field === "spools") spools = Math.max(0, spools + delta);
      if (field === "refills") refills = Math.max(0, refills + delta);
      if (field === "openSpoolWeight") open = Math.min(1000, Math.max(0, open + delta));
      const nextStocks = merged.stockByLocation.map((s, i) =>
        i === 0 ? { ...s, spools, refills, openSpoolWeight: open } : s,
      );
      merged = recalculateItem({
        ...merged,
        spools,
        refills,
        openSpoolWeight: open,
        stockByLocation: nextStocks,
        updatedAt: Date.now(),
      });
      return [...rest, merged];
    });
  }

  if (!authReady) {
    return <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (!isValidCatalogMaterial(material)) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        <p>Unknown material “{material}”.</p>
        <Link href="/my-inventory/bambu" className="mt-3 inline-block text-emerald-400 underline">
          ← Back to Bambu Lab lines
        </Link>
      </div>
    );
  }

  return (
    <div className="relative text-zinc-100">
      <div className="mb-6">
        <Link
          href="/my-inventory/bambu"
          className="text-xs font-medium text-zinc-500 hover:text-emerald-400/90"
        >
          ← Bambu Lab lines
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{material}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {materialSummary.colors} colors · full {materialSummary.spools} · refill {materialSummary.refills} · open{" "}
          {materialSummary.open} g
        </p>
      </div>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-900/55 px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search color or SKU…"
          className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/20 focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={undoStackLength === 0}
            className="rounded-xl border border-white/12 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300 disabled:opacity-40"
          >
            Undo
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] shadow-xl shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/95 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3.5 font-semibold">Swatch</th>
                <th className="px-4 py-3.5 font-semibold">Color</th>
                <th className="px-4 py-3.5 font-semibold">SKU</th>
                <th className="px-4 py-3.5 font-semibold">Full</th>
                <th className="px-4 py-3.5 font-semibold">Refill</th>
                <th className="px-4 py-3.5 font-semibold">Open g</th>
              </tr>
            </thead>
            <tbody className="bg-zinc-950/40">
              {filteredCatalog.map((entry, idx) => {
                const q = rowQuantities.get(`${entry.material}|${entry.name}`) ?? {
                  spools: 0,
                  refills: 0,
                  open: 0,
                };
                return (
                  <tr
                    key={`${entry.material}-${entry.name}`}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] ${idx % 2 === 1 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <FilamentSwatchPreview entry={entry} catalogLabel="Bambu Lab" />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-zinc-100">{entry.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-emerald-400/85">{entry.sku?.trim() || "—"}</td>
                    <td className="px-4 py-2.5">
                      <FilamentStepper value={q.spools} onDelta={(d) => adjustRow(entry, "spools", d)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <FilamentStepper value={q.refills} onDelta={(d) => adjustRow(entry, "refills", d)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <FilamentStepper
                        value={q.open}
                        step={50}
                        onDelta={(d) => adjustRow(entry, "openSpoolWeight", d)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
