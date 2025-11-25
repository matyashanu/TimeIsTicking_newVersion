'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarEvent } from './types';
import { useTheme } from '../ThemeProvider';
import { EVENT_COLOR_OPTIONS, EVENT_COLOR_SWATCHES, EventColorKey } from './colors';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  initialDate?: Date;
  initialEndDate?: Date;
  event?: CalendarEvent;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}

const repeatOptions = ['none', 'daily', 'weekly', 'monthly'] as const;

export default function EventModal({
  open,
  mode,
  initialDate,
  initialEndDate,
  event,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const { theme } = useTheme();
  const ref = useRef<HTMLFormElement | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<EventColorKey>('default');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  useEffect(() => {
    if (open) {
      const base = event || {
        title: '',
        description: '',
        color: '',
        start: initialDate ? initialDate.toISOString() : new Date().toISOString(),
        end: initialEndDate
          ? initialEndDate.toISOString()
          : initialDate
            ? new Date(initialDate.getTime() + 60 * 60 * 1000).toISOString()
            : new Date().toISOString(),
        repeat: 'none',
      };
      setTitle(base.title || '');
      setDescription(base.description || '');
      setColor(isColorKey(base.color) ? (base.color as EventColorKey) : 'default');
      setStart(base.start);
      setEnd(base.end);
      setRepeat((base.repeat as typeof repeat) || 'none');
    }
  }, [open, event, initialDate]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const button = 'bg-[color:var(--fg)] text-[color:var(--bg)] hover:opacity-90';
  const field = 'bg-[color:var(--bg)]/30 text-[color:var(--fg)]';

  function isColorKey(value?: string | null): value is EventColorKey {
    if (!value) return false;
    return EVENT_COLOR_OPTIONS.includes(value as EventColorKey);
  }

  if (!open) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !start || !end) return;
    const newEvent: CalendarEvent = {
      id: event?.id || crypto.randomUUID(),
      title,
      description,
      color: color === 'default' ? undefined : color,
      start,
      end,
      repeat,
      source: event?.source || 'local',
    };
    onSave(newEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="w-full max-w-xl space-y-4 rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] p-6 text-[color:var(--fg)] shadow-[0_35px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="text-lg font-bold">{mode === 'add' ? 'Add Event' : 'Edit Event'}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-semibold">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-1 w-full rounded-lg border border-[color:var(--border)]/40 px-3 py-2 text-sm ${field} outline-none`}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Start *</label>
            <input
              type="datetime-local"
              value={start.slice(0, 16)}
              onChange={(e) => setStart(new Date(e.target.value).toISOString())}
              className={`mt-1 w-full rounded-lg border border-[color:var(--border)]/40 px-3 py-2 text-sm ${field} outline-none`}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">End *</label>
            <input
              type="datetime-local"
              value={end.slice(0, 16)}
              onChange={(e) => setEnd(new Date(e.target.value).toISOString())}
              className={`mt-1 w-full rounded-lg border border-[color:var(--border)]/40 px-3 py-2 text-sm ${field} outline-none`}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Repeat</label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as typeof repeat)}
              className={`mt-1 w-full rounded-lg border border-[color:var(--border)]/40 px-3 py-2 text-sm ${field} outline-none`}
            >
              {repeatOptions.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-semibold">Color</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {EVENT_COLOR_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  className={`flex flex-col items-center justify-center rounded-xl border border-[color:var(--border)]/30 px-3 py-2 text-xs font-bold uppercase ${
                    color === key ? 'ring-2 ring-[color:var(--fg)]' : ''
                  }`}
                  style={{
                    backgroundColor: EVENT_COLOR_SWATCHES[key],
                    color: key === 'default' ? 'var(--fg)' : '#2F4156',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-semibold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`mt-1 w-full rounded-lg border border-[color:var(--border)]/40 px-3 py-2 text-sm ${field} outline-none`}
            />
          </div>
        </div>
        <div className="flex justify-between">
          {mode === 'edit' && onDelete ? (
            <button
              type="button"
              onClick={() => event?.id && onDelete(event.id)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border border-[color:var(--border)]/40 px-4 py-2 text-sm font-semibold ${field}`}
            >
              Cancel
            </button>
            <button type="submit" className={`rounded-lg px-4 py-2 text-sm font-semibold ${button}`}>
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
