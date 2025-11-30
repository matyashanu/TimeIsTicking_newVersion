'use client';

import { CalendarView } from './types';
import { useTheme } from '../ThemeProvider';

interface Props {
  currentDate: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onImport: () => void;
}

const viewOptions: CalendarView[] = ['day', 'week', 'month'];

export default function CalendarHeader({
  currentDate,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onImport,
}: Props) {
  const { theme } = useTheme();
  const button = 'bg-[color:var(--fg)] text-[color:var(--bg)] hover:opacity-90';
  const ghost =
    theme === 'dark'
      ? 'text-[color:var(--fg)] hover:bg-[rgba(245,239,235,0.12)]'
      : 'text-[color:var(--fg)] hover:bg-[rgba(47,65,86,0.12)]';

  const formatted = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[color:var(--fg)]">
      <div className="text-xl font-black tracking-wide">{formatted}</div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className={`rounded-full px-3 py-2 text-sm font-bold uppercase ${ghost}`}
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onToday}
          className={`rounded-full px-3 py-2 text-sm font-bold uppercase ${ghost}`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={onNext}
          className={`rounded-full px-3 py-2 text-sm font-bold uppercase ${ghost}`}
        >
          Next
        </button>
        <select
          value={view}
          onChange={(e) => onViewChange(e.target.value as CalendarView)}
          className="rounded-full border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] px-4 py-2 text-sm font-black uppercase text-[color:var(--fg)] outline-none"
        >
          {viewOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onImport}
          className={`rounded-full px-3 py-2 text-sm font-black uppercase ${button}`}
        >
          Import Calendar
        </button>
      </div>
    </div>
  );
}
