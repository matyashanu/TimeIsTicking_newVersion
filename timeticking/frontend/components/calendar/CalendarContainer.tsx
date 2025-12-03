'use client';

import { addDays } from 'date-fns';
import { useEffect, useState } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarDayView from './CalendarDayView';
import CalendarImportModal from './CalendarImportModal';
import { CalendarEvent, CalendarView } from './types';
import EventModal from './EventModal';
import { addEventApi, deleteEventApi, fetchEvents, updateEventApi } from './api';

const initialEvents: CalendarEvent[] = [];
let lastView: CalendarView = 'month';

type RecurrenceScope = 'one' | 'future' | 'all';

function generateRecurringEvents(base: CalendarEvent): CalendarEvent[] {
  const repeat = base.repeat || 'none';
  if (repeat === 'none') return [base];

  const start = new Date(base.start);
  const end = new Date(base.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [base];

  const durationMs = end.getTime() - start.getTime();
  const maxOccurrences = 60;
  const limit = new Date(start);
  limit.setMonth(limit.getMonth() + 6);

  const uid = base.uid || crypto.randomUUID();
  const events: CalendarEvent[] = [];
  let currentStart = new Date(start);
  let count = 0;

  while (count < maxOccurrences && currentStart <= limit) {
    const currentEnd = new Date(currentStart.getTime() + durationMs);
    events.push({
      ...base,
      id: count === 0 ? base.id : crypto.randomUUID(),
      uid,
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
    });

    count += 1;
    if (repeat === 'daily') {
      currentStart.setDate(currentStart.getDate() + 1);
    } else if (repeat === 'weekly') {
      currentStart.setDate(currentStart.getDate() + 7);
    } else if (repeat === 'monthly') {
      currentStart.setMonth(currentStart.getMonth() + 1);
    } else if (repeat === 'yearly') {
      currentStart.setFullYear(currentStart.getFullYear() + 1);
    } else {
      break;
    }
  }

  return events;
}

function getSeriesKey(ev: CalendarEvent): string | null {
  if (ev.uid) return ev.uid;
  if (ev.rrule) return ev.rrule;
  return null;
}

function askRecurrenceScope(kind: 'edit' | 'delete'): RecurrenceScope | null {
  const action = kind === 'edit' ? 'Edit' : 'Delete';
  const input = window.prompt(
    `${action} which events?\n` +
      `Type one of: "one", "future", "all"\n\n` +
      `"one"    → only this event\n` +
      `"future" → this and all future events in the series\n` +
      `"all"    → every instance in the series`,
    'one',
  );
  if (input == null) return null;
  const normalized = input.trim().toLowerCase();
  if (normalized === 'one' || normalized === 'future' || normalized === 'all') {
    return normalized;
  }
  return null;
}

export default function CalendarContainer() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setViewState] = useState<CalendarView>(() => lastView);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = useState<boolean>(false);
  const [importOpen, setImportOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then(({ events: fetchedEvents }) => {
        setEvents(fetchedEvents.length ? fetchedEvents : initialEvents);
      })
      .catch(() => {
        setEvents((prev) =>
          prev.length
            ? prev
            : [
                {
                  id: 'sample-1',
                  title: 'Sample Meeting',
                  start: new Date().toISOString(),
                  end: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
                  source: 'local',
                },
              ],
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const setView = (next: CalendarView | ((prev: CalendarView) => CalendarView)) => {
    setViewState((prev) => {
      const resolved = typeof next === 'function' ? (next as (prev: CalendarView) => CalendarView)(prev) : next;
      lastView = resolved;
      return resolved;
    });
  };

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const onImportComplete = (newEvents: CalendarEvent[]) => {
    setEvents((prev) => [...prev, ...newEvents]);
  };

  const openAddModal = (start: Date, end?: Date) => {
    const endDate = end || new Date(start.getTime() + 30 * 60 * 1000);
    setSelectedRange({ start, end: endDate });
    setEditingEvent(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setSelectedRange({ start: new Date(ev.start), end: new Date(ev.end) });
    setModalMode('edit');
    setModalOpen(true);
  };

  const saveEvent = (ev: CalendarEvent) => {
    const isExisting = events.some((e) => e.id === ev.id);

    if (!isExisting) {
      const seriesEvents = generateRecurringEvents(ev);
      Promise.all(seriesEvents.map((item) => addEventApi(item)))
        .then((savedEvents) => {
          setEvents((prev) => [...prev, ...savedEvents]);
        })
        .finally(() => setModalOpen(false));
      return;
    }

    const current = events.find((e) => e.id === ev.id);
    if (!current) {
      updateEventApi(ev)
        .then((saved) => {
          setEvents((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        })
        .finally(() => setModalOpen(false));
      return;
    }

    const seriesKey = getSeriesKey(current);
    const seriesEvents = seriesKey
      ? events
          .filter((e) => (getSeriesKey(e) || '') === seriesKey)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      : [];

    let scope: RecurrenceScope = 'one';
    if (seriesEvents.length > 1 && current.repeat && current.repeat !== 'none') {
      const choice = askRecurrenceScope('edit');
      if (!choice) return;
      scope = choice;
    }

    if (scope === 'one' || seriesEvents.length <= 1) {
      updateEventApi(ev)
        .then((saved) => {
          setEvents((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        })
        .finally(() => setModalOpen(false));
      return;
    }

    const baseStart = new Date(current.start).getTime();
    const baseEnd = new Date(current.end).getTime();
    const nextStart = new Date(ev.start).getTime();
    const nextEnd = new Date(ev.end).getTime();
    const deltaStart = nextStart - baseStart;
    const deltaEnd = nextEnd - baseEnd;

    const targets =
      scope === 'all'
        ? seriesEvents
        : seriesEvents.filter((item) => new Date(item.start).getTime() >= baseStart);

    const updatedEvents = targets.map((item) => {
      const itemStart = new Date(item.start).getTime();
      const itemEnd = new Date(item.end).getTime();
      const updatedStart = new Date(itemStart + deltaStart).toISOString();
      const updatedEnd = new Date(itemEnd + deltaEnd).toISOString();
      return {
        ...item,
        title: ev.title,
        description: ev.description,
        color: ev.color,
        start: updatedStart,
        end: updatedEnd,
      };
    });

    Promise.all(updatedEvents.map((item) => updateEventApi(item)))
      .then((savedList) => {
        setEvents((prev) => {
          const map = new Map(savedList.map((s) => [s.id, s]));
          return prev.map((item) => map.get(item.id) || item);
        });
      })
      .finally(() => setModalOpen(false));
  };

  const updateEventTimes = (id: string, start: Date, end: Date) => {
    let nextEvent: CalendarEvent | undefined;
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === id) {
          nextEvent = { ...ev, start: start.toISOString(), end: end.toISOString() };
          return nextEvent;
        }
        return ev;
      }),
    );
    if (nextEvent) {
      updateEventApi(nextEvent);
    }
  };

  const deleteEvent = (id: string) => {
    const current = events.find((e) => e.id === id);
    if (!current) {
      deleteEventApi(id)
        .then(() => {
          setEvents((prev) => prev.filter((e) => e.id !== id));
        })
        .finally(() => setModalOpen(false));
      return;
    }

    const seriesKey = getSeriesKey(current);
    const seriesEvents = seriesKey
      ? events
          .filter((e) => (getSeriesKey(e) || '') === seriesKey)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      : [];

    let scope: RecurrenceScope = 'one';
    if (seriesEvents.length > 1 && current.repeat && current.repeat !== 'none') {
      const choice = askRecurrenceScope('delete');
      if (!choice) return;
      scope = choice;
    }

    if (scope === 'one' || seriesEvents.length <= 1) {
      deleteEventApi(id)
        .then(() => {
          setEvents((prev) => prev.filter((e) => e.id !== id));
        })
        .finally(() => setModalOpen(false));
      return;
    }

    const baseStart = new Date(current.start).getTime();
    const targets =
      scope === 'all'
        ? seriesEvents
        : seriesEvents.filter((item) => new Date(item.start).getTime() >= baseStart);
    const idsToDelete = targets.map((item) => item.id);

    Promise.all(idsToDelete.map((eventId) => deleteEventApi(eventId)))
      .then(() => {
        setEvents((prev) => prev.filter((e) => !idsToDelete.includes(e.id)));
      })
      .finally(() => setModalOpen(false));
  };

  return (
    <div className="flex flex-col gap-6 text-[color:var(--fg)]">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={setView}
        onImport={() => setImportOpen(true)}
      />
      {view === 'day' ? (
        <CalendarDayView
          currentDate={currentDate}
          events={events}
          busy={loading}
          onCreateRange={openAddModal}
          onEventClick={openEditModal}
          onEventChange={updateEventTimes}
        />
      ) : null}
      {view === 'week' ? (
        <CalendarWeekView
          currentDate={currentDate}
          events={events}
          busy={loading}
          onCreateRange={openAddModal}
          onEventClick={openEditModal}
          onEventChange={updateEventTimes}
          onSelectDate={(d) => {
            setCurrentDate(d);
            setView('day');
          }}
        />
      ) : null}
      {view === 'month' ? (
        <CalendarMonthView
          currentDate={currentDate}
          events={events}
          onSelectDate={(d) => {
            setCurrentDate(d);
            setView('day');
          }}
        />
      ) : null}
      <CalendarImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={onImportComplete}
      />
      <EventModal
        open={modalOpen}
        mode={modalMode}
        initialDate={selectedRange?.start}
        initialEndDate={selectedRange?.end}
        event={editingEvent}
        onClose={() => setModalOpen(false)}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
