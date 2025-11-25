import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import ical from 'node-ical';
import { EventDTO, SessionTypes } from '../types/calendar.js';
import {
  eventStore,
  subjectStore,
  createEmptySessionTypes,
  linkEventToSubject,
  unlinkEventFromSubject,
} from '../store/calendarStore.js';

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
    subjectCode: input.subjectCode || null,
  };
}

function extractSubjectCode(title: string): string | null {
  if (!title) return null;
  const trimmed = title.trimStart();
  if (trimmed.length < 6) return null;
  const code = trimmed.slice(0, 6);
  const normalized = code.replace(/\s+/g, '');
  if (!normalized.length) return null;
  return code.toUpperCase();
}

const SESSION_LABELS = [
  'LECTURE',
  'EXERCISE SESSION',
  'EXERCISE',
  'WORKSHOP',
  'LAB',
  'PROJECT',
  'SEMINAR',
  'EXAM',
];

function extractCourseName(title: string): string {
  const upper = title.toUpperCase();
  for (const label of SESSION_LABELS) {
    const markerIndex = upper.indexOf(label);
    if (markerIndex === -1) continue;
    const afterLabel = upper.slice(markerIndex + label.length);
    const colonMatch = afterLabel.match(/^\s*:/);
    if (!colonMatch) continue;
    const startIndex = markerIndex + label.length + colonMatch[0].length;
    const raw = title.slice(startIndex);
    const endIndex = raw.search(/[-,–]/);
    const name = (endIndex === -1 ? raw : raw.slice(0, endIndex)).trim();
    if (name.length) return name;
  }
  const fallbackAfterCode = title.slice(Math.min(6, title.length)).trim();
  if (fallbackAfterCode.length) {
    const cleaned = fallbackAfterCode.split(/[-,–]/)[0]?.trim();
    if (cleaned?.length) return cleaned;
  }
  const parts = title.split(' ');
  parts.shift();
  const fallback = parts.join(' ').trim();
  return fallback.length ? fallback : '(Unnamed Course)';
}

const SESSION_CHAR_MAP: Record<string, keyof SessionTypes> = {
  H: 'lecture',
  W: 'lecture',
  Z: 'exercise',
  P: 'lab',
  I: 'project',
  O: 'other',
  S: 'seminar',
  E: 'exam',
};

const SESSION_KEYWORDS: Record<Exclude<keyof SessionTypes, 'other'>, string[]> = {
  lecture: ['LECTURE', 'READING', 'HOORCOLLEGE'],
  exercise: ['EXERCISE', 'EXERCISES SESSION', 'EXERCISE SESSION', 'WERKCOLLEGE'],
  lab: ['LAB', 'WORKSHOP', 'PRACTICUM', 'PRACTICUMRUIMTE'],
  project: ['PROJECT'],
  seminar: ['SEMINAR'],
  exam: ['EXAM', 'EXAMEN', 'EXAMINATION'],
};

function detectSessionTypes(
  subjectCode: string | undefined,
  title: string,
  description?: string,
): SessionTypes {
  const detected = createEmptySessionTypes();
  const tokenChar = subjectCode?.[2]?.toUpperCase();
  const initialKey = tokenChar ? SESSION_CHAR_MAP[tokenChar] : undefined;
  let matched = false;
  if (initialKey && initialKey !== 'other') {
    detected[initialKey] = true;
    matched = true;
  }
  const text = `${title} ${description || ''}`.toUpperCase();
  (Object.entries(SESSION_KEYWORDS) as [Exclude<keyof SessionTypes, 'other'>, string[]][]).forEach(
    ([key, terms]) => {
      if (terms.some((keyword) => text.includes(keyword))) {
        detected[key] = true;
        matched = true;
      }
    },
  );
  if (!matched) detected.other = true;
  return detected;
}

function assignSubjectMetadata(event: EventDTO, title: string, description?: string) {
  const subjectCode = extractSubjectCode(title);
  if (!subjectCode) return;
  event.subjectCode = subjectCode;
  const sessionTypes = detectSessionTypes(subjectCode, title, description);
  const nameHint = extractCourseName(title);
  linkEventToSubject(event, { sessionTypes, nameHint });
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
    const event: EventDTO = {
      id: uuid(),
      title: row.title || 'Untitled',
      description: row.description,
      start: new Date(`${row.date}T${row['start time'] || row.start || '00:00'}`).toISOString(),
      end: new Date(`${row.date}T${row['end time'] || row.end || row['start time'] || '00:30'}`).toISOString(),
      color: row.color || undefined,
      source: 'imported',
    };
    assignSubjectMetadata(event, event.title, event.description);
    return event;
  });
}

function parseIcsText(text: string): EventDTO[] {
  const events: EventDTO[] = [];
  const data = ical.sync.parseICS(text);
  Object.values(data).forEach((item) => {
    if (item.type === 'VEVENT') {
      const ruleText = item.rrule?.toString?.();
      const summary = item.summary || 'Untitled';
      const base: EventDTO = {
        id: uuid(),
        title: summary,
        description: item.description,
        location: item.location,
        start: item.start?.toISOString?.() || new Date().toISOString(),
        end: item.end?.toISOString?.() || new Date().toISOString(),
        source: 'imported',
        rrule: ruleText,
        uid: (item as any).uid,
      };
      assignSubjectMetadata(base, summary, item.description);

      if (item.rrule) {
        const now = new Date();
        const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90);
        const dates = item.rrule.between(now, limit, true);
        dates.forEach((dt) => {
          const dur = item.end && item.start ? item.end.getTime() - item.start.getTime() : 30 * 60 * 1000;
          const expanded: EventDTO = {
            ...base,
            id: uuid(),
            start: dt.toISOString(),
            end: new Date(dt.getTime() + dur).toISOString(),
          };
          assignSubjectMetadata(expanded, summary, item.description);
          events.push(expanded);
        });
      } else {
        events.push(base);
      }
    }
  });
  return events;
}

function syncSubjectLinks(event: EventDTO, previousSubjectCode?: string | null) {
  if (previousSubjectCode && previousSubjectCode !== event.subjectCode) {
    unlinkEventFromSubject(event.id, previousSubjectCode);
  }
  if (event.subjectCode) {
    linkEventToSubject(event, { nameHint: event.title });
  }
}

export function listEvents(_req: Request, res: Response) {
  return res.json({ events: eventStore, subjects: subjectStore });
}

export async function parseCsvImport(req: Request, res: Response) {
  const { content } = req.body as { content?: string };
  if (!content) return res.status(400).json({ message: 'No CSV content provided' });
  const events = parseCsv(content);
  events.forEach((ev) => {
    eventStore.push(ev);
    syncSubjectLinks(ev);
  });
  return res.json({ events, subjects: subjectStore });
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
    events.forEach((ev) => {
      eventStore.push(ev);
      syncSubjectLinks(ev);
    });
    return res.json({ events, subjects: subjectStore });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to parse ICS', error: (e as Error).message });
  }
}

export async function addEvent(req: Request, res: Response) {
  const event = req.body as EventDTO;
  if (!event.title || !event.start || !event.end) return res.status(400).json({ message: 'Missing fields' });
  const saved = normalizeEvent(event);
  eventStore.push(saved);
  syncSubjectLinks(saved);
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
  const previous = existingIndex >= 0 ? eventStore[existingIndex] : undefined;
  const updated = normalizeEvent({ ...event, id });
  if (existingIndex >= 0) {
    eventStore[existingIndex] = updated;
  } else {
    eventStore.push(updated);
  }
  syncSubjectLinks(updated, previous?.subjectCode || null);
  return res.json({ event: updated });
}

export async function deleteEvent(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Missing id' });
  const index = eventStore.findIndex((e) => e.id === id);
  if (index >= 0) {
    const [removed] = eventStore.splice(index, 1);
    if (removed?.subjectCode) {
      unlinkEventFromSubject(removed.id, removed.subjectCode);
    }
  }
  return res.json({ id });
}
