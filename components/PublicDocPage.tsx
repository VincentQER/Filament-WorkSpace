import Link from "next/link";

export function PublicDocPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/[0.07] bg-zinc-950/90 px-4 py-4 backdrop-blur-lg sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-emerald-400/90">
            ← Home
          </Link>
          <Link href="/auth/login" className="text-xs text-zinc-500 hover:text-zinc-300 sm:text-sm">
            Sign in
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-400">{children}</div>
      </article>
    </div>
  );
}
