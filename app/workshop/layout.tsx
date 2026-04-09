import Link from "next/link";

export default function PublicWorkshopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/[0.07] bg-zinc-950/90 px-4 py-3 backdrop-blur-lg sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/25 to-cyan-600/20 text-emerald-200 ring-1 ring-white/10">
              ◎
            </span>
            <span>Bambu Filament</span>
          </Link>
          <nav className="flex items-center gap-2 text-xs sm:text-sm">
            <Link href="/workshop" className="rounded-lg px-2 py-1.5 text-emerald-400/90 sm:px-3">
              Workshop
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg px-2 py-1.5 text-zinc-400 hover:text-white sm:px-3"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-emerald-500/90 px-3 py-1.5 font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
