"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const verifyState = searchParams.get("verify");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);
    setResendMessage("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { error?: string; code?: string };
    if (!res.ok) {
      if (data.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      }
      setError(data.error ?? "Sign-in failed");
      setLoading(false);
      return;
    }
    router.push("/my-inventory");
    router.refresh();
  }

  async function onResend() {
    if (!email || !password) {
      setResendMessage("Enter your email and password first.");
      return;
    }
    setResendLoading(true);
    setResendMessage("");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { error?: string; devVerificationUrl?: string };
    setResendLoading(false);
    if (!res.ok) {
      setResendMessage(data.error ?? "Could not send email");
      return;
    }
    let msg = "Verification email sent. Check your inbox.";
    if (data.devVerificationUrl) {
      msg += ` (dev) Link: ${data.devVerificationUrl}`;
    }
    setResendMessage(msg);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-md"
    >
      <Link href="/" className="text-xs font-medium text-zinc-500 transition hover:text-emerald-400/90">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Verify your email after registering, then sign in to open your filament stock.
      </p>

      {verified && (
        <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200/95">
          Email verified. Sign in with your email and password.
        </p>
      )}
      {verifyState === "invalid" && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          That verification link is invalid or already used. Resend a verification email below.
        </p>
      )}
      {verifyState === "expired" && (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/95">
          That verification link has expired. Use &quot;Resend verification email&quot; below.
        </p>
      )}

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
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {needsVerification && (
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/50 p-3">
          <p className="text-xs text-zinc-400">
            Didn&apos;t get the email? Resend after confirming email and password match what you used to register.
          </p>
          <button
            type="button"
            onClick={onResend}
            disabled={resendLoading}
            className="mt-2 text-sm font-medium text-emerald-400/90 hover:text-emerald-300 disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
          {resendMessage && <p className="mt-2 break-all text-xs text-zinc-400">{resendMessage}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <Link
        className="mt-4 block text-center text-sm text-zinc-400 underline-offset-2 hover:text-emerald-400/90 hover:underline"
        href="/auth/register"
      >
        Create an account
      </Link>
    </form>
  );
}

export default function LoginPage() {
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
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
