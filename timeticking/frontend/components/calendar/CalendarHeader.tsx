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
  const text = theme === 'dark' ? 'text-beige' : 'text-navy';
  const button = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';
  const ghost = theme === 'dark' ? 'text-beige hover:bg-beige/10' : 'text-navy hover:bg-navy/10';

  const formatted = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className={`text-xl font-black uppercase tracking-wide ${text}`}>{formatted}</div>
      <div className="flex items-center gap-2">
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
          className={`themed-select font-black uppercase ${theme === 'dark' ? 'dark' : 'light'}`}
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
