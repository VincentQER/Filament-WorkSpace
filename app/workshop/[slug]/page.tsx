import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { affiliateProductListActive } from "@/lib/repos/affiliate-products";
import { WORKSHOP_PRODUCTS, WORKSHOP_CATEGORIES, amazonImageUrl, amazonUrl } from "@/data/workshop-products";
import { rowToWorkshopProduct } from "@/lib/workshop-row-to-product";
import { findBySlug } from "@/lib/workshop-slug";
import type { WorkshopProduct, ProductTag } from "@/data/workshop-products";

export const revalidate = 3600;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveImage(product: WorkshopProduct): string | null {
  if (!product.imageId) return null;
  if (product.imageId.startsWith("http")) return product.imageId;
  return amazonImageUrl(product.imageId);
}

function resolveHref(product: WorkshopProduct): string {
  return product.directUrl ?? amazonUrl(product.asin);
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  WORKSHOP_CATEGORIES.map((c) => [c.key, c]),
);

// ── Data loading ──────────────────────────────────────────────────────────────

async function getAllProducts(): Promise<WorkshopProduct[]> {
  try {
    const rows = await affiliateProductListActive();
    if (rows.length > 0) return rows.map(rowToWorkshopProduct);
  } catch {
    // fall through
  }
  return WORKSHOP_PRODUCTS;
}

// ── Static params (hardcoded products only — DB products are dynamic) ─────────

export async function generateStaticParams() {
  return WORKSHOP_PRODUCTS.map((p) => ({ slug: p.id }));
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const all = await getAllProducts();
  const product = findBySlug(slug, all);
  if (!product) return { title: "Product not found" };

  const cat = CATEGORY_META[product.category];
  const description =
    product.tagline ||
    product.whyItMatters ||
    `${product.name} — ${cat?.label ?? product.category} for Bambu Lab 3D printers.`;

  return {
    title: `${product.name} — Workshop | Bambu Filament`,
    description,
    openGraph: {
      title: `${product.name} | Bambu Filament Workshop`,
      description,
      type: "website",
      images: resolveImage(product) ? [{ url: resolveImage(product)! }] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WorkshopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const all     = await getAllProducts();
  const product = findBySlug(slug, all);

  if (!product) notFound();

  const imageUrl  = resolveImage(product);
  const href      = resolveHref(product);
  const cat       = CATEGORY_META[product.category];

  // Related: same category, excluding self, up to 3
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-zinc-600">
        <Link href="/" className="hover:text-zinc-400 transition">Home</Link>
        <span>/</span>
        <Link href="/workshop" className="hover:text-zinc-400 transition">Workshop</Link>
        <span>/</span>
        <span className="text-zinc-400">{product.name}</span>
      </nav>

      {/* ── Main product section ── */}
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">

        {/* Image panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={product.name}
                width={280}
                height={280}
                className="h-60 w-60 object-contain drop-shadow-lg"
              />
            ) : (
              <span className="text-8xl opacity-20">{cat?.emoji ?? "📦"}</span>
            )}
          </div>

          {/* Deal badge */}
          {product.isDeal && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-sm font-semibold text-red-400">Current Deal</p>
                {product.originalPrice && (
                  <p className="text-xs text-zinc-500">
                    Was{" "}
                    <span className="line-through">{product.originalPrice}</span>
                    {" → "}
                    <span className="font-semibold text-red-300">{product.priceRange}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={href}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400/90 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-400 active:scale-[0.98]"
          >
            Check Price on Amazon
            <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1.5 8.5 8.5 1.5M8.5 1.5H5M8.5 1.5V5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="text-center text-[10px] text-zinc-600">
            Amazon affiliate link — we earn a commission at no extra cost to you.
          </p>
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-5">

          {/* Category pill */}
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/[0.07] bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400">
              {cat?.emoji} {cat?.label ?? product.category}
            </span>
            {product.badge && (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-400">
                {product.badge}
              </span>
            )}
          </div>

          {/* Brand + name */}
          {product.brand && (
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              {product.brand}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-snug text-white sm:text-3xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {product.isDeal && product.originalPrice && (
              <span className="text-sm tabular-nums text-zinc-600 line-through">
                {product.originalPrice}
              </span>
            )}
            <span className={`text-xl font-bold tabular-nums ${product.isDeal ? "text-red-400" : "text-zinc-200"}`}>
              {product.priceRange}
            </span>
          </div>

          {/* Tagline (personal review) */}
          {product.tagline && (
            <blockquote className="border-l-2 border-emerald-500/50 pl-4">
              <p className="text-base italic leading-relaxed text-zinc-300">
                &ldquo;{product.tagline}&rdquo;
              </p>
            </blockquote>
          )}

          {/* Why it matters */}
          {product.whyItMatters && (
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Why it matters
              </p>
              <p className="text-sm leading-relaxed text-zinc-400">
                {product.whyItMatters}
              </p>
            </div>
          )}

          {/* Relevant materials */}
          {product.relevantMaterials && product.relevantMaterials.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Works well with
              </p>
              <div className="flex flex-wrap gap-2">
                {product.relevantMaterials.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-medium text-emerald-400"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ASIN info for transparency */}
          {product.asin && (
            <p className="text-[10px] text-zinc-700">
              Amazon ASIN: {product.asin}
            </p>
          )}
        </div>
      </div>

      {/* ── Related products ── */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            More {cat?.label ?? "picks"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((p) => {
              const rImg  = resolveImage(p);
              const rHref = resolveHref(p);
              return (
                <div key={p.id} className="group rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-4">
                  <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-white/[0.03]">
                    {rImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rImg} alt={p.name} width={80} height={80} className="h-20 w-20 object-contain" loading="lazy" />
                    ) : (
                      <span className="text-4xl opacity-20">{cat?.emoji ?? "📦"}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-zinc-300 leading-snug">{p.name}</p>
                  <p className="mt-1 text-xs tabular-nums text-zinc-500">{p.priceRange}</p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/workshop/${p.id}`}
                      className="flex-1 rounded-lg border border-white/10 py-1.5 text-center text-[11px] font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                    >
                      Read review
                    </Link>
                    <a
                      href={rHref}
                      target="_blank"
                      rel="nofollow sponsored noopener noreferrer"
                      className="flex-1 rounded-lg bg-amber-400/10 py-1.5 text-center text-[11px] font-semibold text-amber-400 transition hover:bg-amber-400/20"
                    >
                      Check Price
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Bottom CTA strip ── */}
      <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-8 text-center">
        <p className="font-semibold text-zinc-200">Track your filament inventory</p>
        <p className="max-w-sm text-sm text-zinc-500">
          Free dashboard for Bambu Lab users — log spools, refills, and get low-stock alerts.
        </p>
        <Link
          href="/auth/register"
          className="mt-1 rounded-xl bg-emerald-500/90 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Create free account →
        </Link>
      </div>
    </main>
  );
}
