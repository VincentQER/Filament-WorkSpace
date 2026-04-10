"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";

type Props = { initialProducts: AffiliateProductRow[] };

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  essential:         { label: "Must-Have Tools",   emoji: "🔧", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  storage:           { label: "Filament Storage",  emoji: "📦", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  filament:          { label: "Popular Filaments", emoji: "🎨", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  tools:             { label: "Tools",             emoji: "🛠️", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  "post-processing": { label: "Post-Processing",   emoji: "✨", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  printers:          { label: "Printers",          emoji: "🖨️", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

type FilterTab = "all" | "active" | "inactive";

/** Minimal inline confirm dialog — avoids the jarring browser `confirm()`. */
function DeleteConfirm({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <p className="text-sm font-semibold text-white">Delete product?</p>
        <p className="mt-1 text-[13px] text-zinc-400 leading-relaxed">
          <span className="font-medium text-zinc-200">&ldquo;{title}&rdquo;</span> will be permanently removed
          from the Workshop. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500/90 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/** Toggle switch component */
function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-emerald-500/40 bg-emerald-500/80"
          : "border-zinc-700 bg-zinc-800"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[14px]" : "translate-x-[1px]"
        }`}
      />
    </button>
  );
}

export function AdminProductsTable({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [busy, setBusy] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const activeCount   = products.filter((p) => p.is_active === 1).length;
  const inactiveCount = products.filter((p) => p.is_active !== 1).length;

  const visible =
    filter === "all"      ? products :
    filter === "active"   ? products.filter((p) => p.is_active === 1) :
                            products.filter((p) => p.is_active !== 1);

  async function apiFetch(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? `${method} ${url} failed`);
    }
    return res;
  }

  async function toggleActive(id: number, current: number) {
    setBusy(id);
    try {
      await apiFetch(`/api/admin/products/${id}`, "PATCH", {
        is_active: current === 1 ? 0 : 1,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: current === 1 ? 0 : 1 } : p)),
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    setDeleteTarget(null);
    setBusy(id);
    try {
      await apiFetch(`/api/admin/products/${id}`, "DELETE");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reorder(id: number, direction: "up" | "down") {
    setBusy(id);
    try {
      await apiFetch(`/api/admin/products/${id}/reorder`, "PATCH", { direction });
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {deleteTarget && (
        <DeleteConfirm
          title={deleteTarget.title}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Stats + filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Stats chips */}
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-white/[0.07] bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-400">
            {products.length} total
          </span>
          <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
            {activeCount} live
          </span>
          {inactiveCount > 0 && (
            <span className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-[11px] font-medium text-zinc-500">
              {inactiveCount} hidden
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-zinc-900/60 p-1">
          {(["all", "active", "inactive"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1 text-[11px] font-semibold capitalize transition ${
                filter === tab
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-zinc-500">
          No {filter !== "all" ? filter : ""} products.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((p, idx) => {
            const isBusy   = busy === p.id;
            const catMeta  = CATEGORY_LABELS[p.category] ?? { label: p.category, emoji: "📦", color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
            const isActive = p.is_active === 1;

            // idx in the visible array; for reorder we need the global index
            const globalIdx = products.findIndex((x) => x.id === p.id);

            return (
              <div
                key={p.id}
                className={`group flex items-center gap-4 rounded-2xl border px-4 py-3 transition ${
                  isActive
                    ? "border-white/[0.07] bg-zinc-900/50 hover:border-white/10 hover:bg-zinc-900/70"
                    : "border-white/[0.04] bg-zinc-950/50 opacity-60 hover:opacity-80"
                }`}
              >
                {/* Sort controls */}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={isBusy || globalIdx === 0}
                    onClick={() => void reorder(p.id, "up")}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] text-zinc-600 transition hover:bg-white/10 hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-20"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || globalIdx === products.length - 1}
                    onClick={() => void reorder(p.id, "down")}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] text-zinc-600 transition hover:bg-white/10 hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-20"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="relative shrink-0">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-14 w-14 rounded-xl object-contain bg-white/[0.04] p-1"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.04] text-2xl">
                      {catMeta.emoji}
                    </div>
                  )}
                  {/* Inactive overlay dot */}
                  {!isActive && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-zinc-950 bg-zinc-600" />
                  )}
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
                      {p.title}
                    </p>
                    {p.is_deal === 1 && (
                      <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                        🔥 Deal
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {p.brand && (
                      <span className="text-[11px] text-zinc-500">{p.brand}</span>
                    )}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${catMeta.color}`}>
                      {catMeta.emoji} {catMeta.label}
                    </span>
                    {p.price_range && (
                      <span className="text-[11px] font-medium tabular-nums text-zinc-400">
                        {p.price_range}
                      </span>
                    )}
                    {p.material_type && (
                      <span className="text-[11px] text-zinc-600">{p.material_type}</span>
                    )}
                  </div>
                </div>

                {/* Right-side controls */}
                <div className="flex shrink-0 items-center gap-3">
                  {/* Active toggle */}
                  <div className="flex flex-col items-center gap-0.5">
                    <Toggle
                      checked={isActive}
                      disabled={isBusy}
                      onChange={() => void toggleActive(p.id, p.is_active)}
                    />
                    <span className={`text-[9px] font-medium ${isActive ? "text-emerald-500" : "text-zinc-600"}`}>
                      {isActive ? "Live" : "Hidden"}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-white/[0.06]" />

                  {/* Edit */}
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="rounded-xl border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-zinc-100"
                  >
                    Edit
                  </Link>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setDeleteTarget({ id: p.id, title: p.title })}
                    className="rounded-xl border border-transparent px-3 py-1.5 text-[11px] font-medium text-red-500/60 transition hover:border-red-500/20 hover:bg-red-500/[0.06] hover:text-red-400 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
