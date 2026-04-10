import type { Metadata } from "next";
import Link from "next/link";
import { affiliateProductListActive } from "@/lib/repos/affiliate-products";
import { WORKSHOP_PRODUCTS, WORKSHOP_CATEGORIES } from "@/data/workshop-products";
import { rowToWorkshopProduct } from "@/lib/workshop-row-to-product";
import { WorkshopGearSection } from "@/components/inventory/WorkshopGearSection";

// ── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Workshop — 3D Printing Gear for Bambu Lab Users",
  description:
    "Curated tools, filament storage, and accessories for Bambu Lab A1, P1, and X1 users. Tested picks with honest reviews. Amazon affiliate links.",
  openGraph: {
    title: "Workshop — 3D Printing Gear for Bambu Lab Users",
    description:
      "Curated tools, filament storage, and accessories for Bambu Lab users. Tested picks, honest reviews.",
    type: "website",
  },
};

export const revalidate = 3600; // ISR — rebuild every hour

// ── Category meta for the stats strip ────────────────────────────────────────

const CATEGORY_DISPLAY = Object.fromEntries(
  WORKSHOP_CATEGORIES.map((c) => [c.key, c]),
);

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicWorkshopPage() {
  // Fetch from DB server-side — products are immediately available for SEO
  // crawlers and first render without a client-side waterfall.
  let initialProducts = WORKSHOP_PRODUCTS; // hardcoded fallback
  let totalCount      = WORKSHOP_PRODUCTS.length;

  try {
    const rows = await affiliateProductListActive();
    if (rows.length > 0) {
      initialProducts = rows.map(rowToWorkshopProduct);
      totalCount      = rows.length;
    }
  } catch {
    // DB unavailable — use hardcoded list
  }

  // Category breakdown for the stats strip
  const categoryCounts = initialProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Page header ── */}
      <div className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-xs text-zinc-600">
            <Link href="/" className="hover:text-zinc-400 transition">Home</Link>
            <span>/</span>
            <span className="text-zinc-400">Workshop</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Workshop
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-400">
                Curated 3D printing tools, storage solutions, and filament picks for{" "}
                <span className="text-zinc-300">Bambu Lab</span> users — chosen because
                they actually make a difference.
              </p>

              {/* Stats strip */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-xl border border-white/[0.07] bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-400">
                  {totalCount} picks
                </span>
                {Object.entries(categoryCounts).map(([key, count]) => {
                  const cat = CATEGORY_DISPLAY[key];
                  if (!cat) return null;
                  return (
                    <span
                      key={key}
                      className="rounded-xl border border-white/[0.05] bg-zinc-900/40 px-3 py-1.5 text-[11px] text-zinc-500"
                    >
                      {cat.emoji} {count} {cat.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* CTA for visitors who aren't logged in */}
            <div className="shrink-0 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 px-5 py-4 text-sm">
              <p className="font-semibold text-emerald-300">Track your filament too</p>
              <p className="mt-1 text-xs text-zinc-500">
                Free inventory dashboard for Bambu Lab users.
              </p>
              <Link
                href="/auth/register"
                className="mt-3 inline-block rounded-xl bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Create free account →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content — client component handles filtering + personalization ── */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <WorkshopGearSection initialProducts={initialProducts} />
      </main>

      {/* ── Bottom conversion strip ── */}
      <div className="border-t border-white/[0.05] bg-zinc-900/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-zinc-200">Never run out of filament again</p>
            <p className="mt-1 text-sm text-zinc-500">
              Log your spools, refills, and open weight — get low-stock alerts before your next print.
            </p>
          </div>
          <Link
            href="/auth/register"
            className="shrink-0 rounded-xl bg-emerald-500/90 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400"
          >
            Start tracking free →
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] px-4 py-6 text-center text-xs text-zinc-700">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/"                    className="hover:text-zinc-500 transition">Home</Link>
          <Link href="/privacy"             className="hover:text-zinc-500 transition">Privacy</Link>
          <Link href="/affiliate-disclosure" className="hover:text-zinc-500 transition">Affiliate disclosure</Link>
          <Link href="/auth/login"          className="hover:text-zinc-500 transition">Sign in</Link>
        </nav>
      </footer>
    </div>
  );
}
