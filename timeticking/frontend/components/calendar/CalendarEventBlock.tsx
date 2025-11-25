'use client';

import { useMemo } from 'react';
import { CalendarEvent } from './types';
import { useTheme } from '../ThemeProvider';
import { resolveEventColors } from './colors';

interface Props {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>, calendarEvent: CalendarEvent) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLDivElement>, calendarEvent: CalendarEvent) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>, calendarEvent: CalendarEvent) => void;
}

const MINUTES_IN_DAY = 24 * 60;

export default function CalendarEventBlock({
  event,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const { theme } = useTheme();
  const colorStyles = useMemo(() => resolveEventColors(theme, event.color), [theme, event.color]);

  const baseStart = useMemo(() => new Date(event.start), [event.start]);
  const baseEnd = useMemo(() => new Date(event.end), [event.end]);
  const durationMinutes = Math.max(
    15,
    Math.round((baseEnd.getTime() - baseStart.getTime()) / 60000),
  );
  const label =
    durationMinutes >= MINUTES_IN_DAY
      ? 'ALL DAY'
      : `${baseStart.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${baseEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div
      className="calendar-event w-full select-none rounded-lg px-2 py-[6px] text-left text-xs font-bold uppercase tracking-wide leading-tight shadow-sm transition hover:opacity-95"
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, event) : undefined}
      onPointerMove={onPointerMove ? (e) => onPointerMove(e, event) : undefined}
      onPointerUp={onPointerUp ? (e) => onPointerUp(e, event) : undefined}
      style={{
        background: colorStyles.background,
        border: colorStyles.border,
        color: colorStyles.color,
        cursor: 'grab',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(2px)',
        ...style,
      }}
      title={event.description || ''}
    >
      <div className="flex flex-col gap-1 overflow-hidden">
        <span className="calendar-event-title text-[11px]">
          {event.title || 'UNTITLED'}
        </span>
        {event.location ? (
          <span className="text-[10px] opacity-80">{event.location}</span>
        ) : null}
      </div>
      <div className="text-[10px] opacity-80">{label}</div>
    </div>
  );
}
