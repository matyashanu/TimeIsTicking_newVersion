'use client';

import { addDays, addMinutes, format, startOfWeek } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarEvent } from './types';
import CalendarEventBlock from './CalendarEventBlock';
import { useTheme } from '../ThemeProvider';
import type { PointerEvent as ReactPointerEvent } from 'react';

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
const CELL_HEIGHT_PX = HOUR_ROW_PX;
const MIN_EVENT_PX = 20;
const SNAP_MINUTES = 15;
const EVENT_GUTTER = 6;

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

const minutesFromDate = (d: Date) => d.getHours() * 60 + d.getMinutes();

function layoutDayEvents(dayEvents: CalendarEvent[]): PositionedEvent[] {
  const sorted = [...dayEvents].sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const clusters: CalendarEvent[][] = [];
  let cluster: CalendarEvent[] = [];
  let clusterEnd = -1;

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

const getEventLayoutStyle = (event: PositionedEvent) => {
  const width = `calc((100% - ${(event.columns + 1) * EVENT_GUTTER}px) / ${event.columns})`;
  const left = `calc(${EVENT_GUTTER}px + (${width} + ${EVENT_GUTTER}px) * ${event.column})`;
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
  const palette =
    theme === 'dark'
      ? {
          text: 'text-[color:var(--fg)]',
          border: 'var(--grid-line)',
          borderColor: 'rgba(245,239,235,0.25)',
          tint: 'rgba(245,239,235,0.1)',
          selection: 'rgba(245,239,235,0.2)',
          busy: 'rgba(36,51,65,0.35)',
        }
      : {
          text: 'text-[color:var(--fg)]',
          border: 'var(--grid-line)',
          borderColor: 'rgba(47,65,86,0.25)',
          tint: 'rgba(47,65,86,0.12)',
          selection: 'rgba(47,65,86,0.18)',
          busy: 'rgba(47,65,86,0.15)',
        };
  const gridHeight = HOUR_ROW_PX * 24;
  const [now, setNow] = useState(new Date());
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selection, setSelection] = useState<{ day: string; start: number; end: number } | null>(null);
  const selectionRef = useRef<{ day: string; start: number; end: number } | null>(null);
  const dragState = useRef<DragSession | null>(null);
  const [ghostEvent, setGhostEvent] = useState<GhostPreview | null>(null);
  const dayKeys = days.map((day) => dateKeyLocal(day));
  const totalDays = dayKeys.length;

  const setSelectionState = useCallback((next: { day: string; start: number; end: number } | null) => {
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
      const column = containerRefs.current[event.dayKey];
      const width = column?.getBoundingClientRect()?.width ?? column?.offsetWidth ?? 0;
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

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-[color:var(--border)]/25 bg-[color:var(--card-bg)]/80 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] text-[color:var(--fg)]">
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="py-2 text-center text-sm font-semibold">
            <button
              type="button"
              onClick={() => onSelectDate?.(day)}
              className={`mx-auto flex w-full justify-center`}
            >
              <div
                className={`flex flex-col items-center gap-1 text-sm ${
                  day.toDateString() === currentDate.toDateString()
                    ? 'calendar-today-pill'
                    : 'nav-tab'
                }`}
              >
                <span className="uppercase">{format(day, 'EEEE')}</span>
                <span className="text-xs opacity-80">{format(day, 'd MMM')}</span>
              </div>
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
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
        {days.map((day, dayIndex) => {
          const dayKey = dayKeys[dayIndex];
          const dayEvents = events.filter((ev) => dateKeyLocal(new Date(ev.start)) === dayKey);
          const positioned = layoutDayEvents(dayEvents);
          const displayedEvents: DisplayedEvent[] = positioned.map((ev) => ({
            ...ev,
            dayKey,
            dayIndex,
          }));
          const isToday = day.toDateString() === now.toDateString();
          const lineColor = '#FF0000';
          const minutesNow = now.getHours() * 60 + now.getMinutes();
          const lineTop = (minutesNow / 60) * HOUR_ROW_PX;
          const refKey = dayKey;
          return (
            <div
              key={dayKey}
              ref={(node) => {
                containerRefs.current[refKey] = node;
              }}
              className="relative"
              style={{
                borderLeft: `1px solid ${palette.borderColor}`,
                height: gridHeight,
                backgroundColor: 'var(--card-bg)',
              }}
              onMouseDown={(e) => {
                if (dragState.current?.dragging) {
                  dragState.current = null;
                  hideGhost();
                  return;
                }
                if (!onCreateRange || e.button !== 0) return;
                const rect = (containerRefs.current[refKey] as HTMLDivElement)?.getBoundingClientRect();
                if (!rect) return;
                const y = e.clientY - rect.top;
                const minute = Math.max(0, Math.min(23 * 60 + 59, Math.floor((y / gridHeight) * 24 * 60)));
                const snapped = Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
                setSelectionState({ day: refKey, start: snapped, end: snapped + 30 });

                const handleMove = (ev: MouseEvent) => {
                  const nextY = ev.clientY - rect.top;
                  const nextMin = Math.max(0, Math.min(23 * 60 + 59, Math.floor((nextY / gridHeight) * 24 * 60)));
                  const current = selectionRef.current;
                  if (current && current.day === refKey) {
                    setSelectionState({
                      ...current,
                      end: Math.round(nextMin / SNAP_MINUTES) * SNAP_MINUTES,
                    });
                  }
                };
                const handleUp = () => {
                  const current = selectionRef.current;
                  if (current && current.day === refKey) {
                    const startMin = Math.min(current.start, current.end);
                    const endMin = Math.max(current.start, current.end);
                    const dayStart = new Date(day);
                    dayStart.setHours(0, 0, 0, 0);
                    const startDate = new Date(dayStart.getTime() + startMin * 60000);
                    const endDate = new Date(dayStart.getTime() + Math.max(endMin, startMin + 30) * 60000);
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
                  style={{ backgroundColor: palette.tint, zIndex: 1 }}
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
                {selection && selection.day === refKey ? (
                  <div
                    className="absolute left-1 right-1 rounded-md border border-dashed"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.selection,
                      top: (Math.min(selection.start, selection.end) / (24 * 60)) * gridHeight,
                      height: Math.max(Math.abs(selection.end - selection.start), 30) * (gridHeight / (24 * 60)),
                    }}
                  />
                ) : null}
                {ghostEvent && ghostEvent.targetDayKey === dayKey ? (
                  <div
                    className="pointer-events-none absolute rounded-md border border-dashed"
                    style={{
                      ...getEventLayoutStyle(ghostEvent.event),
                      top: Math.max(
                        0,
                        Math.min(
                          gridHeight - ghostEvent.event.height,
                          ghostEvent.event.top + (ghostEvent.minutesOffset / 60) * HOUR_ROW_PX,
                        ),
                      ),
                      height: ghostEvent.event.height,
                      backgroundColor: palette.selection,
                      borderColor: palette.border,
                      zIndex: 40,
                      opacity: 0.9,
                    }}
                  />
                ) : null}
                {isToday ? (
                  <>
                    <div
                      className="absolute left-0 right-0"
                      style={{
                        top: lineTop,
                        height: 3,
                        backgroundColor: lineColor,
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
                        backgroundColor: lineColor,
                        boxShadow: '0 0 6px rgba(255,0,0,0.4)',
                      }}
                    />
                  </>
                ) : null}
                {busy ? (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: palette.busy }}
                  />
                ) : null}
                {displayedEvents.map((ev) => {
                  const layout = getEventLayoutStyle(ev);
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
                        zIndex: 4 + ev.column,
                      }}
                      onPointerDown={handleEventPointerDown}
                      onPointerMove={handleEventPointerMove}
                      onPointerUp={handleEventPointerUp}
                    />
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
