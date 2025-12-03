'use client';

import { addDays, addMinutes } from 'date-fns';
import { CalendarEvent } from './types';
import CalendarEventBlock from './CalendarEventBlock';
import { useTheme } from '../ThemeProvider';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

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
const CELL_HEIGHT_PX = HOUR_ROW_PX;
const MIN_EVENT_PX = 24;
const GRID_HEIGHT = HOUR_ROW_PX * 24;
const SNAP_MINUTES = 15;
const EVENT_GUTTER = 8;

type PositionedEvent = CalendarEvent & { top: number; height: number; column: number; columns: number };
type DisplayedEvent = PositionedEvent & { dayKey: string; dayIndex: number };
type DragSession = {
  startX: number;
  startY: number;
  originalStart: Date;
  originalEnd: Date;
  dragging: boolean;
  pointerId: number;
  eventId: string;
  dayKey: string;
  dayWidth: number;
  dayIndex: number;
  totalDays: number;
  dayKeys: string[];
};
type GhostPreview = { event: DisplayedEvent; minutesOffset: number; targetDayKey: string };

type EventPointerEvent = ReactPointerEvent<HTMLDivElement>;

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

const clampOffsetToDay = (event: DisplayedEvent, offsetMinutes: number) => {
  const startMinutes = minutesFromDate(new Date(event.start));
  const endMinutes = minutesFromDate(new Date(event.end));
  const duration = endMinutes - startMinutes;
  let nextStart = startMinutes + offsetMinutes;
  let nextEnd = nextStart + duration;

  if (nextStart < 0) {
    offsetMinutes += -nextStart;
    nextStart = 0;
    nextEnd = duration;
  }
  if (nextEnd > 24 * 60) {
    const overshoot = nextEnd - 24 * 60;
    offsetMinutes -= overshoot;
  }
  return offsetMinutes;
};

const getEventLayoutStyle = (event: PositionedEvent, gutter: number) => {
  const width = `calc((100% - ${(event.columns + 1) * gutter}px) / ${event.columns})`;
  const left = `calc(${gutter}px + (${width} + ${gutter}px) * ${event.column})`;
  return { width, left };
};

const snapMinutes = (value: number) => Math.round(value / SNAP_MINUTES) * SNAP_MINUTES;

const calculateDayOffset = (session: DragSession, pointerX: number) => {
  if (!session.dayWidth) return 0;
  const rawOffset = Math.round((pointerX - session.startX) / session.dayWidth);
  const minOffset = -session.dayIndex;
  const maxOffset = session.totalDays - 1 - session.dayIndex;
  return Math.max(minOffset, Math.min(maxOffset, rawOffset));
};

export default function CalendarDayView({ currentDate, events, busy, onCreateRange, onEventClick, onEventChange }: Props) {
  const dateKeyLocal = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  const dayKey = dateKeyLocal(currentDate);
  const dayKeys = [dayKey];
  const totalDays = dayKeys.length;
  const dayEvents = events.filter((ev) => {
    const d = new Date(ev.start);
    return dateKeyLocal(d) === dayKey;
  });
  const positioned = layoutDayEvents(dayEvents);
  const displayedEvents: DisplayedEvent[] = positioned.map((ev) => ({ ...ev, dayKey, dayIndex: 0 }));
  const { theme } = useTheme();
  const palette =
    theme === 'dark'
      ? {
          border: 'var(--grid-line)',
          currentTint: 'rgba(245,239,235,0.1)',
          selection: 'rgba(245,239,235,0.2)',
          busy: 'rgba(36,51,65,0.35)',
        }
      : {
          border: 'var(--grid-line)',
          currentTint: 'rgba(47,65,86,0.12)',
          selection: 'rgba(47,65,86,0.18)',
          busy: 'rgba(47,65,86,0.15)',
        };
  const lineColor = '#FF0000';
  const [now, setNow] = useState(new Date());
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragSession | null>(null);
  const [ghostEvent, setGhostEvent] = useState<GhostPreview | null>(null);

  const setSelectionState = useCallback((next: { start: number; end: number } | null) => {
    selectionRef.current = next;
    setSelection(next);
  }, []);

  const showGhost = useCallback((event: DisplayedEvent) => {
    setGhostEvent({ event, minutesOffset: 0, targetDayKey: event.dayKey });
  }, []);

  const updateGhostEventPosition = useCallback(
    (event: DisplayedEvent, minutesMoved: number, targetDayKey: string) => {
      setGhostEvent((prev) => {
        if (
          prev &&
          prev.event.id === event.id &&
          prev.minutesOffset === minutesMoved &&
          prev.targetDayKey === targetDayKey
        ) {
          return prev;
        }
        return { event, minutesOffset: minutesMoved, targetDayKey };
      });
    },
    [],
  );

  const hideGhost = useCallback(() => setGhostEvent(null), []);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const handleEventPointerDown = useCallback(
    (e: EventPointerEvent, event: DisplayedEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore capture errors
        }
      }
      const width = gridRef.current?.getBoundingClientRect()?.width ?? 0;
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originalStart: new Date(event.start),
        originalEnd: new Date(event.end),
        dragging: false,
        pointerId: e.pointerId,
        eventId: event.id,
        dayKey: event.dayKey,
        dayWidth: width || 1,
        dayIndex: event.dayIndex,
        totalDays,
        dayKeys,
      };
    },
    [dayKeys, totalDays],
  );

  const handleEventPointerMove = useCallback(
    (e: EventPointerEvent, event: DisplayedEvent) => {
      const session = dragState.current;
      if (!session || session.eventId !== event.id) return;
      const dx = Math.abs(e.clientX - session.startX);
      const dy = Math.abs(e.clientY - session.startY);
      if (!session.dragging && (dx > 4 || dy > 4)) {
        session.dragging = true;
        showGhost(event);
      }
      if (session.dragging) {
        const rawMinutes = ((e.clientY - session.startY) / CELL_HEIGHT_PX) * 60;
        const snappedMinutes = snapMinutes(rawMinutes);
        const clampedMinutes = clampOffsetToDay(event, snappedMinutes);
        const dayOffset = calculateDayOffset(session, e.clientX);
        const targetDayKey = session.dayKeys[session.dayIndex + dayOffset] ?? event.dayKey;
        updateGhostEventPosition(event, clampedMinutes, targetDayKey);
      }
    },
    [showGhost, updateGhostEventPosition],
  );

  const handleEventPointerUp = useCallback(
    (e: EventPointerEvent, event: DisplayedEvent) => {
      const session = dragState.current;
      if (!session || session.eventId !== event.id) return;
      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore release errors
        }
      }
      if (session.dragging) {
        const rawMinutes = ((e.clientY - session.startY) / CELL_HEIGHT_PX) * 60;
        const snappedMinutes = snapMinutes(rawMinutes);
        const clamped = clampOffsetToDay(event, snappedMinutes);
        const dayOffset = calculateDayOffset(session, e.clientX);
        if (onEventChange) {
          const newStart = addDays(addMinutes(session.originalStart, clamped), dayOffset);
          const newEnd = addDays(addMinutes(session.originalEnd, clamped), dayOffset);
          onEventChange(event.id, newStart, newEnd);
        }
        hideGhost();
        dragState.current = null;
        return;
      }
      hideGhost();
      onEventClick?.(event);
      dragState.current = null;
    },
    [hideGhost, onEventChange, onEventClick],
  );

  const isToday = currentDate.toDateString() === now.toDateString();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const lineTop = (minutesNow / 60) * HOUR_ROW_PX;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-[color:var(--border)]/25 bg-[color:var(--card-bg)]/80 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
      <div className="grid grid-cols-[80px_1fr] uppercase text-[color:var(--fg)]">
        <div className="py-2 text-center text-sm font-semibold">
          {currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })}
        </div>
        <div />
      </div>
      <div className="grid grid-cols-[80px_1fr]">
        <div className="flex flex-col text-[color:var(--fg)]">
          {hours.map((h) => (
            <div
              key={h}
              className="h-16 px-2 text-xs"
              style={{ borderBottom: `1px solid ${palette.border}` }}
            >
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div
          ref={gridRef}
          className="relative"
          style={{
            height: GRID_HEIGHT,
            backgroundColor: 'var(--card-bg)',
            borderLeft: `1px solid ${palette.border}`,
          }}
          onMouseDown={(e) => {
            if (dragState.current?.dragging) {
              dragState.current = null;
              hideGhost();
              return;
            }
            if (!onCreateRange || e.button !== 0) return;
            const rect = gridRef.current?.getBoundingClientRect();
            if (!rect) return;
            const y = e.clientY - rect.top;
            const minute = Math.max(0, Math.min(23 * 60 + 59, Math.floor((y / GRID_HEIGHT) * 24 * 60)));
            const snapped = Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
            setSelectionState({ start: snapped, end: snapped + 30 });

            const initialStart = snapped;
            const handleMove = (ev: MouseEvent) => {
              const nextY = ev.clientY - rect.top;
              const nextMin = Math.max(0, Math.min(23 * 60 + 59, Math.floor((nextY / GRID_HEIGHT) * 24 * 60)));
              setSelectionState({ start: initialStart, end: Math.round(nextMin / SNAP_MINUTES) * SNAP_MINUTES });
            };
            const handleUp = () => {
              const currentSelection = selectionRef.current;
              if (currentSelection) {
                const startMin = Math.min(currentSelection.start, currentSelection.end);
                const endMin = Math.max(currentSelection.start, currentSelection.end);
                const dateStart = new Date(currentDate);
                dateStart.setHours(0, 0, 0, 0);
                const startDate = new Date(dateStart.getTime() + startMin * 60000);
                const endDate = new Date(dateStart.getTime() + Math.max(endMin, startMin + 30) * 60000);
                onCreateRange?.(startDate, endDate);
              }
              setSelectionState(null);
              window.removeEventListener('mousemove', handleMove);
              window.removeEventListener('mouseup', handleUp);
            };
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
          }}
        >
          {isToday ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: palette.currentTint, zIndex: 1 }}
            />
          ) : null}
          <div className="relative z-10 h-full">
            {hours.map((h) => (
              <div
                key={h}
                className="h-16"
                style={{ borderBottom: `1px solid ${palette.border}` }}
              />
            ))}
            {isToday ? (
              <>
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: lineTop,
                    height: 3,
                    backgroundColor: lineColor,
                    zIndex: 30,
                    boxShadow: '0 0 8px rgba(255,0,0,0.35)',
                  }}
                />
                <div
                  className="absolute -left-1"
                  style={{
                    top: lineTop - 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: lineColor,
                    boxShadow: '0 0 6px rgba(255,0,0,0.4)',
                    zIndex: 31,
                  }}
                />
              </>
            ) : null}
            {selection ? (
              <div
                className="absolute left-2 right-2 rounded-lg border border-dashed"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.selection,
                  top: (Math.min(selection.start, selection.end) / (24 * 60)) * GRID_HEIGHT,
                  height: Math.max(Math.abs(selection.end - selection.start), 30) * (GRID_HEIGHT / (24 * 60)),
                }}
              />
            ) : null}
            {ghostEvent && ghostEvent.targetDayKey === dayKey ? (
              <div
                className="pointer-events-none absolute rounded-lg border border-dashed"
                style={{
                  ...getEventLayoutStyle(ghostEvent.event, EVENT_GUTTER),
                  top: Math.max(
                    0,
                    Math.min(
                      GRID_HEIGHT - ghostEvent.event.height,
                      ghostEvent.event.top + (ghostEvent.minutesOffset / 60) * HOUR_ROW_PX,
                    ),
                  ),
                  height: ghostEvent.event.height,
                  backgroundColor: palette.selection,
                  borderColor: palette.border,
                  zIndex: 50,
                  opacity: 0.9,
                }}
              />
            ) : null}
            {busy ? (
              <div
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: palette.busy, pointerEvents: 'none' }}
              />
            ) : null}
            {displayedEvents.map((ev) => {
              const layout = getEventLayoutStyle(ev, EVENT_GUTTER);
              return (
                <CalendarEventBlock
                  key={ev.id}
                  event={ev}
                  style={{
                    position: 'absolute',
                    top: ev.top,
                    left: layout.left,
                    width: layout.width,
                    height: ev.height,
                    zIndex: 5 + ev.column,
                  }}
                  onPointerDown={handleEventPointerDown}
                  onPointerMove={handleEventPointerMove}
                  onPointerUp={handleEventPointerUp}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
