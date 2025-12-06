'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePriorityTasks } from '@/components/tasks/TasksProvider';
import type { PriorityTask } from '@/components/tasks/types';

const priorityOptions = Array.from({ length: 10 }, (_, idx) => idx + 1);

export default function PlannerTasksPage() {
  const { tasks, addTask, updateTask, toggleComplete, deleteTask } = usePriorityTasks();
  const searchParams = useSearchParams();
  const highlightedTaskId = searchParams.get('taskId');

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priorityRank, setPriorityRank] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', dueDate: '', priorityRank: 1 });
  const [editError, setEditError] = useState<string | null>(null);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.priorityRank - b.priorityRank;
    });
  }, [tasks]);

  const todayStart = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const visibleTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      if (!task.isCompleted) return true;
      const due = new Date(task.dueDate);
      if (Number.isNaN(due.getTime())) return false;
      return due >= todayStart;
    });
  }, [sortedTasks, todayStart]);

  const stats = useMemo(() => calculateStats(tasks), [tasks]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !dueDate) {
      setError('Please provide both a title and due date.');
      return;
    }
    const result = addTask({
      title: title.trim(),
      dueDate,
      priorityRank,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setTitle('');
    setDueDate('');
    setPriorityRank(1);
    setSuccess('Task added successfully.');
  };

  const startEditing = (task: PriorityTask) => {
    if (task.isCompleted) return;
    setEditError(null);
    setEditingTaskId(task.id);
    setEditFields({
      title: task.title,
      dueDate: task.dueDate,
      priorityRank: task.priorityRank,
    });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditFields({ title: '', dueDate: '', priorityRank: 1 });
    setEditError(null);
  };

  const saveEditing = (taskId: string) => {
    if (!editFields.title.trim() || !editFields.dueDate) {
      setEditError('Please provide both a title and due date.');
      return;
    }
    const result = updateTask(taskId, {
      title: editFields.title.trim(),
      dueDate: editFields.dueDate,
      priorityRank: editFields.priorityRank,
    });
    if (!result.success) {
      setEditError(result.error);
      return;
    }
    cancelEditing();
  };

  const renderTaskCard = (task: PriorityTask) => {
    const dueDate = new Date(task.dueDate);
    const dueLabel = Number.isNaN(dueDate.getTime())
      ? 'Invalid date'
      : dueDate.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
    const isHighlighted = highlightedTaskId === task.id;
    const isEditing = editingTaskId === task.id;

    return (
      <div
        key={task.id}
        className={`rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--card-bg)]/70 p-4 shadow-[0_15px_35px_rgba(0,0,0,0.35)] transition ring-2 ${
          isHighlighted ? 'ring-cyan-400' : 'ring-transparent'
        }`}
        onClick={() => {
          if (!isEditing && !task.isCompleted) {
            startEditing(task);
          }
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Priority {task.priorityRank}</p>
            <h3 className="text-xl font-semibold">{task.title}</h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                toggleComplete(task.id);
              }}
            >
              {task.isCompleted ? 'Mark Active' : 'Complete'}
            </button>
            <button
              type="button"
              className="rounded-full border border-red-400/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-red-200 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
        {isEditing ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={editFields.title}
                onChange={(e) => setEditFields((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-2xl border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm text-[color:var(--fg)] focus:border-cyan-300 focus:outline-none"
              />
              <input
                type="date"
                value={editFields.dueDate}
                onChange={(e) => setEditFields((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="rounded-2xl border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm text-[color:var(--fg)] focus:border-cyan-300 focus:outline-none"
              />
              <select
                value={editFields.priorityRank}
                onChange={(e) => setEditFields((prev) => ({ ...prev, priorityRank: Number(e.target.value) }))}
                className="priority-select appearance-none rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] px-3 py-2 text-sm text-[color:var(--fg)] focus:border-cyan-300 focus:outline-none"
              >
                {priorityOptions.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full bg-cyan-500/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white hover:bg-cyan-500"
                onClick={(e) => {
                  e.stopPropagation();
                  saveEditing(task.id);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
              >
                Cancel
              </button>
            </div>
            {editError ? <p className="text-sm text-red-300">{editError}</p> : null}
          </div>
        ) : (
          <div className="mt-3 text-sm text-[color:var(--fg)]/70">
            <p>
              Due:{' '}
              <span className="font-semibold text-[color:var(--fg)]">{dueLabel}</span>{' '}
              {!task.isCompleted ? '(Active)' : '(Completed)'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--card-bg)]/70 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <h2 className="text-2xl font-semibold text-[color:var(--fg)]">Add Task</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm uppercase tracking-[0.2em] text-[color:var(--fg)]/70">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-base text-[color:var(--fg)] focus:border-cyan-300 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm uppercase tracking-[0.2em] text-[color:var(--fg)]/70">
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-2xl border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-base text-[color:var(--fg)] focus:border-cyan-300 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm uppercase tracking-[0.2em] text-[color:var(--fg)]/70">
            Priority Rank
            <select
              value={priorityRank}
              onChange={(e) => setPriorityRank(Number(e.target.value))}
              className="priority-select appearance-none rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] px-3 py-2 text-base text-[color:var(--fg)] focus:border-cyan-300 focus:outline-none"
            >
              {priorityOptions.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg hover:opacity-90"
            >
              Add Task
            </button>
          </div>
        </form>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
        <TaskStats {...stats} />
      </div>

      <div className="space-y-4">
        {visibleTasks.length ? (
          visibleTasks.map((task) => renderTaskCard(task))
        ) : (
          <p className="rounded-3xl border border-dashed border-[color:var(--border)]/40 px-4 py-6 text-center text-sm uppercase tracking-[0.4em] text-[color:var(--fg)]/50">
            No tasks yet. Add one using the form above.
          </p>
        )}
      </div>
    </div>
  );
}

function calculateStats(tasks: PriorityTask[]) {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 6);

  const inRange = (dateString?: string | null, start?: Date, end?: Date) => {
    if (!dateString) return false;
    const timestamp = new Date(dateString).getTime();
    if (Number.isNaN(timestamp)) return false;
    const date = new Date(timestamp);
    return (!start || date >= start) && (!end || date < end);
  };

  return {
    completedYesterday: tasks.filter(
      (task) => task.isCompleted && inRange(task.completedAt, startYesterday, startToday),
    ).length,
    completedToday: tasks.filter((task) => task.isCompleted && inRange(task.completedAt, startToday)).length,
    completedThisWeek: tasks.filter(
      (task) => task.isCompleted && inRange(task.completedAt, startWeek),
    ).length,
  };
}

function TaskStats({
  completedYesterday,
  completedToday,
  completedThisWeek,
}: {
  completedYesterday: number;
  completedToday: number;
  completedThisWeek: number;
}) {
  const stats = [
    { label: 'Completed Yesterday', value: completedYesterday },
    { label: 'Completed Today', value: completedToday },
    { label: 'Completed This Week', value: completedThisWeek },
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--bg)]/40 px-4 py-3 text-center"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--fg)]/60">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--fg)]">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
