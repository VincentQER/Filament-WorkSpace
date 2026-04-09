"use client";

import { playFilamentAdjustSound } from "@/lib/inventory-sounds";

export function FilamentStepper({
  value,
  onDelta,
  step = 1,
}: {
  value: number;
  onDelta: (delta: number) => void;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => {
          playFilamentAdjustSound(-step);
          onDelta(-step);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-zinc-900/50 text-sm text-zinc-300 shadow-sm transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-200"
      >
        −
      </button>
      <span className="min-w-[2.25rem] text-center tabular-nums text-sm font-medium text-zinc-100">{value}</span>
      <button
        type="button"
        onClick={() => {
          playFilamentAdjustSound(step);
          onDelta(step);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-zinc-900/50 text-sm text-zinc-300 shadow-sm transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-200"
      >
        +
      </button>
    </div>
  );
}
