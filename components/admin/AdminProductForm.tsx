"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";

type FormState = {
  title: string;
  description: string;
  image_url: string;
  amazon_url: string;
  asin: string;
  category: string;
  brand: string;
  material_type: string;
  highlights: string;
  price_range: string;
  is_active: number;
  sort_order: number;
};

type Props = {
  /** When provided, the form is in edit mode. When absent, create mode. */
  product?: AffiliateProductRow;
};

const CATEGORIES = [
  { value: "essential",        label: "Must-Have Tools" },
  { value: "storage",          label: "Filament Storage" },
  { value: "filament",         label: "Popular Filaments" },
  { value: "tools",            label: "Tools" },
  { value: "post-processing",  label: "Post-Processing" },
  { value: "printers",         label: "Printers" },
];

function blankForm(): FormState {
  return {
    title: "", description: "", image_url: "", amazon_url: "", asin: "",
    category: "essential", brand: "", material_type: "", highlights: "",
    price_range: "", is_active: 1, sort_order: 0,
  };
}

function rowToForm(p: AffiliateProductRow): FormState {
  return {
    title:         p.title,
    description:   p.description,
    image_url:     p.image_url,
    amazon_url:    p.amazon_url,
    asin:          p.asin,
    category:      p.category,
    brand:         p.brand,
    material_type: p.material_type,
    highlights:    p.highlights,
    price_range:   p.price_range,
    is_active:     p.is_active,
    sort_order:    p.sort_order,
  };
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-300">{label}</label>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition";

export function AdminProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [form, setForm] = useState<FormState>(
    product ? rowToForm(product) : blankForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        setSaving(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      {/* Core fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title *">
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Hakko CHP-170 Flush Cutters"
            required
          />
        </Field>
        <Field label="Brand">
          <input
            className={inputCls}
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Hakko"
          />
        </Field>
      </div>

      <Field label="Description" hint="Short description shown on the product card.">
        <textarea
          className={`${inputCls} min-h-[72px] resize-y`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="1-2 sentences describing why this product is useful."
        />
      </Field>

      {/* Amazon fields */}
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Amazon
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amazon URL *" hint="Full affiliate link including your tag.">
            <input
              className={inputCls}
              value={form.amazon_url}
              onChange={(e) => set("amazon_url", e.target.value)}
              placeholder="https://www.amazon.com/dp/B00FZPDG1K?tag=rollcheckspac-20"
              required
            />
          </Field>
          <Field label="ASIN">
            <input
              className={inputCls}
              value={form.asin}
              onChange={(e) => set("asin", e.target.value)}
              placeholder="e.g. B00FZPDG1K"
            />
          </Field>
        </div>
        <Field label="Image URL" hint="Amazon CDN URL or any direct image link (https://).">
          <input
            className={inputCls}
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://m.media-amazon.com/images/I/41W4+oUpeNL._AC_SL400_.jpg"
          />
          {form.image_url && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image_url}
                alt="Preview"
                className="h-16 w-16 rounded-lg object-contain bg-white/5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <span className="text-[11px] text-zinc-500">Image preview</span>
            </div>
          )}
        </Field>
      </div>

      {/* Categorisation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select
            className={inputCls}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Material type"
          hint="Used for low-stock matching. Comma-separated, e.g. PLA,PETG"
        >
          <input
            className={inputCls}
            value={form.material_type}
            onChange={(e) => set("material_type", e.target.value)}
            placeholder="PLA,PETG"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price range">
          <input
            className={inputCls}
            value={form.price_range}
            onChange={(e) => set("price_range", e.target.value)}
            placeholder="e.g. $8–12"
          />
        </Field>
        <Field label="Sort order" hint="Lower number = shown first.">
          <input
            className={inputCls}
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Highlights" hint="Short selling points, one per line.">
        <textarea
          className={`${inputCls} min-h-[72px] resize-y`}
          value={form.highlights}
          onChange={(e) => set("highlights", e.target.value)}
          placeholder={"Works with all FDM printers\nSharp blades last years\nErgonomic grip"}
        />
      </Field>

      {/* Active toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={form.is_active === 1}
          onChange={(e) => set("is_active", e.target.checked ? 1 : 0)}
          className="h-4 w-4 rounded border-white/20 accent-emerald-500"
        />
        <span className="text-sm text-zinc-300">
          Active (shown on Workshop page)
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-500/90 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
