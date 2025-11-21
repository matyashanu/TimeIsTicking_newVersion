'use client';

import { CalendarEvent } from './types';
import CalendarEventBlock from './CalendarEventBlock';
import { useTheme } from '../ThemeProvider';
import { useEffect, useRef, useState } from 'react';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  busy?: boolean;
  onCreateRange?: (start: Date, end: Date) => void;
  onEventClick?: (ev: CalendarEvent) => void;
  onEventChange?: (id: string, start: Date, end: Date) => void;
}

const hours = Array.from({ length: 24 }).map((_, i) => i);
const HOUR_ROW_PX = 64;
const MIN_EVENT_PX = 24;
const GRID_HEIGHT = HOUR_ROW_PX * 24;
const SNAP_MINUTES = 15;

type PositionedEvent = CalendarEvent & { top: number; height: number; column: number; columns: number };

const minutesFromDate = (date: Date) => date.getHours() * 60 + date.getMinutes();

function layoutDayEvents(dayEvents: CalendarEvent[]): PositionedEvent[] {
  const sorted = [...dayEvents].sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const clusters: CalendarEvent[][] = [];
  let currentCluster: CalendarEvent[] = [];
  let clusterEnd = -1;

  sorted.forEach((ev) => {
    const start = minutesFromDate(new Date(ev.start));
    const end = minutesFromDate(new Date(ev.end));
    if (currentCluster.length === 0) {
      currentCluster.push(ev);
      clusterEnd = end;
      return;
    }
    if (start < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = end;
    }
  });
  if (currentCluster.length) clusters.push(currentCluster);

  const positioned: PositionedEvent[] = [];

  clusters.forEach((cluster) => {
    const columns: CalendarEvent[][] = [];
    const columnMap = new Map<string, number>();

    cluster.forEach((ev) => {
      const start = minutesFromDate(new Date(ev.start));
      const end = minutesFromDate(new Date(ev.end));
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
    cluster.forEach((ev) => {
      const start = minutesFromDate(new Date(ev.start));
      const end = minutesFromDate(new Date(ev.end));
      const duration = Math.max(end - start, (MIN_EVENT_PX / HOUR_ROW_PX) * 60);
      positioned.push({
        ...ev,
        top: (start / 60) * HOUR_ROW_PX,
        height: Math.max((duration / 60) * HOUR_ROW_PX, MIN_EVENT_PX),
        column: columnMap.get(ev.id) ?? 0,
        columns: colCount,
      });
    });
  });

  return positioned;
}

export default function CalendarDayView({ currentDate, events, busy, onCreateRange, onEventClick, onEventChange }: Props) {
  const dateKeyLocal = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  const dayKey = dateKeyLocal(currentDate);
  const dayEvents = events.filter((ev) => {
    const d = new Date(ev.start);
    return dateKeyLocal(d) === dayKey;
  });
  const positioned = layoutDayEvents(dayEvents);
  const { theme } = useTheme();
  const text = theme === 'dark' ? 'text-beige' : 'text-navy';
  const border = theme === 'dark' ? 'border-beige/30' : 'border-navy/30';
  const todayBg = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';
  const lineColor = '#FF0000';
  const [now, setNow] = useState(new Date());
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const isToday = currentDate.toDateString() === now.toDateString();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const lineTop = (minutesNow / 60) * HOUR_ROW_PX;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-white/5">
      <div className="grid grid-cols-[80px_1fr] uppercase">
        <div className={`py-2 text-center text-sm font-semibold ${text}`}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
        <div />
      </div>
      <div className="grid grid-cols-[80px_1fr]">
        <div className="flex flex-col">
          {hours.map((h) => (
            <div key={h} className={`h-16 border-b ${border} px-2 text-xs ${text}`}>
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div
          ref={gridRef}
          className={`relative ${isToday ? todayBg : ''}`}
          style={{ height: GRID_HEIGHT }}
          onMouseDown={(e) => {
            if (!onCreateRange || e.button !== 0) return;
            const rect = gridRef.current?.getBoundingClientRect();
            if (!rect) return;
            const y = e.clientY - rect.top;
            const minute = Math.max(0, Math.min(23 * 60 + 59, Math.floor((y / GRID_HEIGHT) * 24 * 60)));
            const snapped = Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
            setSelection({ start: snapped, end: snapped + 30 });

            const handleMove = (ev: MouseEvent) => {
              const nextY = ev.clientY - rect.top;
              const nextMin = Math.max(0, Math.min(23 * 60 + 59, Math.floor((nextY / GRID_HEIGHT) * 24 * 60)));
              setSelection((prev) => (prev ? { ...prev, end: Math.round(nextMin / SNAP_MINUTES) * SNAP_MINUTES } : null));
            };
            const handleUp = () => {
              setSelection((prev) => {
                if (!prev) return null;
                const startMin = Math.min(prev.start, prev.end);
                const endMin = Math.max(prev.start, prev.end);
                const dateStart = new Date(currentDate);
                dateStart.setHours(0, 0, 0, 0);
                const startDate = new Date(dateStart.getTime() + startMin * 60000);
                const endDate = new Date(dateStart.getTime() + Math.max(endMin, startMin + 30) * 60000);
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
          {isToday ? (
            <>
              <div
                className="absolute left-0 right-0 h-[2px]"
                style={{ top: lineTop, backgroundColor: lineColor, boxShadow: `0 0 6px ${lineColor}`, zIndex: 30 }}
              />
              <div
                className="absolute -left-1 h-2 w-2 rounded-full"
                style={{ top: lineTop - 4, backgroundColor: lineColor, boxShadow: `0 0 6px ${lineColor}`, zIndex: 31 }}
              />
            </>
          ) : null}
          {selection ? (
            <div
              className="absolute left-2 right-2 rounded-md border border-dashed border-white/50 bg-white/10"
              style={{
                top: (Math.min(selection.start, selection.end) / (24 * 60)) * GRID_HEIGHT,
                height: Math.max(Math.abs(selection.end - selection.start), 30) * (GRID_HEIGHT / (24 * 60)),
              }}
            />
          ) : null}
          {busy ? <div className="absolute inset-0 bg-black/10" /> : null}
          {positioned.map((ev) => {
            const width = `calc((100% - 24px) / ${ev.columns})`;
            const left = `calc(${ev.column} * ((100% - 24px) / ${ev.columns}) + 12px)`;
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
                  zIndex: 5 + ev.column,
                }}
                dayDate={currentDate}
                pixelsPerMinute={HOUR_ROW_PX / 60}
                snapMinutes={SNAP_MINUTES}
                onClick={onEventClick}
                onMove={(event, start, end) => onEventChange?.(event.id, start, end)}
                onResize={(event, start, end) => onEventChange?.(event.id, start, end)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
