'use client';

import useClock from '@/lib/useClock';

export default function DigitalClock() {
  const { formattedTime } = useClock();
  const segments = formattedTime.split(' : ');

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 shadow-[0_0_25px_rgba(87,124,141,0.35)]">
      {segments.map((segment, index) => (
        <div key={segment + index} className="flex items-center gap-3">
          <div className="rounded-xl bg-navy/50 px-4 py-3 text-center font-mono text-3xl font-semibold text-white shadow-[0_0_20px_rgba(203,217,230,0.35)] ring-1 ring-white/15">
            {segment}
          </div>
          {index < segments.length - 1 ? (
            <span className="text-2xl font-bold text-sky drop-shadow">:</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
