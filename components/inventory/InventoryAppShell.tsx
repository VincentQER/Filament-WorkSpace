"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type Item,
  normalizeItem,
  summarizeInventoryForShell,
} from "@/lib/inventory-item";
import type { PublicUserProfile } from "@/lib/user-profile";
import { InventoryWorkspaceProvider } from "@/components/inventory/InventoryWorkspaceContext";

function userInitials(user: PublicUserProfile | null): string {
  if (!user) return "?";
  const d = user.displayName.trim();
  if (d.length >= 2) return d.slice(0, 2).toUpperCase();
  const e = user.email;
  return e.slice(0, 2).toUpperCase();
}

function displayLabel(user: PublicUserProfile | null): string {
  if (!user) return "";
  if (user.displayName.trim()) return user.displayName.trim();
  const local = user.email.split("@")[0] ?? user.email;
  return local || user.email;
}

function SidebarAvatar({ user }: { user: PublicUserProfile }) {
  const [broken, setBroken] = useState(false);
  const url = user.avatarUrl?.trim();
  if (url && !broken) {
    return (
      // External URLs: native img (Next/Image would need host allowlist).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-emerald-500/30"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-bold text-emerald-200 ring-1 ring-emerald-500/30">
      {userInitials(user)}
    </div>
  );
}

function printersTeaser(printers: string[]): string | null {
  if (!printers.length) return null;
  const shown = printers.slice(0, 2).join(" · ");
  const more = printers.length > 2 ? ` +${printers.length - 2}` : "";
  return shown + more;
}

const NAV = [
  { href: "/my-inventory",           label: "Stock",    desc: "Bambu Lab catalog" },
  { href: "/my-inventory/workshop",  label: "Workshop", desc: "Tools & affiliate picks" },
  { href: "/my-inventory/profile",   label: "Profile",  desc: "Avatar, address, printers" },
] as const;

export function InventoryAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [shellStats, setShellStats] = useState<ReturnType<typeof summarizeInventoryForShell> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me");
      if (cancelled) return;
      if (!res.ok) {
        router.push("/auth/login");
        return;
      }
      const data = (await res.json()) as { user: PublicUserProfile };
      setUser(data.user);
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/inventory");
      if (cancelled) return;
      if (!res.ok) {
        setItems([]);
        setShellStats(summarizeInventoryForShell([]));
        return;
      }
      const inv = (await res.json()) as { items: Item[] };
      const items = Array.isArray(inv.items) ? inv.items.map(normalizeItem) : [];
      setItems(items);
      setShellStats(summarizeInventoryForShell(items));
    })();
    return () => {
      cancelled = true;
    };
  }, [authChecked, pathname]);

  useEffect(() => {
    function onProfile() {
      void (async () => {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = (await res.json()) as { user: PublicUserProfile };
        setUser(data.user);
      })();
    }
    function onInv() {
      void (async () => {
        const res = await fetch("/api/inventory");
        if (!res.ok) {
          setItems([]);
          setShellStats(summarizeInventoryForShell([]));
          return;
        }
        const inv = (await res.json()) as { items: Item[] };
        const items = Array.isArray(inv.items) ? inv.items.map(normalizeItem) : [];
        setItems(items);
        setShellStats(summarizeInventoryForShell(items));
      })();
    }
    window.addEventListener("workspace:profile-updated", onProfile);
    window.addEventListener("workspace:inventory-saved", onInv);
    return () => {
      window.removeEventListener("workspace:profile-updated", onProfile);
      window.removeEventListener("workspace:inventory-saved", onInv);
    };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  if (!authChecked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading…</div>
    );
  }

  const stats = shellStats;

  return (
    <InventoryWorkspaceProvider value={{ user, authChecked, items, shellStats }}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/[0.07] bg-zinc-950/85 px-3 backdrop-blur-lg sm:px-4 lg:px-5">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 lg:hidden"
          aria-expanded={sidebarOpen}
          aria-label="Open menu"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <span className="text-lg leading-none">☰</span>
        </button>
        <Link href="/my-inventory" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/25 to-cyan-600/20 text-sm font-bold text-emerald-200 ring-1 ring-white/10">
            ◎
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white">Filament workspace</p>
            <p className="hidden truncate text-[11px] text-zinc-500 sm:block">Inventory · Bambu Lab</p>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/my-inventory"
            className="hidden rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200 sm:inline"
          >
            Home
          </Link>
          <Link
            href="/"
            className="hidden rounded-lg px-2 py-2 text-[11px] text-zinc-500 transition hover:bg-white/5 hover:text-zinc-400 sm:inline"
            title="Public handbook for visitors (not signed in)"
          >
            Handbook
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border border-white/12 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800/80"
          >
            Sign out
          </button>
        </div>
        </header>

        <div className="flex min-h-[calc(100vh-3.5rem)]">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed bottom-0 left-0 top-14 z-40 flex w-[272px] flex-col border-r border-white/[0.07] bg-zinc-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-200 lg:static lg:z-0 lg:h-auto lg:min-h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:bg-zinc-900/40 lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-800/80 to-zinc-950/80 p-4">
              <div className="flex items-center gap-3">
                <SidebarAvatar key={user.avatarUrl || "none"} user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{displayLabel(user)}</p>
                  <p className="truncate text-xs text-zinc-500" title={user.email}>
                    {user.email}
                  </p>
                  {printersTeaser(user.printers) ? (
                    <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-zinc-600" title={user.printers.join(", ")}>
                      {printersTeaser(user.printers)}
                    </p>
                  ) : null}
                </div>
              </div>
              <Link
                href="/my-inventory/profile"
                onClick={() => setSidebarOpen(false)}
                className="mt-3 block w-full rounded-xl border border-white/10 bg-zinc-950/50 py-2 text-center text-xs font-medium text-emerald-400/90 hover:bg-emerald-500/10"
              >
                Edit profile
              </Link>
            </div>

            <nav className="space-y-1">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Navigate</p>
              {NAV.map((item) => {
                const active =
                  item.href === "/my-inventory"
                    ? pathname === "/my-inventory" || pathname.startsWith("/my-inventory/bambu")
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex flex-col rounded-xl border px-3 py-2.5 transition ${
                      active
                        ? "border-emerald-500/35 bg-emerald-500/10 text-white"
                        : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-[11px] text-zinc-500">{item.desc}</span>
                  </Link>
                );
              })}
            </nav>

            {stats ? (
              <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">At a glance</p>
                <dl className="mt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-zinc-500">Bambu colors w/ stock</dt>
                    <dd className="tabular-nums font-medium text-emerald-300">{stats.bambuColorKinds}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-zinc-500">Full rolls (est.)</dt>
                    <dd className="tabular-nums text-zinc-200">{stats.totalFullRolls}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-zinc-500">Open spool (g)</dt>
                    <dd className="tabular-nums text-zinc-200">{stats.bambuOpen + stats.otherOpen}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-zinc-600">
                Loading snapshot…
              </div>
            )}
          </div>
        </aside>

        <div className="relative min-w-0 flex-1">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(16,185,129,0.08),transparent)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_100%_20%,rgba(99,102,241,0.06),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:max-w-[1200px]">{children}</div>
        </div>
        </div>
      </div>
    </InventoryWorkspaceProvider>
  );
}
