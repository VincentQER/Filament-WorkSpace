"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddWorkspaceColorModal } from "@/components/inventory/AddWorkspaceColorModal";
import { FilamentStepper } from "@/components/FilamentStepper";
import { useInventoryWorkspace } from "@/hooks/useInventoryWorkspace";
import {
  itemsForWorkspaceBrandMaterial,
  normalizeItem,
  recalculateItem,
  type Item,
} from "@/lib/inventory-item";

export function BrandMaterialStock({ brand, material }: { brand: string; material: string }) {
  const { items, authReady, updateItems, undo, undoStackLength } = useInventoryWorkspace();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const materialRows = useMemo(
    () =>
      itemsForWorkspaceBrandMaterial(items, brand, material).sort((a, b) =>
        `${a.color} ${a.name}`.localeCompare(`${b.color} ${b.name}`),
      ),
    [items, brand, material],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materialRows;
    return materialRows.filter((row) => {
      const hay = `${row.color} ${row.name} ${row.sku ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [materialRows, search]);

  const materialSummary = useMemo(() => {
    let spools = 0;
    let refills = 0;
    let open = 0;
    for (const row of materialRows) {
      spools += row.spools;
      refills += row.refills;
      open += row.openSpoolWeight;
    }
    return { colors: materialRows.length, spools, refills, open };
  }, [materialRows]);

  function adjustItem(itemId: string, field: "spools" | "refills" | "openSpoolWeight", delta: number) {
    updateItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const n = normalizeItem(item);
        let spools = n.spools;
        let refills = n.refills;
        let open = n.openSpoolWeight;
        if (field === "spools") spools = Math.max(0, spools + delta);
        if (field === "refills") refills = Math.max(0, refills + delta);
        if (field === "openSpoolWeight") open = Math.min(1000, Math.max(0, open + delta));
        const nextStocks = n.stockByLocation.map((s, i) =>
          i === 0 ? { ...s, spools, refills, openSpoolWeight: open } : s,
        );
        return recalculateItem({
          ...n,
          spools,
          refills,
          openSpoolWeight: open,
          stockByLocation: nextStocks,
          updatedAt: Date.now(),
        });
      }),
    );
  }

  function removeItem(itemId: string) {
    updateItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  if (!authReady) {
    return <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (!brand.trim() || !material.trim()) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        <p>Missing brand or material.</p>
        <Link href="/my-inventory" className="mt-3 inline-block text-violet-400 underline">
          ← Inventory home
        </Link>
      </div>
    );
  }

  return (
    <div className="relative text-zinc-100">
      <div className="mb-6">
        <Link
          href={`/my-inventory/brands/${encodeURIComponent(brand)}`}
          className="text-xs font-medium text-zinc-500 hover:text-violet-400/90"
        >
          ← {brand} lines
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{material}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {materialSummary.colors} saved color{materialSummary.colors === 1 ? "" : "s"} · full {materialSummary.spools}{" "}
          · refill {materialSummary.refills} · open {materialSummary.open} g
        </p>
      </div>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-900/55 px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search color or SKU…"
          className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-violet-500/20 focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-xl border border-violet-400/35 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
          >
            Add color
          </button>
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

      {materialRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No colors saved for this material line yet.</p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-4 rounded-xl bg-violet-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"
          >
            Add first color
          </button>
        </div>
      ) : (
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
                  <th className="w-20 px-4 py-3.5 font-semibold"> </th>
                </tr>
              </thead>
              <tbody className="bg-zinc-950/40">
                {filteredRows.map((row: Item, idx: number) => (
                  <tr
                    key={row.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] ${idx % 2 === 1 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-block h-10 w-10 rounded-xl border border-white/15 shadow-md ring-1 ring-black/20"
                        style={{ backgroundColor: row.colorHex || "#3f3f46" }}
                        title={row.colorHex || ""}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-zinc-100">{row.color}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-violet-400/85">{row.sku?.trim() || "—"}</td>
                    <td className="px-4 py-2.5">
                      <FilamentStepper value={row.spools} onDelta={(d) => adjustItem(row.id, "spools", d)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <FilamentStepper value={row.refills} onDelta={(d) => adjustItem(row.id, "refills", d)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <FilamentStepper
                        value={row.openSpoolWeight}
                        step={50}
                        onDelta={(d) => adjustItem(row.id, "openSpoolWeight", d)}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => removeItem(row.id)}
                        className="rounded-lg border border-red-500/25 px-2 py-1 text-[11px] text-red-300/90 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {search.trim() && filteredRows.length === 0 ? (
            <p className="border-t border-white/[0.06] px-4 py-4 text-center text-sm text-zinc-500">No matches.</p>
          ) : null}
        </div>
      )}

      <AddWorkspaceColorModal
        brand={brand}
        material={material}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={updateItems}
      />
    </div>
  );
}
