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
}
