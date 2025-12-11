export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  color?: string;
  source?: 'local' | 'imported';
  location?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  uid?: string;
  rrule?: string;
  calendarId?: string;
  allDay?: boolean;
  subjectCode?: string | null;
}

export interface SessionTypes {
  lecture: boolean;
  exercise: boolean;
  lab: boolean;
  project: boolean;
  seminar: boolean;
  exam: boolean;
  other: boolean;
}

export interface Subject {
  id: string;
  courseCode: string;
  name: string;
  semester: 'S1' | 'S2' | '';
  credits?: number;
  confidence: number;
  sessionTypes: SessionTypes;
  events: string[];
  createdManually?: boolean;
}
