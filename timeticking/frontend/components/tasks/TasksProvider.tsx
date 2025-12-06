'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { CreateTaskInput, PriorityTask } from './types';

const STORAGE_KEY = 'priorityTasks';
interface TasksContextValue {
  tasks: PriorityTask[];
  nextTask: PriorityTask | null;
  addTask: (input: CreateTaskInput) => { success: true } | { success: false; error: string };
  updateTask: (taskId: string, updates: Partial<Omit<PriorityTask, 'id'>>) =>
    | { success: true }
    | { success: false; error: string };
  toggleComplete: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

function normalizeDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function sortByPriority(a: PriorityTask, b: PriorityTask) {
  if (a.priorityRank !== b.priorityRank) {
    return a.priorityRank - b.priorityRank;
  }
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<PriorityTask[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PriorityTask[];
        setTasks(parsed);
      }
    } catch {
      // ignore corrupted payloads
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const hasPriorityConflict = useCallback(
    (dateKey: string, rank: number, excludeId?: string) =>
      tasks.some(
        (task) =>
          task.id !== excludeId &&
          !task.isCompleted &&
          task.dueDate === dateKey &&
          task.priorityRank === rank,
      ),
    [tasks],
  );

  const addTask = useCallback(
    (input: CreateTaskInput) => {
      const { title, dueDate, priorityRank } = input;
      const dateKey = normalizeDate(dueDate);
      if (!dateKey) {
        return { success: false, error: 'Please provide a valid due date.' };
      }
      if (hasPriorityConflict(dateKey, priorityRank)) {
        return { success: false, error: `Priority ${priorityRank} is already occupied for this date.` };
      }
      const newTask: PriorityTask = {
        id: uuid(),
        title: title.trim(),
        dueDate: dateKey,
        priorityRank,
        isCompleted: false,
        completedAt: null,
      };
      setTasks((prev) => [...prev, newTask]);
      return { success: true } as const;
    },
    [hasPriorityConflict],
  );

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Omit<PriorityTask, 'id'>>) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, error: 'Task not found.' };
      }
      const nextTitle = updates.title?.trim() ?? task.title;
      const nextDue = updates.dueDate ? normalizeDate(updates.dueDate) : task.dueDate;
      if (!nextDue) return { success: false, error: 'Please provide a valid due date.' };
      const nextPriority = updates.priorityRank ?? task.priorityRank;
      if (hasPriorityConflict(nextDue, nextPriority, taskId)) {
        return { success: false, error: `Priority ${nextPriority} is already occupied for this date.` };
      }
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                ...updates,
                title: nextTitle,
                dueDate: nextDue,
                priorityRank: nextPriority,
              }
            : item,
        ),
      );
      return { success: true } as const;
    },
    [hasPriorityConflict, tasks],
  );

  const toggleComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isCompleted: !task.isCompleted,
              completedAt: !task.isCompleted ? new Date().toISOString() : null,
            }
          : task,
      ),
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const nextTask = useMemo(() => {
    const upcoming = tasks.filter((task) => !task.isCompleted);
    if (!upcoming.length) return null;
    return [...upcoming].sort((a, b) => {
      const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return a.priorityRank - b.priorityRank;
    })[0];
  }, [tasks]);

  const value: TasksContextValue = {
    tasks,
    nextTask,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function usePriorityTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('usePriorityTasks must be used within TasksProvider');
  }
  return ctx;
}
