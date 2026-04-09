"use client";

import { useMemo, useState } from "react";
import { filterFilamentBrandSuggestions } from "@/lib/filament-brand-suggestions";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

export function BrandSearchInput({ value, onChange, placeholder, className, id, "aria-label": ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => filterFilamentBrandSuggestions(value), [value]);
  const showList = open && value.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <input
        id={id}
        type="search"
        autoComplete="off"
        value={value}
        aria-label={ariaLabel ?? "Search brand name"}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 180)}
        placeholder={placeholder}
        className={
          className ??
          "w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-violet-500/20 focus:ring-2"
        }
      />
      {showList ? (
        <ul
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-xl shadow-black/40"
          role="listbox"
        >
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-violet-500/15"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
