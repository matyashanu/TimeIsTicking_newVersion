'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { CalendarEvent } from './types';
import CalendarEventBlock from './CalendarEventBlock';
import { useTheme } from '../ThemeProvider';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  busy?: boolean;
  onCreateRange?: (start: Date, end: Date) => void;
  onEventClick?: (ev: CalendarEvent) => void;
  onEventChange?: (id: string, start: Date, end: Date) => void;
  onSelectDate?: (date: Date) => void;
}

const hours = Array.from({ length: 24 }).map((_, i) => i);
const HOUR_ROW_PX = 64; // Tailwind h-16 = 64px
const MIN_EVENT_PX = 20;
const SNAP_MINUTES = 15;

type PositionedEvent = CalendarEvent & { top: number; height: number; column: number; columns: number };

function layoutDayEvents(dayEvents: CalendarEvent[]): PositionedEvent[] {
  const sorted = [...dayEvents].sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const clusters: CalendarEvent[][] = [];
  let cluster: CalendarEvent[] = [];
  let clusterEnd = -1;

  const minutesFromDate = (d: Date) => d.getHours() * 60 + d.getMinutes();

  sorted.forEach((ev) => {
    const start = minutesFromDate(new Date(ev.start));
    const end = minutesFromDate(new Date(ev.end));
    if (!cluster.length || start < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(cluster);
      cluster = [ev];
      clusterEnd = end;
    }
  });
  if (cluster.length) clusters.push(cluster);

  const positioned: PositionedEvent[] = [];
  clusters.forEach((group) => {
    const columns: CalendarEvent[][] = [];
    const columnMap = new Map<string, number>();

    group.forEach((ev) => {
      const start = minutesFromDate(new Date(ev.start));
      let colIndex = columns.findIndex((col) => {
        const last = col[col.length - 1];
        const lastEnd = minutesFromDate(new Date(last.end));
        return lastEnd <= start;
      });
      if (colIndex === -1) {
        columns.push([ev]);
        colIndex = columns.length - 1;
      } else {
        columns[colIndex].push(ev);
      }
      columnMap.set(ev.id, colIndex);
    });

    const colCount = columns.length || 1;
    group.forEach((ev) => {
      const startMinutes = minutesFromDate(new Date(ev.start));
      const endMinutes = minutesFromDate(new Date(ev.end));
      const duration = Math.max(endMinutes - startMinutes, (MIN_EVENT_PX / HOUR_ROW_PX) * 60);
      positioned.push({
        ...ev,
        top: (startMinutes / 60) * HOUR_ROW_PX,
        height: Math.max((duration / 60) * HOUR_ROW_PX, MIN_EVENT_PX),
        column: columnMap.get(ev.id) || 0,
        columns: colCount,
      });
    });
  });

  return positioned;
}

const dateKeyLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

export default function CalendarWeekView({
  currentDate,
  events,
  busy,
  onCreateRange,
  onEventClick,
  onEventChange,
  onSelectDate,
}: Props) {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  const { theme } = useTheme();
  const text = theme === 'dark' ? 'text-beige' : 'text-navy';
  const border = theme === 'dark' ? 'border-beige/30' : 'border-navy/30';
  const borderColor = theme === 'dark' ? 'rgba(255,240,219,0.3)' : 'rgba(47,65,86,0.3)';
  const gridHeight = HOUR_ROW_PX * 24;
  const [now, setNow] = useState(new Date());
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selection, setSelection] = useState<{ day: string; start: number; end: number } | null>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-white/5">
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className={`py-2 text-center text-sm font-semibold ${text}`}>
            <div
              className={`mx-auto inline-flex rounded-full px-3 py-1 ${
                day.toDateString() === currentDate.toDateString()
                  ? theme === 'dark'
                    ? 'bg-beige text-navy'
                    : 'bg-navy text-beige'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDate?.(day)}
                className="w-full"
              >
                <div className="uppercase">{format(day, 'EEEE')}</div>
                <div className="text-xs opacity-80">{format(day, 'd MMM')}</div>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
        <div className="flex flex-col">
          {hours.map((h) => (
            <div key={h} className={`h-16 border-b ${border} px-2 text-xs ${text}`}>
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayKey = dateKeyLocal(day);
          const dayEvents = events.filter((ev) => dateKeyLocal(new Date(ev.start)) === dayKey);
          const positioned = layoutDayEvents(dayEvents);
          const isToday = day.toDateString() === now.toDateString();
          const todayBg = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';
          const lineColor = '#FF0000';
          const minutesNow = now.getHours() * 60 + now.getMinutes();
          const lineTop = (minutesNow / 60) * HOUR_ROW_PX;
          const refKey = dayKey;
          const columnWidth = containerRefs.current[refKey]?.getBoundingClientRect()?.width;
          return (
            <div
              key={dayKey}
              ref={(node) => {
                containerRefs.current[refKey] = node;
              }}
              className={`relative ${isToday ? todayBg : ''}`}
              style={{ borderLeft: `1px solid ${borderColor}`, height: gridHeight }}
              onMouseDown={(e) => {
                if (!onCreateRange || e.button !== 0) return;
                const rect = (containerRefs.current[refKey] as HTMLDivElement)?.getBoundingClientRect();
                if (!rect) return;
                const y = e.clientY - rect.top;
                const minute = Math.max(0, Math.min(23 * 60 + 59, Math.floor((y / gridHeight) * 24 * 60)));
                const snapped = Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
                setSelection({ day: refKey, start: snapped, end: snapped + 30 });

                const handleMove = (ev: MouseEvent) => {
                  const nextY = ev.clientY - rect.top;
                  const nextMin = Math.max(0, Math.min(23 * 60 + 59, Math.floor((nextY / gridHeight) * 24 * 60)));
                  setSelection((prev) =>
                    prev && prev.day === refKey
                      ? { ...prev, end: Math.round(nextMin / SNAP_MINUTES) * SNAP_MINUTES }
                      : prev,
                  );
                };
                const handleUp = () => {
                  setSelection((prev) => {
                    if (!prev || prev.day !== refKey) return null;
                    const startMin = Math.min(prev.start, prev.end);
                    const endMin = Math.max(prev.start, prev.end);
                    const dayStart = new Date(day);
                    dayStart.setHours(0, 0, 0, 0);
                    const startDate = new Date(dayStart.getTime() + startMin * 60000);
                    const endDate = new Date(dayStart.getTime() + Math.max(endMin, startMin + 30) * 60000);
                    onCreateRange?.(startDate, endDate);
                    return null;
                  });
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                };
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
            >
              {hours.map((h) => (
                <div key={h} className={`h-16 border-b ${isToday ? '' : border}`} />
              ))}
              {selection && selection.day === refKey ? (
                <div
                  className="absolute left-1 right-1 rounded-md border border-dashed border-white/50 bg-white/10"
                  style={{
                    top: (Math.min(selection.start, selection.end) / (24 * 60)) * gridHeight,
                    height: Math.max(Math.abs(selection.end - selection.start), 30) * (gridHeight / (24 * 60)),
                  }}
                />
              ) : null}
              {isToday ? (
                <>
                  <div
                    className="absolute left-0 right-0 h-[2px]"
                    style={{ top: lineTop, backgroundColor: lineColor, boxShadow: `0 0 6px ${lineColor}` }}
                  />
                  <div
                    className="absolute -left-1 h-2 w-2 rounded-full"
                    style={{ top: lineTop - 4, backgroundColor: lineColor, boxShadow: `0 0 6px ${lineColor}` }}
                  />
                </>
              ) : null}
              {busy ? <div className="absolute inset-0 bg-black/5 pointer-events-none" /> : null}
              {positioned.map((ev) => {
                const width = `calc((100% - 16px) / ${ev.columns})`;
                const left = `calc(${ev.column} * ((100% - 16px) / ${ev.columns}) + 8px)`;
                return (
                  <CalendarEventBlock
                    key={ev.id}
                    event={ev}
                    style={{
                      position: 'absolute',
                      top: ev.top,
                      left,
                      width,
                      height: ev.height,
                      zIndex: 4 + ev.column,
                    }}
                    dayDate={day}
                    pixelsPerMinute={HOUR_ROW_PX / 60}
                    snapMinutes={SNAP_MINUTES}
                    dayWidth={columnWidth}
                    lockToDay={false}
                    onClick={onEventClick}
                    onMove={(event, start, end) => onEventChange?.(event.id, start, end)}
                    onResize={(event, start, end) => onEventChange?.(event.id, start, end)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
