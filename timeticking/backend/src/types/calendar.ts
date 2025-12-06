export interface EventDTO {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  color?: string;
  source?: 'imported' | 'local';
  location?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
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

export interface SubjectDTO {
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
