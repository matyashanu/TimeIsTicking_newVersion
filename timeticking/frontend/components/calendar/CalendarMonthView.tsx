'use client';

import { addDays, differenceInCalendarDays, endOfMonth, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarEvent } from './types';
import { useTheme } from '../ThemeProvider';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectDate?: (date: Date) => void;
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_ROWS = 3;

function getMonthGrid(date: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfMonth(date);
  const weeks: Date[][] = [];
  let current = start;
  while (current <= end || weeks.length < 5) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(current);
      current = addDays(current, 1);
    }
    weeks.push(week);
    if (current > end && weeks.length >= 6) break;
  }
  return weeks;
}

const dateKey = (d: Date) => startOfDay(d).toISOString().slice(0, 10);

type MonthBar = { event: CalendarEvent; startCol: number; span: number; row: number };

function buildWeekBars(week: Date[], weeklyEvents: CalendarEvent[], overflow: Record<string, number>): MonthBar[] {
  const weekStart = startOfDay(week[0]);
  const weekEnd = startOfDay(week[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const sorted = weeklyEvents
    .filter((ev) => new Date(ev.start) <= weekEnd && new Date(ev.end) >= weekStart)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));

  const bars: MonthBar[] = [];
  const rows: { end: number }[] = [];

  sorted.forEach((ev) => {
    const start = startOfDay(new Date(ev.start));
    const end = startOfDay(new Date(ev.end));
    const startCol = Math.max(0, Math.min(6, differenceInCalendarDays(start, weekStart)));
    const endCol = Math.max(startCol, Math.min(6, differenceInCalendarDays(end, weekStart)));
    const span = endCol - startCol + 1;

    let rowIndex = rows.findIndex((r) => startCol > r.end);
    if (rowIndex === -1) rowIndex = rows.length;

    if (rowIndex >= MAX_ROWS) {
      for (let i = startCol; i <= endCol; i += 1) {
        const k = dateKey(week[i]);
        overflow[k] = (overflow[k] || 0) + 1;
      }
      return;
    }

    rows[rowIndex] = { end: endCol };
    bars.push({ event: ev, startCol, span, row: rowIndex });
  });

  return bars;
}

export default function CalendarMonthView({ currentDate, events, onSelectDate }: Props) {
  const weeks = getMonthGrid(currentDate);
  const monthIndex = currentDate.getMonth();
  const { theme } = useTheme();
  const todayKey = startOfDay(new Date()).toISOString().slice(0, 10);
  const text = theme === 'dark' ? 'text-beige' : 'text-navy';
  const border = theme === 'dark' ? 'border-beige/30' : 'border-navy/30';
  const barBg = theme === 'dark' ? 'rgba(255,240,219,0.12)' : 'rgba(47,65,86,0.12)';
  const barText = theme === 'dark' ? '#fff0db' : '#2F4156';
  const todayBg = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';

  const overflow: Record<string, number> = {};

  return (
    <div className="w-full">
      <div className={`mb-2 grid grid-cols-7 text-center text-sm font-bold uppercase tracking-wide ${text}`}>
        {weekdays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="flex flex-col overflow-hidden rounded-lg border border-white/5">
        {weeks.map((week, idx) => {
          const bars = buildWeekBars(week, events, overflow);
          return (
            <div
              key={idx}
              className="relative grid grid-cols-7 gap-px border-b border-white/5"
              style={{ minHeight: 120 }}
            >
              {week.map((day) => {
                const key = dateKey(day);
                const isCurrentMonth = day.getMonth() === monthIndex;
                const isToday = key === todayKey;
                const overflowCount = overflow[key] || 0;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => onSelectDate?.(day)}
                    className={`relative flex min-h-[120px] flex-col items-start rounded-sm p-2 text-left text-xs font-bold uppercase ${text} ${
                      isCurrentMonth ? '' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                        isToday ? todayBg : ''
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    {overflowCount > 0 ? (
                      <div className="mt-1 text-[11px] font-black text-amber-500">
                        +{overflowCount} more
                      </div>
                    ) : null}
                  </button>
                );
              })}
              <div className="pointer-events-none absolute inset-x-0 top-8">
                {bars.map((bar) => {
                  const width = `${(bar.span / 7) * 100}%`;
                  const left = `${(bar.startCol / 7) * 100}%`;
                  return (
                    <button
                      key={`${bar.event.id}-${bar.row}`}
                      type="button"
                      onClick={() => onSelectDate?.(new Date(bar.event.start))}
                      className="pointer-events-auto absolute h-6 overflow-hidden rounded-md border border-white/10 px-2 text-[11px] font-bold uppercase"
                      style={{
                        left,
                        width,
                        top: bar.row * 26,
                        background: bar.event.color || barBg,
                        color: barText,
                      }}
                    >
                      {bar.event.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
