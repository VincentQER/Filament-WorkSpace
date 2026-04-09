"use client";

import { FormEvent, useState } from "react";
import { makeCustomFilamentItem, type Item } from "@/lib/inventory-item";

type Props = {
  brand: string;
  material: string;
  open: boolean;
  onClose: () => void;
  onAdd: (updater: (prev: Item[]) => Item[]) => void;
};

export function AddWorkspaceColorModal({ brand, material, open, onClose, onAdd }: Props) {
  const [color, setColor] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sku, setSku] = useState("");
  const [hex, setHex] = useState("");
  const [spools, setSpools] = useState(0);
  const [refills, setRefills] = useState(0);
  const [openG, setOpenG] = useState(0);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setColor("");
    setDisplayName("");
    setSku("");
    setHex("");
    setSpools(0);
    setRefills(0);
    setOpenG(0);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const c = color.trim();
    if (!c) {
      setError("Color name is required.");
      return;
    }
    onAdd((prev) => [
      ...prev,
      makeCustomFilamentItem({
        brand,
        type: material,
        color: c,
        name: displayName.trim() || undefined,
        sku: sku.trim() || undefined,
        colorHex: hex.trim() || undefined,
        spools,
        refills,
        openSpoolWeight: openG,
      }),
    ]);
    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-color-title"
      onClick={handleClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-500/30 bg-zinc-900 p-6 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="add-color-title" className="text-lg font-semibold text-white">
          Add color · {material}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Brand <span className="text-zinc-400">{brand}</span> — saved with this material line.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block text-xs text-zinc-500">
            <span className="mb-1 block text-zinc-400">Color name</span>
            <input
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-violet-500/20 focus:ring-2"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            <span className="mb-1 block text-zinc-400">Display label (optional)</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-violet-500/20 focus:ring-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              <span className="mb-1 block text-zinc-400">SKU (optional)</span>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-violet-500/20 focus:ring-2"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              <span className="mb-1 block text-zinc-400">Swatch hex (optional)</span>
              <input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#1a1a1a"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-violet-500/20 focus:ring-2"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs text-zinc-500">
              <span className="mb-1 block text-zinc-400">Full</span>
              <input
                type="number"
                min={0}
                value={spools}
                onChange={(e) => setSpools(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-2 py-2 text-sm tabular-nums text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              <span className="mb-1 block text-zinc-400">Refill</span>
              <input
                type="number"
                min={0}
                value={refills}
                onChange={(e) => setRefills(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-2 py-2 text-sm tabular-nums text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              <span className="mb-1 block text-zinc-400">Open g</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={openG}
                onChange={(e) =>
                  setOpenG(Math.min(1000, Math.max(0, Number(e.target.value) || 0)))
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-2 py-2 text-sm tabular-nums text-zinc-100"
              />
            </label>
          </div>
          {error ? <p className="text-xs text-amber-300">{error}</p> : null}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-white/12 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-violet-500/90 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
            >
              Save color
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
