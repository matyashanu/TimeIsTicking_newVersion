'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarEvent } from './types';
import { useTheme } from '../ThemeProvider';

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
  const ref = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
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
      setColor(base.color || '');
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

  const text = theme === 'dark' ? 'text-beige' : 'text-navy';
  const bg = theme === 'dark' ? 'bg-navy' : 'bg-beige';
  const field = theme === 'dark' ? 'bg-white/5 text-beige' : 'bg-black/5 text-navy';
  const button = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';
  const border = theme === 'dark' ? 'border-beige/30' : 'border-navy/30';

  if (!open) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !start || !end) return;
    const newEvent: CalendarEvent = {
      id: event?.id || crypto.randomUUID(),
      title,
      description,
      color: color || undefined,
      start,
      end,
      repeat,
      source: event?.source || 'local',
    };
    onSave(newEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        ref={ref}
        onSubmit={onSubmit}
        className={`w-full max-w-xl rounded-2xl border ${border} ${bg} p-6 shadow-xl space-y-4`}
      >
        <div className={`text-lg font-bold ${text}`}>{mode === 'add' ? 'Add Event' : 'Edit Event'}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={`text-sm font-semibold ${text}`}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${field} border ${border} outline-none`}
              required
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${text}`}>Start *</label>
            <input
              type="datetime-local"
              value={start.slice(0, 16)}
              onChange={(e) => setStart(new Date(e.target.value).toISOString())}
              className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${field} border ${border} outline-none`}
              required
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${text}`}>End *</label>
            <input
              type="datetime-local"
              value={end.slice(0, 16)}
              onChange={(e) => setEnd(new Date(e.target.value).toISOString())}
              className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${field} border ${border} outline-none`}
              required
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${text}`}>Repeat</label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as typeof repeat)}
              className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${field} border ${border} outline-none`}
            >
              {repeatOptions.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-sm font-semibold ${text}`}>Color</label>
            <input
              type="color"
              value={color || '#ffffff'}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-transparent"
            />
          </div>
          <div className="col-span-2">
            <label className={`text-sm font-semibold ${text}`}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${field} border ${border} outline-none`}
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
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${field} border ${border}`}
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
