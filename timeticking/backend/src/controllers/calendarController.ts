import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import ical from 'node-ical';

interface EventDTO {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  color?: string;
  source?: 'imported' | 'local';
  location?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  uid?: string;
  rrule?: string;
  calendarId?: string;
  allDay?: boolean;
}

const eventStore: EventDTO[] = [];

function ensureIsoString(value: string | Date | undefined): string {
  if (!value) return new Date().toISOString();
  return typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();
}

function normalizeEvent(input: Partial<EventDTO>): EventDTO {
  const startIso = ensureIsoString(input.start);
  const endIso = ensureIsoString(input.end || input.start);
  return {
    id: input.id || uuid(),
    title: input.title || 'Untitled',
    description: input.description,
    start: startIso,
    end: endIso,
    color: input.color,
    source: input.source || 'local',
    location: input.location,
    repeat: input.repeat || 'none',
    uid: input.uid,
    rrule: input.rrule,
    calendarId: input.calendarId,
    allDay: input.allDay,
  };
}

function parseCsv(content: string): EventDTO[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });
    return {
      id: uuid(),
      title: row.title || 'Untitled',
      description: row.description,
      start: new Date(`${row.date}T${row['start time'] || row.start || '00:00'}`).toISOString(),
      end: new Date(`${row.date}T${row['end time'] || row.end || row['start time'] || '00:30'}`).toISOString(),
      color: row.color || undefined,
      source: 'imported',
    } satisfies EventDTO;
  });
}

function parseIcsText(text: string): EventDTO[] {
  const events: EventDTO[] = [];
  const data = ical.sync.parseICS(text);
  Object.values(data).forEach((item) => {
    if (item.type === 'VEVENT') {
      const ruleText = item.rrule?.toString?.();
      const base: EventDTO = {
        id: uuid(),
        title: item.summary || 'Untitled',
        description: item.description,
        location: item.location,
        start: item.start?.toISOString?.() || new Date().toISOString(),
        end: item.end?.toISOString?.() || new Date().toISOString(),
        source: 'imported',
        rrule: ruleText,
        uid: (item as any).uid,
      };

      if (item.rrule) {
        const now = new Date();
        const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90);
        const dates = item.rrule.between(now, limit, true);
        dates.forEach((dt) => {
          const dur = item.end && item.start ? item.end.getTime() - item.start.getTime() : 30 * 60 * 1000;
          events.push({
            ...base,
            id: uuid(),
            start: dt.toISOString(),
            end: new Date(dt.getTime() + dur).toISOString(),
          });
        });
      } else {
        events.push(base);
      }
    }
  });
  return events;
}

export function listEvents(_req: Request, res: Response) {
  return res.json({ events: eventStore });
}

export function getEventsForUser(userId?: string) {
  if (!userId) return [];
  // try matching calendarId or calendar owner
  return eventStore.filter((e) => e.calendarId === userId || (e as any).owner === userId);
}

export async function parseCsvImport(req: Request, res: Response) {
  const { content } = req.body as { content?: string };
  if (!content) return res.status(400).json({ message: 'No CSV content provided' });
  const events = parseCsv(content);
  events.forEach((ev) => eventStore.push(ev));
  return res.json({ events });
}

export async function parseIcsImport(req: Request, res: Response) {
  const { content, url } = req.body as { content?: string; url?: string };
  let icsText = content || '';
  try {
    if (!icsText && url) {
      const response = await fetch(url);
      icsText = await response.text();
    }
    if (!icsText) return res.status(400).json({ message: 'No ICS content provided' });
    const events = parseIcsText(icsText);
    events.forEach((ev) => eventStore.push(ev));
    return res.json({ events });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to parse ICS', error: (e as Error).message });
  }
}

export async function addEvent(req: Request, res: Response) {
  const event = req.body as EventDTO;
  if (!event.title || !event.start || !event.end) return res.status(400).json({ message: 'Missing fields' });
  const saved = normalizeEvent(event);
  eventStore.push(saved);
  return res.json({ event: saved });
}

export async function editEvent(req: Request, res: Response) {
  const event = req.body as EventDTO;
  if (!event.id) return res.status(400).json({ message: 'Missing id' });
  return updateEvent(req, res);
}

export async function updateEvent(req: Request, res: Response) {
  const id = req.params.id;
  const event = req.body as EventDTO;
  if (!id) return res.status(400).json({ message: 'Missing id' });
  const existingIndex = eventStore.findIndex((e) => e.id === id);
  const updated = normalizeEvent({ ...event, id });
  if (existingIndex >= 0) {
    eventStore[existingIndex] = updated;
  } else {
    eventStore.push(updated);
  }
  return res.json({ event: updated });
}

export async function deleteEvent(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Missing id' });
  const index = eventStore.findIndex((e) => e.id === id);
  if (index >= 0) {
    eventStore.splice(index, 1);
  }
  return res.json({ id });
}
