"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";

// ── Constants ────────────────────────────────────────────────────────────────

const AMAZON_TAG = "rollcheckspac-20";

const CATEGORIES = [
  { value: "essential",        label: "🔧 Must-Have Tools" },
  { value: "storage",          label: "📦 Filament Storage" },
  { value: "filament",         label: "🎨 Popular Filaments" },
  { value: "tools",            label: "🛠 Tools" },
  { value: "post-processing",  label: "✨ Post-Processing" },
  { value: "printers",         label: "🖨️ Printers" },
];

// ── URL helpers ───────────────────────────────────────────────────────────────

/** Extract a 10-char ASIN from any amazon.com URL format. */
function extractAsin(url: string): string {
  const m = url.match(/\/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/i);
  return m?.[1]?.toUpperCase() ?? "";
}

/**
 * Normalise an Amazon URL:
 * - If it already has an affiliate tag → leave unchanged
 * - If it contains an extractable ASIN → rebuild as a clean /dp/ URL with the tag
 * - If it's an amzn.to short link → leave unchanged (tag is already baked in)
 * - Otherwise → append the tag
 */
function normaliseAmazonUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return url;
  if (url.includes("tag=")) return url;                 // already tagged
  if (url.includes("amzn.to") || url.includes("a.co")) return url; // short link

  const asin = extractAsin(url);
  if (asin) return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;

  // Generic: just append the tag
  return url + (url.includes("?") ? "&" : "?") + `tag=${AMAZON_TAG}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

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

type Props = { product?: AffiliateProductRow };

function blankForm(): FormState {
  return {
    title: "", description: "", image_url: "", amazon_url: "",
    asin: "", category: "essential", brand: "", material_type: "",
    highlights: "", price_range: "", is_active: 1, sort_order: 0,
  };
}

function rowToForm(p: AffiliateProductRow): FormState {
  return {
    title: p.title, description: p.description, image_url: p.image_url,
    amazon_url: p.amazon_url, asin: p.asin, category: p.category,
    brand: p.brand, material_type: p.material_type, highlights: p.highlights,
    price_range: p.price_range, is_active: p.is_active, sort_order: p.sort_order,
  };
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inp =
  "w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 " +
  "placeholder-zinc-600 outline-none transition " +
  "focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20";

const labelCls = "block text-xs font-semibold text-zinc-300 mb-1.5";
const hintCls  = "text-[11px] text-zinc-500 mb-1.5";

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [form, setForm] = useState<FormState>(product ? rowToForm(product) : blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptional, setShowOptional] = useState(
    // Auto-expand optional section in edit mode if there's already content there
    isEdit ? Boolean(product?.description || product?.highlights) : false,
  );

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  /** Called when user finishes typing / pastes into the Amazon URL field. */
  function handleAmazonUrlBlur(raw: string) {
    const normalised = normaliseAmazonUrl(raw);
    const asin = extractAsin(normalised) || extractAsin(raw);
    setForm((prev) => ({
      ...prev,
      amazon_url: normalised || raw,
      asin: prev.asin || asin, // don't overwrite if user already filled it
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url    = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";
    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "Save failed"); setSaving(false); return; }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">

      {/* ── Step 1: Amazon ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">1</span>
          <p className="text-sm font-semibold text-zinc-200">Amazon link</p>
          <span className="ml-auto text-[11px] text-zinc-500">Paste any Amazon URL — we auto-fill ASIN &amp; add your affiliate tag</span>
        </div>

        <div>
          <label className={labelCls}>Amazon URL <span className="text-red-400">*</span></label>
          <input
            className={inp}
            value={form.amazon_url}
            onChange={(e) => set("amazon_url", e.target.value)}
            onBlur={(e) => handleAmazonUrlBlur(e.target.value)}
            onPaste={(e) => {
              // Process immediately on paste without waiting for blur
              const pasted = e.clipboardData.getData("text");
              setTimeout(() => handleAmazonUrlBlur(pasted), 0);
            }}
            placeholder="https://www.amazon.com/dp/B00FZPDG1K  or  https://amzn.to/xxxxx"
            required
          />
          {form.amazon_url && !form.amazon_url.includes("tag=") && !form.amazon_url.includes("amzn.to") && !form.amazon_url.includes("a.co") && (
            <p className="mt-1.5 text-[11px] text-amber-400/80">
              ⚠ No affiliate tag detected — click outside the field to auto-add it.
            </p>
          )}
          {form.amazon_url && (form.amazon_url.includes("tag=") || form.amazon_url.includes("amzn.to")) && (
            <p className="mt-1.5 text-[11px] text-emerald-400/80">
              ✓ Affiliate tag present
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>ASIN</label>
            <p className={hintCls}>Auto-filled from the URL above. Only needed if auto-fill misses it.</p>
            <input
              className={inp}
              value={form.asin}
              onChange={(e) => set("asin", e.target.value.toUpperCase())}
              placeholder="e.g. B00FZPDG1K"
              maxLength={10}
            />
          </div>
          <div>
            <label className={labelCls}>Price range</label>
            <p className={hintCls}>Shown on the product card.</p>
            <input
              className={inp}
              value={form.price_range}
              onChange={(e) => set("price_range", e.target.value)}
              placeholder="e.g. $8–12"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className={labelCls}>Image URL</label>
          <p className={hintCls}>
            Amazon CDN image URL. In the Amazon product page, right-click the main image → Copy image address.
          </p>
          <input
            className={inp}
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://m.media-amazon.com/images/I/41W4+oUpeNL._AC_SL400_.jpg"
          />
          {form.image_url && (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image_url}
                alt="Preview"
                className="h-20 w-20 rounded-xl object-contain bg-white/5 ring-1 ring-white/10"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                }}
              />
              <div className="text-[11px] text-zinc-500 space-y-0.5">
                <p className="text-zinc-400 font-medium">Image preview</p>
                <p>If the image is broken, double-check the URL.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2: Product info ────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">2</span>
          <p className="text-sm font-semibold text-zinc-200">Product info</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Title <span className="text-red-400">*</span></label>
            <input
              className={inp}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Hakko CHP-170 Micro Flush Cutters"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Brand</label>
            <input
              className={inp}
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Hakko"
            />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select
              className={inp}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Material type</label>
            <p className={hintCls}>For low-stock matching. Comma-separated, e.g. <code className="text-zinc-400">PLA,PETG</code></p>
            <input
              className={inp}
              value={form.material_type}
              onChange={(e) => set("material_type", e.target.value)}
              placeholder="PLA,PETG"
            />
          </div>
          <div>
            <label className={labelCls}>Sort order</label>
            <p className={hintCls}>Lower = shown first on the Workshop page.</p>
            <input
              className={inp}
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* ── Step 3: Optional details (collapsible) ─────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/30">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700/60 text-[11px] font-bold text-zinc-400">3</span>
            <p className="text-sm font-semibold text-zinc-400">Optional details</p>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
              Description · Highlights
            </span>
          </div>
          <span className="text-zinc-500 text-xs">{showOptional ? "▲ collapse" : "▼ expand"}</span>
        </button>

        {showOptional && (
          <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
            <div>
              <label className={labelCls}>Description</label>
              <p className={hintCls}>1–2 sentences shown on the product card below the title.</p>
              <textarea
                className={`${inp} min-h-[72px] resize-y`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Clean support removal without damaging your print surface."
              />
            </div>
            <div>
              <label className={labelCls}>Highlights</label>
              <p className={hintCls}>Short selling points — one per line.</p>
              <textarea
                className={`${inp} min-h-[88px] resize-y`}
                value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)}
                placeholder={"Works with all FDM printers\nSharp blades last years\nErgonomic grip"}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Active toggle ───────────────────────────────────────────────── */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-900/30 px-4 py-3">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={form.is_active === 1}
            onChange={(e) => set("is_active", e.target.checked ? 1 : 0)}
          />
          <div className={`h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-zinc-700"}`} />
          <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {form.is_active ? "Active" : "Inactive"}
          </p>
          <p className="text-[11px] text-zinc-500">
            {form.is_active ? "Visible on the Workshop page" : "Hidden from the Workshop page"}
          </p>
        </div>
      </label>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3">
          <span className="mt-0.5 text-red-400">⚠</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-500/90 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Saving…
            </span>
          ) : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          Cancel
        </button>
        {isEdit && (
          <span className="ml-auto text-[11px] text-zinc-600">
            ID #{product!.id} · created {new Date(product!.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </form>
  );
}
