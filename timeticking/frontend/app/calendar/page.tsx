'use client';

import CalendarContainer from '@/components/calendar/CalendarContainer';

export default function CalendarPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col gap-6 px-4 py-10">
      <CalendarContainer />
    </div>
  );
}
