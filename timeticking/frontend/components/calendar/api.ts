import { CalendarEvent, Subject } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Request failed');
  }
  return res.json();
}

export type EventsResponse = {
  events: CalendarEvent[];
  subjects: Subject[];
};

export async function fetchEvents(): Promise<EventsResponse> {
  const data = await request('/api/calendar/events');
  return {
    events: (data.events || []) as CalendarEvent[],
    subjects: (data.subjects || []) as Subject[],
  };
}

export async function addEventApi(event: CalendarEvent): Promise<CalendarEvent> {
  const data = await request('/api/calendar/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return data.event as CalendarEvent;
}

export async function updateEventApi(event: CalendarEvent): Promise<CalendarEvent> {
  const data = await request(`/api/calendar/events/${event.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return (data.event as CalendarEvent) || event;
}

export async function deleteEventApi(id: string): Promise<void> {
  await request(`/api/calendar/events/${id}`, { method: 'DELETE' });
}

export async function importCalendar(type: 'ics' | 'csv', payload: { content?: string; url?: string }) {
  const data = await request(`/api/calendar/import/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    events: (data.events || []) as CalendarEvent[],
    subjects: (data.subjects || []) as Subject[],
  };
}

export async function fetchSubjects(): Promise<Subject[]> {
  const data = await request('/api/subjects');
  return (data.subjects || []) as Subject[];
}

export async function createSubjectApi(subject: Partial<Subject>): Promise<Subject> {
  const data = await request('/api/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subject),
  });
  return data.subject as Subject;
}

export async function updateSubjectApi(subject: Subject): Promise<Subject> {
  const data = await request(`/api/subjects/${subject.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subject),
  });
  return data.subject as Subject;
}

export async function deleteSubjectApi(id: string): Promise<void> {
  await request(`/api/subjects/${id}`, { method: 'DELETE' });
}

export type SubjectSort = 'alphabetical' | 'credits' | 'confidence';
