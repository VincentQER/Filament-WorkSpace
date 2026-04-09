import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
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

      <header className="relative z-10 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 ring-1 ring-white/10">
              <span className="text-lg" aria-hidden>
                ◎
              </span>
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Bambu Filament</p>
              <p className="text-xs text-zinc-500">Inventory handbook</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <a
              href="#handbook"
              className="hidden rounded-lg px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 sm:inline"
            >
              Handbook
            </a>
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
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300/90">
            Personal dashboard · Cloud-backed
          </p>
          <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl sm:leading-tight">
            Your filament, organized like a pro
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            This page is your <strong className="font-medium text-zinc-200">handbook</strong> — learn what the app does.
            When you are ready for <strong className="font-medium text-zinc-200">your own inventory and dashboard</strong>,
            register an account and sign in. Your data stays tied to your login.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/register"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-zinc-950 shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-400 sm:w-auto"
            >
              Register — get your dashboard
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-medium text-zinc-100 backdrop-blur transition hover:bg-white/10 sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section id="handbook" className="mt-28 scroll-mt-24">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Handbook
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-zinc-400">
            Three steps from here to your personal filament workspace.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create an account",
                body: "Register with email and password. We store your inventory per user so it is yours alone.",
              },
              {
                step: "02",
                title: "Sign in",
                body: "Use the same credentials on any device. A secure session keeps you logged in.",
              },
              {
                step: "03",
                title: "Open your dashboard",
                body: "Track colors, stock, wishlist, and locations — with optional simple mode for faster daily use.",
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

        <section className="mt-24 rounded-3xl border border-white/8 bg-zinc-900/50 p-8 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">What you get inside</h2>
              <ul className="mt-6 space-y-4 text-zinc-400">
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>Color-accurate swatches and Bambu-friendly presets for filament rows.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>Owned / wishlist / stock by location, with filters and bulk actions.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-emerald-400/90">✓</span>
                  <span>Simple mode for a calmer screen when you only need the essentials.</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["#e8e8e8", "#1a1a1a", "#c41e3a", "#2563eb", "#16a34a", "#eab308"].map((hex) => (
                <span
                  key={hex}
                  className="h-14 w-14 rounded-2xl ring-2 ring-white/10 shadow-lg"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>
        </section>

        <p className="mt-16 text-center text-sm text-zinc-600">
          After login, open{" "}
          <Link href="/my-inventory" className="text-emerald-400/90 underline underline-offset-2 hover:text-emerald-300">
            My inventory
          </Link>
          — bookmark it once you are signed in (you will be asked to sign in if needed).
        </p>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        Bambu Filament Inventory · Local + server sync
      </footer>
    </div>
  );
}
