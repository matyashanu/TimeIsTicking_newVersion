"use client";

import useFocus from "@/lib/useFocus";
import { Zap } from "lucide-react";
import { useEffect } from "react";

export default function FocusToggle() {
  const { isActive, seconds, toggle } = useFocus();

  function fmt(s: number) {
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  return (
    <div className="relative">
      {isActive && (
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2">
          <div className="px-3 py-1 rounded-lg bg-[var(--card-bg)] border text-[var(--fg)] shadow-sm text-sm font-semibold">
            {fmt(seconds)}
          </div>
        </div>
      )}
      <button
        type="button"
        aria-pressed={isActive}
        onClick={toggle}
        className={`flex h-10 items-center gap-2 rounded-full px-3 py-1 border transition text-[var(--fg)] bg-[var(--card-bg)]/80`}
        title={isActive ? 'Stop focus' : 'Start focus'}
      >
        <Zap size={16} className={`${isActive ? 'text-amber-400' : 'text-[var(--fg)]/80'}`} />
        <span className="text-sm font-semibold">Focus</span>
      </button>
    </div>
  );
}
