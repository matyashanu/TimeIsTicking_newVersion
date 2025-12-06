'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const button = 'bg-[color:var(--fg)] text-[color:var(--bg)] hover:opacity-90';

  const handleFile = async (file: File, type: 'csv' | 'ics') => {
    const textContent = await file.text();
    await sendForParse(type, textContent);
  };

  const sendForParse = async (type: 'csv' | 'ics', content?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { events } = await importCalendar(type, { content, url: type === 'ics' ? icsUrl : undefined });
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

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSingleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'ics';
    handleFile(file, ext as 'csv' | 'ics');
    e.target.value = '';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] p-6 text-[color:var(--fg)] shadow-[0_35px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-4 text-lg font-bold">Import Calendar</div>
        <div className="flex flex-col gap-4">
          <p className="text-sm opacity-80">Upload your iCal (.ics) file or paste an iCal URL.</p>
          <label className="text-sm font-semibold">iCal URL</label>
          <div className="flex gap-2">
            <input
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              placeholder="https://example.com/calendar.ics"
              className="flex-1 rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/30 px-3 py-2 text-sm text-[color:var(--fg)] outline-none placeholder:opacity-60"
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
              ref={fileInputRef}
              type="file"
              accept=".ics,.csv"
              onChange={handleSingleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleFileButtonClick}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${button}`}
              disabled={loading}
            >
              Upload iCal (.ics)
            </button>
          </div>

          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          {loading ? <div className="text-sm opacity-80">Parsing...</div> : null}

          {preview.length > 0 ? (
            <div className="max-h-48 overflow-auto rounded-lg border border-[color:var(--border)]/20">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[color:var(--bg)]/30">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Start</th>
                    <th className="px-3 py-2">End</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((ev) => (
                    <tr key={ev.id} className="border-t border-[color:var(--border)]/15">
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
              className="rounded-lg border border-[color:var(--border)]/40 bg-transparent px-4 py-2 text-sm font-semibold text-[color:var(--fg)]"
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
