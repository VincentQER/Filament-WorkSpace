"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { error?: string; devVerificationUrl?: string };
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    setDevVerificationUrl(data.devVerificationUrl ?? null);
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-zinc-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
          aria-hidden
        />
        <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
          <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-md">
            <h1 className="text-xl font-semibold text-zinc-50">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              We sent a verification link to <span className="text-zinc-200">{email}</span>. Open the link in that
              message to verify your email, then sign in to open My inventory.
            </p>
            {devVerificationUrl && (
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200/90">
                <p className="font-medium text-amber-100">Development · SMTP not configured</p>
                <p className="mt-1 break-all text-amber-200/80">Verification link: {devVerificationUrl}</p>
              </div>
            )}
            <Link
              href="/auth/login"
              className="mt-6 block w-full rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Go to sign in
            </Link>
            <Link href="/" className="mt-3 block text-center text-xs text-zinc-500 hover:text-emerald-400/90">
              ← Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
        <form
          onSubmit={onSubmit}
          className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-md"
        >
          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 transition hover:text-emerald-400/90"
          >
            ← Back to home
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">Create account</h1>
          <p className="mt-1 text-sm text-zinc-400">
            After registration, verify your email. Then you can sign in and use your personal stock dashboard.
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
            {loading ? "Submitting…" : "Register and send verification email"}
          </button>
          <Link
            className="mt-4 block text-center text-sm text-zinc-400 underline-offset-2 hover:text-emerald-400/90 hover:underline"
            href="/auth/login"
          >
            Already have an account? Sign in
          </Link>
        </form>
      </main>
    </div>
  );
}
