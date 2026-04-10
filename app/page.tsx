import Link from "next/link";
import { affiliateProductListActive } from "@/lib/repos/affiliate-products";
import { WORKSHOP_PRODUCTS, amazonImageUrl } from "@/data/workshop-products";

// Revalidate homepage every hour so new Workshop products appear without a full deploy.
export const revalidate = 3600;

// ── Types ────────────────────────────────────────────────────────────────────

type FeaturedProduct = {
  id: string;
  name: string;
  brand: string;
  price: string;
  href: string;
  image: string | null;
  tagline: string;
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getFeaturedProducts(): Promise<{ items: FeaturedProduct[]; total: number }> {
  try {
    const rows = await affiliateProductListActive();
    if (rows.length > 0) {
      return {
        total: rows.length,
        items: rows.slice(0, 3).map((r) => ({
          id:      String(r.id),
          name:    r.title,
          brand:   r.brand,
          price:   r.price_range,
          href:    r.amazon_url,
          image:   r.image_url || null,
          tagline: r.description || r.highlights || "",
        })),
      };
    }
  } catch {
    // DB unavailable — fall through to hardcoded
  }

  const fallback = WORKSHOP_PRODUCTS.slice(0, 3);
  return {
    total: WORKSHOP_PRODUCTS.length,
    items: fallback.map((p) => ({
      id:      p.id,
      name:    p.name,
      brand:   p.brand,
      price:   p.priceRange ?? "",
      href:    p.directUrl ?? `https://www.amazon.com/dp/${p.asin}?tag=rollcheckspac-20`,
      image:   p.imageId
        ? p.imageId.startsWith("http")
          ? p.imageId
          : amazonImageUrl(p.imageId)
        : null,
      tagline: p.tagline ?? "",
    })),
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { items: featured, total: workshopTotal } = await getFeaturedProducts();

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(59,130,246,0.08),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px]"
        aria-hidden
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 ring-1 ring-white/10">
              <span className="text-lg" aria-hidden>◎</span>
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Bambu Filament</p>
              <p className="text-xs text-zinc-500">Inventory tracker</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <a
              href="#how-it-works"
              className="hidden rounded-lg px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 sm:inline"
            >
              How it works
            </a>
            <Link
              href="/workshop"
              className="hidden rounded-lg px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 sm:inline"
            >
              Workshop
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-emerald-500/90 px-4 py-2 font-medium text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">

        {/* ── Hero ── */}
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300/90">
            Built for Bambu Lab A1 · P1 · X1 series
          </p>
          <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl sm:leading-tight">
            Track your Bambu Lab filament inventory
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            A personal dashboard for Bambu Lab users — log every spool, refill, and open weight
            across all material types. Browse the{" "}
            <Link href="/workshop" className="font-medium text-emerald-400/90 underline-offset-2 hover:underline">
              Workshop
            </Link>{" "}
            for curated gear picks without an account.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/register"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-zinc-950 shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-400 sm:w-auto"
            >
              Start tracking — it&apos;s free
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-medium text-zinc-100 backdrop-blur transition hover:bg-white/10 sm:w-auto"
            >
              I have an account
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500/70">✓</span> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500/70">✓</span> All Bambu material lines
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500/70">✓</span> Cloud-synced
            </span>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="mt-28 scroll-mt-24">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-zinc-400">
            Three steps from sign-up to your personal Bambu Lab filament dashboard.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create a free account",
                body: "Sign up with your email. No verification step — you're in your dashboard instantly.",
              },
              {
                step: "02",
                title: "Pick your material lines",
                body: "Choose the Bambu Lab materials you use: PLA, PETG, ABS, ASA, TPU, and more. Colors are pre-loaded.",
              },
              {
                step: "03",
                title: "Log spools and track stock",
                body: "Record full spools, refills, and open weight. See low-stock alerts before your next print.",
              },
            ].map((card) => (
              <article
                key={card.step}
                className="rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.06] to-transparent p-6 shadow-xl shadow-black/40"
              >
                <p className="font-mono text-xs text-emerald-400/90">{card.step}</p>
                <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="mt-24 rounded-3xl border border-white/8 bg-zinc-900/50 p-8 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
                Everything your AMS needs
              </h2>
              <ul className="mt-6 space-y-4 text-zinc-400">
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>
                    <strong className="font-medium text-zinc-300">Color-accurate swatches</strong> — every Bambu Lab color pre-loaded with the official hex and SKU.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>
                    <strong className="font-medium text-zinc-300">Full · Refill · Open weight</strong> — track exactly how much filament you have in each format.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>
                    <strong className="font-medium text-zinc-300">Low-stock alerts</strong> — the dashboard flags materials that are nearly out and suggests where to reorder.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>
                    <strong className="font-medium text-zinc-300">Wishlist mode</strong> — mark colors you want to buy next, separate from your current stock.
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["#e8e8e8", "#1a1a1a", "#c41e3a", "#2563eb", "#16a34a", "#eab308", "#ea580c", "#7c3aed"].map(
                (hex) => (
                  <span
                    key={hex}
                    className="h-14 w-14 rounded-2xl ring-2 ring-white/10 shadow-lg"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        {/* ── Workshop teaser ── */}
        <section className="mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400/80">Workshop</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                Gear we actually use
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Curated 3D printing tools, storage solutions, and filament picks — no account needed to browse.
              </p>
            </div>
            <Link
              href="/workshop"
              className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              See all {workshopTotal > 0 ? `${workshopTotal} ` : ""}picks →
            </Link>
          </div>

          {/* Featured product cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {featured.map((p) => (
              <a
                key={p.id}
                href={p.href}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-white/[0.07] bg-zinc-900/60 transition-all duration-150 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-lg hover:shadow-black/40"
              >
                {/* Image */}
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-t-2xl bg-white/[0.03]">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      width={140}
                      height={140}
                      className="h-28 w-28 object-contain transition-transform duration-150 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl opacity-20">📦</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between gap-2 p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {p.brand}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
                      {p.name}
                    </p>
                    {p.tagline && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
                        {p.tagline}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-sm font-semibold tabular-nums text-zinc-300">{p.price}</span>
                    <span className="flex items-center gap-1 rounded-lg bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 transition-colors group-hover:bg-amber-400/20">
                      Check Price
                      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M1.5 8.5 8.5 1.5M8.5 1.5H5M8.5 1.5V5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Amazon affiliate links — we earn a small commission at no cost to you.{" "}
            <Link href="/affiliate-disclosure" className="underline underline-offset-2 hover:text-zinc-400">
              Disclosure
            </Link>
          </p>
        </section>

        {/* ── Final CTA ── */}
        <section className="mt-24 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Ready to organise your filament stash?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
            Free, no credit card, and you can start logging spools the moment you sign up.
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-block rounded-xl bg-emerald-500/90 px-8 py-3.5 text-base font-semibold text-zinc-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            Create your free account
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-4 py-8 text-center text-xs text-zinc-600">
        <p>Bambu Lab Filament Inventory Tracker · Personal dashboard</p>
        <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/privacy"              className="hover:text-zinc-400">Privacy</Link>
          <Link href="/terms"                className="hover:text-zinc-400">Terms</Link>
          <Link href="/affiliate-disclosure" className="hover:text-zinc-400">Affiliate disclosure</Link>
          <Link href="/workshop"             className="hover:text-zinc-400">Workshop</Link>
        </nav>
      </footer>
    </div>
  );
}
