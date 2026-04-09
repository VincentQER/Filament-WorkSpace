"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUserProfile } from "@/lib/user-profile";

function AvatarPreview({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <span className="text-2xl text-zinc-600">?</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}

const PRINTER_PRESETS = [
  "Bambu Lab X1 Carbon",
  "Bambu Lab X1E",
  "Bambu Lab P1P",
  "Bambu Lab P1S",
  "Bambu Lab A1",
  "Bambu Lab A1 mini",
  "Bambu Lab H2D",
  "Other / DIY",
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState("");
  const [printerRows, setPrinterRows] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/auth/login");
        return;
      }
      const data = (await res.json()) as { user: PublicUserProfile };
      const u = data.user;
      setEmail(u.email);
      setDisplayName(u.displayName ?? "");
      setAvatarUrl(u.avatarUrl ?? "");
      setAddress(u.address ?? "");
      setPrinterRows(u.printers?.length ? [...u.printers] : [""]);
      setReady(true);
    }
    load();
  }, [router]);

  function addPrinterRow() {
    setPrinterRows((r) => [...r, ""]);
  }

  function setPrinterAt(index: number, value: string) {
    setPrinterRows((rows) => rows.map((x, i) => (i === index ? value : x)));
  }

  function removePrinterRow(index: number) {
    setPrinterRows((rows) => (rows.length <= 1 ? [""] : rows.filter((_, i) => i !== index)));
  }

  function appendPreset(preset: string) {
    const trimmed = preset.trim();
    setPrinterRows((rows) => {
      const base = rows.filter((x) => x.trim() !== "");
      if (base.some((x) => x.trim() === trimmed)) return [...base, ""];
      return [...base, trimmed, ""];
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const printers = printerRows.map((x) => x.trim()).filter(Boolean);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          avatarUrl,
          address,
          printers,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; user?: PublicUserProfile };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Could not save profile." });
        return;
      }
      if (data.user) {
        setDisplayName(data.user.displayName ?? "");
        setAvatarUrl(data.user.avatarUrl ?? "");
        setAddress(data.user.address ?? "");
        setPrinterRows(data.user.printers?.length ? [...data.user.printers] : [""]);
      }
      setMessage({ type: "ok", text: "Profile saved." });
      window.dispatchEvent(new CustomEvent("workspace:profile-updated"));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">Profile</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Your information</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Avatar uses an image link (https). Email is your sign-in ID and cannot be changed here.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-xl shadow-black/25"
      >
        <label className="block text-xs text-zinc-500">
          <span className="mb-1.5 block text-zinc-400">Email</span>
          <input
            readOnly
            value={email}
            className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-400"
          />
        </label>

        <label className="block text-xs text-zinc-500">
          <span className="mb-1.5 block text-zinc-400">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How we greet you in the app"
            maxLength={120}
            className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/20 focus:ring-2"
          />
        </label>

        <div className="text-xs text-zinc-500">
          <span className="mb-1.5 block text-zinc-400">Avatar</span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
              {avatarUrl.trim() ? (
                <AvatarPreview key={avatarUrl.trim()} src={avatarUrl.trim()} />
              ) : (
                <span className="text-2xl text-zinc-600">?</span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/20 focus:ring-2"
              />
              <p className="text-[11px] text-zinc-600">
                Paste a direct image URL. If the preview fails, check the link or try another host.
              </p>
            </div>
          </div>
        </div>

        <label className="block text-xs text-zinc-500">
          <span className="mb-1.5 block text-zinc-400">Address</span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shipping or workshop address (optional)"
            rows={4}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/20 focus:ring-2"
          />
        </label>

        <div className="text-xs text-zinc-500">
          <span className="mb-1.5 block text-zinc-400">Printers</span>
          <p className="mb-2 text-[11px] text-zinc-600">
            Add each machine you use. Quick-add common Bambu models below.
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PRINTER_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => appendPreset(p)}
                className="rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-1 text-[11px] text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-200"
              >
                + {p}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {printerRows.map((row, index) => (
              <li key={index} className="flex gap-2">
                <input
                  value={row}
                  onChange={(e) => setPrinterAt(index, e.target.value)}
                  placeholder={`Printer ${index + 1}`}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/20 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => removePrinterRow(index)}
                  className="shrink-0 rounded-xl border border-red-500/25 px-3 py-2 text-xs text-red-300/90 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addPrinterRow}
            className="mt-2 text-xs font-medium text-emerald-400/90 hover:text-emerald-300"
          >
            + Add another printer
          </button>
        </div>

        {message ? (
          <p className={message.type === "ok" ? "text-sm text-emerald-400/90" : "text-sm text-red-400"}>
            {message.text}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
