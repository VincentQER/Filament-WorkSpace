"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";

type Props = { initialProducts: AffiliateProductRow[] };

const CATEGORY_LABELS: Record<string, string> = {
  essential:        "Must-Have Tools",
  storage:          "Filament Storage",
  filament:         "Popular Filaments",
  tools:            "Tools",
  "post-processing": "Post-Processing",
  printers:         "Printers",
};

export function AdminProductsTable({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [busy, setBusy] = useState<number | null>(null); // id of row currently being mutated

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

  async function toggleActive(id: number, currentActive: number) {
    setBusy(id);
    try {
      await apiFetch(`/api/admin/products/${id}`, "PATCH", {
        is_active: currentActive === 1 ? 0 : 1,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_active: currentActive === 1 ? 0 : 1 } : p,
        ),
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function deleteProduct(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
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
      // Refresh from server to get accurate sort_order state
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/[0.07] text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Title / Brand</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => {
            const isBusy = busy === p.id;
            return (
              <tr
                key={p.id}
                className={`border-b border-white/[0.04] transition ${
                  p.is_active ? "bg-zinc-900/40" : "bg-zinc-950/60 opacity-60"
                }`}
              >
                {/* Sort order controls */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-8 text-center tabular-nums text-zinc-500">{p.sort_order}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isBusy || idx === 0}
                        onClick={() => void reorder(p.id, "up")}
                        className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-30"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || idx === products.length - 1}
                        onClick={() => void reorder(p.id, "down")}
                        className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-30"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>

                {/* Title + brand */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-contain bg-white/5"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-xl">
                        📦
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">{p.title}</p>
                      {p.brand && (
                        <p className="text-[11px] text-zinc-500">{p.brand}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </td>

                {/* Price */}
                <td className="px-4 py-3 tabular-nums text-zinc-300">{p.price_range}</td>

                {/* Active toggle */}
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void toggleActive(p.id, p.is_active)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                      p.is_active
                        ? "bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400"
                        : "bg-zinc-800 text-zinc-500 hover:bg-emerald-500/15 hover:text-emerald-400"
                    }`}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void deleteProduct(p.id, p.title)}
                      className="rounded-lg border border-red-500/20 px-3 py-1.5 text-[11px] text-red-400/80 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
