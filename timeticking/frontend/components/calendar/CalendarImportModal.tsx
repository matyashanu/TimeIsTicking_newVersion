'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarEvent } from './types';
import { useTheme } from '../ThemeProvider';
import { importCalendar } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  onImportComplete: (events: CalendarEvent[]) => void;
}

export default function CalendarImportModal({ open, onClose, onImportComplete }: Props) {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState('');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const text = theme === 'dark' ? 'text-beige' : 'text-navy';
  const bg = theme === 'dark' ? 'bg-navy' : 'bg-beige';
  const field = theme === 'dark' ? 'bg-white/5 text-beige' : 'bg-black/5 text-navy';
  const button = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';
  const border = theme === 'dark' ? 'border-beige/30' : 'border-navy/30';

  const handleFile = async (file: File, type: 'csv' | 'ics') => {
    const textContent = await file.text();
    await sendForParse(type, textContent);
  };

  const sendForParse = async (type: 'csv' | 'ics', content?: string) => {
    setLoading(true);
    setError(null);
    try {
      const events = await importCalendar(type, { content, url: type === 'ics' ? icsUrl : undefined });
      setPreview(events);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    onImportComplete(preview);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <div
        ref={modalRef}
        className={`w-full max-w-2xl rounded-2xl border ${border} ${bg} p-6 shadow-xl`}
      >
        <div className={`mb-4 text-lg font-bold ${text}`}>Import Calendar</div>
        <div className="flex flex-col gap-4">
          <label className={`text-sm font-semibold ${text}`}>iCal URL</label>
          <div className="flex gap-2">
            <input
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              placeholder="https://example.com/calendar.ics"
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${field} border ${border} outline-none`}
            />
            <button
              type="button"
              onClick={() => sendForParse('ics')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${button}`}
              disabled={loading}
            >
              Import iCal URL
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".ics"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file, 'ics');
              }}
              className="text-sm"
            />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file, 'csv');
              }}
              className="text-sm"
            />
          </div>

          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          {loading ? <div className={`text-sm ${text}`}>Parsing...</div> : null}

          {preview.length > 0 ? (
            <div className="max-h-48 overflow-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-black/10">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Start</th>
                    <th className="px-3 py-2">End</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((ev) => (
                    <tr key={ev.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{ev.title}</td>
                      <td className="px-3 py-2">
                        {new Date(ev.start).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {new Date(ev.end).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${field} border ${border}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={preview.length === 0}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${button} disabled:opacity-50`}
            >
              Add Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
