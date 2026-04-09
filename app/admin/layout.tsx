import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminAuthError, requireAdmin } from "@/lib/auth";

/**
 * Server Component layout that gates the entire /admin subtree.
 * requireAdmin() reads the JWT from the cookie and checks role in the DB.
 * Any non-admin visitor is redirected to the login page immediately,
 * before any child page renders or any data fetches happen.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      // 401 → not logged in → send to login
      // 403 → logged in but not admin → send to homepage
      redirect(err.status === 401 ? "/auth/login?next=/admin/products" : "/");
    }
    throw err;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/[0.07] bg-zinc-950/90 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/25 to-cyan-600/20 text-emerald-200 ring-1 ring-white/10 text-sm font-bold">
              ⚙
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-[11px] text-zinc-500">Filament Workspace</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-xs">
            <Link
              href="/admin/products"
              className="rounded-lg px-3 py-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
            >
              Products
            </Link>
            <Link
              href="/my-inventory"
              className="rounded-lg px-3 py-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-400"
            >
              ← Inventory
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
