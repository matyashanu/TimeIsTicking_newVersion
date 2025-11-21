'use client';

import { useMemo, useState } from 'react';
import { CalendarEvent } from './types';
import { useTheme } from '../ThemeProvider';

interface Props {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onClick?: (event: CalendarEvent) => void;
  onMove?: (event: CalendarEvent, start: Date, end: Date) => void;
  onResize?: (event: CalendarEvent, start: Date, end: Date) => void;
  pixelsPerMinute?: number;
  snapMinutes?: number;
  dayDate?: Date;
  dayWidth?: number;
  lockToDay?: boolean;
}

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_SNAP = 15;

export default function CalendarEventBlock({
  event,
  style,
  onClick,
  onMove,
  onResize,
  pixelsPerMinute,
  snapMinutes = DEFAULT_SNAP,
  dayDate,
  dayWidth,
  lockToDay = true,
}: Props) {
  const { theme } = useTheme();
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeOffset, setResizeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const snap = snapMinutes;
  const bg = event.color
    ? event.color
    : theme === 'dark'
      ? 'rgba(255,240,219,0.2)'
      : 'rgba(47,65,86,0.15)';
  const border = theme === 'dark' ? '1px solid rgba(255,240,219,0.45)' : '1px solid rgba(47,65,86,0.45)';
  const text = theme === 'dark' ? '#2F4156' : '#fff0db';

  const baseStart = useMemo(() => new Date(event.start), [event.start]);
  const baseEnd = useMemo(() => new Date(event.end), [event.end]);

  const clampToDay = (start: Date, end: Date) => {
    if (!dayDate || !lockToDay) return { start, end };
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const boundedStart = start < dayStart ? dayStart : start;
    const boundedEnd = end > dayEnd ? dayEnd : end;
    return { start: boundedStart, end: boundedEnd };
  };

  const snapMinutesValue = (minutes: number) => Math.round(minutes / snap) * snap;

  const attachMoveListeners = (type: 'drag' | 'resize', startEvent: PointerEvent) => {
    if (!pixelsPerMinute) return;
    const startY = startEvent.clientY;
    const startX = startEvent.clientX;
    const startTime = baseStart.getTime();
    const endTime = baseEnd.getTime();
    const minuteFromY = (deltaY: number) => Math.round(deltaY / pixelsPerMinute);

    const handleMove = (ev: PointerEvent) => {
      const minDelta = snapMinutesValue(minuteFromY(ev.clientY - startY));
      if (type === 'drag') {
        setDragOffset(minDelta * pixelsPerMinute);
      } else {
        setResizeOffset(minDelta * pixelsPerMinute);
      }
    };

    const handleUp = (ev: PointerEvent) => {
      const dayDelta =
        dayWidth && type === 'drag' ? Math.round((ev.clientX - startX) / dayWidth) : 0;
      const minDelta = snapMinutesValue(minuteFromY(ev.clientY - startY));
      if (type === 'drag' && onMove) {
        const nextStart = new Date(startTime + minDelta * 60000 + dayDelta * 24 * 60 * 60000);
        const nextEnd = new Date(endTime + minDelta * 60000 + dayDelta * 24 * 60 * 60000);
        const bounded = clampToDay(nextStart, nextEnd);
        const safeEnd =
          bounded.end <= bounded.start
            ? new Date(bounded.start.getTime() + snap * 60000)
            : bounded.end;
        onMove(event, bounded.start, safeEnd);
      }
      if (type === 'resize' && onResize) {
        const requestedEnd = new Date(endTime + minDelta * 60000);
        const minEnd = new Date(baseStart.getTime() + snap * 60000);
        const cappedEnd = requestedEnd < minEnd ? minEnd : requestedEnd;
        const bounded = clampToDay(baseStart, cappedEnd);
        onResize(event, bounded.start, bounded.end);
      }
      setDragOffset(0);
      setResizeOffset(0);
      setIsDragging(false);
      setIsResizing(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleDragStart = (e: React.PointerEvent) => {
    if (!onMove || !pixelsPerMinute) return;
    e.stopPropagation();
    setIsDragging(true);
    attachMoveListeners('drag', e.nativeEvent);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    if (!onResize || !pixelsPerMinute) return;
    e.stopPropagation();
    setIsResizing(true);
    attachMoveListeners('resize', e.nativeEvent);
  };

  const durationMinutes = Math.max(15, Math.round((baseEnd.getTime() - baseStart.getTime()) / 60000));
  const label =
    durationMinutes >= MINUTES_IN_DAY
      ? 'ALL DAY'
      : `${baseStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${baseEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div
      className="w-full select-none rounded-md px-2 py-1 text-left text-xs font-bold uppercase tracking-wide shadow-sm transition hover:opacity-90"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      onPointerDown={handleDragStart}
      style={{
        background: bg,
        border,
        color: text,
        cursor: onMove ? 'grab' : 'default',
        boxShadow: isDragging || isResizing ? `0 0 0 2px ${text}` : 'none',
        opacity: isDragging ? 0.85 : 1,
        transform:
          dragOffset !== 0
            ? `translateY(${dragOffset}px)`
            : resizeOffset !== 0
              ? `scaleY(${(durationMinutes + resizeOffset / (pixelsPerMinute || 1)) / durationMinutes})`
              : undefined,
        transformOrigin: 'top center',
        ...style,
      }}
      title={event.description || ''}
    >
      <div className="flex items-center justify-between">
        <span>{event.title || 'UNTITLED'}</span>
        <span className="text-[10px] opacity-80">{event.location}</span>
      </div>
      <div className="text-[10px] opacity-80">{label}</div>
      {onResize ? (
        <div
          className="absolute inset-x-1 bottom-0 h-2 cursor-ns-resize rounded-sm bg-white/20"
          onPointerDown={handleResizeStart}
        />
      ) : null}
    </div>
  );
}
