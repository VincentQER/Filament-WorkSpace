"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/my-inventory";
  return raw;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-md"
    >
      <Link href="/" className="text-xs font-medium text-zinc-500 transition hover:text-emerald-400/90">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">Create account</h1>
      <p className="mt-1 text-sm text-zinc-400">
        You will be signed in right away and can open your Bambu lab stock dashboard.
      </p>
      <input
        className="mt-5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/30 focus:ring-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <input
        type="password"
        className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/30 focus:ring-2"
        placeholder="Password (at least 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account and continue"}
      </button>
      <Link
        className="mt-4 block text-center text-sm text-zinc-400 underline-offset-2 hover:text-emerald-400/90 hover:underline"
        href="/auth/login"
      >
        Already have an account? Sign in
      </Link>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
        <Suspense
          fallback={
            <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-center text-sm text-zinc-400">
              Loading…
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  );
}
