'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalogClock from '@/components/AnalogClock';
import FlipClockWidget from '@/components/FlipClockWidget';
import useClock from '@/lib/useClock';
import { useAuth } from '@/components/AuthProvider';
import { fetchGoals } from '@/components/planner/goalsApi';
import { fetchEvents } from '@/components/calendar/api';
import type { PlannerGoal } from '@/components/planner/types';
import type { CalendarEvent } from '@/components/calendar/types';
import type { PriorityTask } from '@/components/tasks/types';
import { usePriorityTasks } from '@/components/tasks/TasksProvider';

export default function HomePage() {
  const { formattedDate } = useClock();
  const { user } = useAuth();
  const username = user?.username || 'there';
  const router = useRouter();
  const { nextTask } = usePriorityTasks();
  const [clockMode, setClockMode] = useState<'digital' | 'analog'>('digital');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<PlannerGoal[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        const [{ events: eventData }, goalData] = await Promise.all([fetchEvents(), fetchGoals()]);
        if (!cancelled) {
          setEvents(eventData);
          setGoals(goalData);
          setDashboardError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboardError((err as Error).message || 'Unable to load dashboard data.');
        }
      } finally {
        // no-op
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextEvent = useMemo(() => getNextUpcomingEvent(events), [events]);
  const nextGoal = useMemo(() => getNextUpcomingGoal(goals), [goals]);

  const navCards: Array<{
    title: string;
    headline: string;
    subline: string;
    onClick: () => void;
  }> = [
    {
      title: 'Next Task',
      headline: nextTask?.title || 'No upcoming tasks',
      subline: nextTask ? formatTaskDue(nextTask) : 'Plan a task to see it here.',
      onClick: () => router.push('/planner/tasks'),
    },
    {
      title: 'Next Event',
      headline: nextEvent?.title || 'No upcoming events',
      subline: nextEvent ? formatEventWindow(nextEvent) : 'Create an event to keep things moving.',
      onClick: () => router.push('/planner/calendar'),
    },
    {
      title: 'Next Goal',
      headline: nextGoal?.title || 'No goals on deck',
      subline: nextGoal ? formatGoalDeadline(nextGoal) : 'Set a goal to stay aligned.',
      onClick: () => router.push('/planner/goals'),
    },
  ];

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-12 px-4 text-center -mt-10 lg:-mt-16">
      <div className="mt-2 text-center text-[color:var(--fg)]">
        <div className="text-2xl sm:text-3xl font-semibold tracking-[0.2em] uppercase">{`Hello ${username}`}</div>
        <p className="mt-2 text-sm font-medium tracking-[0.3em] opacity-70">{formattedDate}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-[color:var(--border)]/30 bg-[color:var(--card-bg)]/60 px-3 py-1 text-xs uppercase tracking-[0.3em]">
          <span>Clock View</span>
          <div className="flex overflow-hidden rounded-full border border-[color:var(--border)]/30">
            {(['digital', 'analog'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`px-4 py-1 text-[color:var(--fg)] transition ${
                  clockMode === mode ? 'bg-cyan-400/80 text-white' : 'bg-transparent'
                }`}
                onClick={() => setClockMode(mode)}
              >
                {mode === 'digital' ? 'Digital' : 'Analog'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {clockMode === 'digital' ? <FlipClockWidget /> : <AnalogClock />}

      <div className="w-full max-w-4xl px-2 sm:px-6">
        {dashboardError ? (
          <p className="mb-3 text-sm text-red-300">{dashboardError}</p>
        ) : null}
        <div className="flex flex-col gap-6">
          {navCards.map((card) => (
            <DashboardNavCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function getNextUpcomingEvent(events: CalendarEvent[]): CalendarEvent | undefined {
  const now = Date.now();
  return [...events]
    .filter((event) => {
      const endMs = parseTime(event.end);
      return endMs != null && endMs > now;
    })
    .sort((a, b) => {
      const aTime = parseTime(a.start) ?? parseTime(a.end) ?? Number.POSITIVE_INFINITY;
      const bTime = parseTime(b.start) ?? parseTime(b.end) ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    })[0];
}

function getNextUpcomingGoal(goals: PlannerGoal[]): PlannerGoal | undefined {
  const now = Date.now();
  return [...goals]
    .filter((goal) => {
      const deadline = parseTime(goal.deadline);
      return deadline != null && deadline > now;
    })
    .sort((a, b) => {
      const aTime = parseTime(a.deadline) ?? Number.POSITIVE_INFINITY;
      const bTime = parseTime(b.deadline) ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    })[0];
}

function parseTime(value?: string): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function DashboardNavCard({
  title,
  headline,
  subline,
  onClick,
}: {
  title: string;
  headline: string;
  subline: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--card-bg)]/80 p-5 text-left shadow-[0_20px_55px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-cyan-300/60"
    >
      <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300">{title}</p>
      <h3 className="mt-3 text-xl font-semibold text-[color:var(--fg)]">{headline}</h3>
      <p className="mt-2 text-sm text-[color:var(--fg)]/70">{subline}</p>
    </button>
  );
}

function formatTaskDue(task: PriorityTask): string {
  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return 'Due date unavailable';
  return dueDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventWindow(event: CalendarEvent): string {
  const start = event.start ? new Date(event.start) : null;
  const end = new Date(event.end);
  if (Number.isNaN(end.getTime())) return 'No schedule available';

  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
  if (start && !Number.isNaN(start.getTime())) {
    const sameDay = start.toDateString() === end.toDateString();
    const dateLabel = sameDay
      ? dateFormatter.format(end)
      : `${dateFormatter.format(start)} → ${dateFormatter.format(end)}`;
    return `${dateLabel} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
  }
  return `${dateFormatter.format(end)} · ends at ${timeFormatter.format(end)}`;
}

function formatGoalDeadline(goal: PlannerGoal): string {
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) return 'No deadline set';
  return `Due ${deadline.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} at ${deadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}
