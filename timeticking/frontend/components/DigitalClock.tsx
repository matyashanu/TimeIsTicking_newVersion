'use client';

import useClock from '@/lib/useClock';

export default function DigitalClock() {
  const { formattedTime } = useClock();
  const segments = formattedTime.split(' : ');

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)]/25 bg-[color:var(--card-bg)]/70 px-6 py-4 text-[color:var(--fg)] shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
      {segments.map((segment, index) => (
        <div key={segment + index} className="flex items-center gap-3">
          <div className="rounded-xl bg-[color:var(--bg)]/60 px-4 py-3 text-center font-mono text-3xl font-semibold text-[color:var(--fg)] shadow-[0_0_25px_rgba(0,0,0,0.35)] ring-1 ring-[color:var(--border)]/20">
            {segment}
          </div>
          {index < segments.length - 1 ? (
            <span className="text-2xl font-bold text-[color:var(--fg)] drop-shadow">:</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
