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
  normalizeCourseCode,
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

interface ParsedSubjectInfo {
  courseCode: string | null;
  sessionChar: string | null;
  name: string | null;
}

function parseSubjectInfoFromSummary(summary?: string): ParsedSubjectInfo {
  if (!summary) {
    return { courseCode: null, sessionChar: null, name: null };
  }
  const trimmed = summary.trimStart();
  if (trimmed.length < 6) {
    return { courseCode: null, sessionChar: null, name: null };
  }

  const prefix = trimmed.slice(0, 6);
  const sessionChar = prefix[2] || null;
  const rawCourseCode = prefix.slice(0, 2) + prefix.slice(3, 6);
  const rawCourseCode = prefix.slice(0, 2) + prefix.slice(3, 6); // drop 3rd char
  const normalizedCourseCode = normalizeCourseCode(rawCourseCode);
  const rest = trimmed.slice(6).trimStart();

  let name: string | null = null;
  if (rest.length) {
    const colonIndex = rest.indexOf(':');
    const base = colonIndex === -1 ? rest : rest.slice(0, colonIndex);
    name = base.trim() || null;
  }

  return {
    courseCode: normalizedCourseCode || null,
    sessionChar,
    name,
  };
}

function detectSessionTypesFromChar(sessionChar: string | null): SessionTypes {
  const detected = createEmptySessionTypes();
  const code = sessionChar ? sessionChar.toUpperCase() : '';
  if (code === 'H') detected.lecture = true;
  else if (code === 'W') detected.exercise = true;
  else if (code === 'P') detected.lab = true;
  else if (code === 'I') detected.project = true;
  else if (code) detected.other = true;
  else detected.other = true;
  return detected;
}

function assignSubjectMetadata(event: EventDTO, summary: string, _description?: string, _uid?: string) {
  const { courseCode, sessionChar, name } = parseSubjectInfoFromSummary(summary);
  if (!courseCode) return;
  event.subjectCode = courseCode;
  const sessionTypes = detectSessionTypesFromChar(sessionChar);
  const nameHint = name || '(Unnamed Course)';
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
      const uid = (item as any).uid as string | undefined;
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
        uid,
      };
      assignSubjectMetadata(base, summary, item.description, uid);

      if (item.rrule) {
        const seriesUid = uid || uuid();
        const dtStart = item.start instanceof Date ? item.start : new Date();
        const limit = new Date(dtStart.getFullYear(), dtStart.getMonth(), dtStart.getDate() + 90);
        const dates = item.rrule.between(dtStart, limit, true);
        dates.forEach((dt) => {
          const dur = item.end && item.start ? item.end.getTime() - item.start.getTime() : 30 * 60 * 1000;
          const expanded: EventDTO = {
            ...base,
            id: uuid(),
            start: dt.toISOString(),
            end: new Date(dt.getTime() + dur).toISOString(),
            uid: seriesUid,
          };
          assignSubjectMetadata(expanded, summary, item.description, uid);
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

export function getEventsForUser(userId?: string) {
  if (!userId) return [];
  // try matching calendarId or calendar owner
  return eventStore.filter((e) => e.calendarId === userId || (e as any).owner === userId);
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
    const added: EventDTO[] = [];
    events.forEach((ev) => {
      const exists = eventStore.some(
        (existing) => existing.uid && ev.uid && existing.uid === ev.uid && existing.start === ev.start,
      );
      if (!exists) {
        eventStore.push(ev);
        syncSubjectLinks(ev);
        added.push(ev);
      }
    });
    return res.json({ events: added, subjects: subjectStore });
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
