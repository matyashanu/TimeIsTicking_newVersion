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

export default function CalendarContainer() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('month');
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
      .then((data) => {
        setEvents(data.length ? data : initialEvents);
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
    const persist = isExisting ? updateEventApi(ev) : addEventApi(ev);
    persist
      .then((saved) => {
        setEvents((prev) => {
          const exists = prev.find((e) => e.id === saved.id);
          if (exists) {
            return prev.map((p) => (p.id === saved.id ? saved : p));
          }
          return [...prev, saved];
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
    deleteEventApi(id)
      .then(() => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      })
      .finally(() => setModalOpen(false));
  };

  return (
    <div className="flex flex-col gap-6">
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
