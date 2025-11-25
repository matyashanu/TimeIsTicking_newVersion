'use client';

import { useEffect, useMemo, useState } from 'react';
import { createGoal, deleteGoal, fetchGoals, updateGoal } from '@/components/planner/goalsApi';
import type { PlannerGoal } from '@/components/planner/types';

export default function PlannerGoalsPage() {
  const [goals, setGoals] = useState<PlannerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [activeGoal, setActiveGoal] = useState<PlannerGoal | null>(null);
  const [formState, setFormState] = useState({
    title: '',
    deadline: new Date().toISOString().slice(0, 10),
    description: '',
    motivation: '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadGoals = async () => {
      try {
        const data = await fetchGoals();
        if (!mounted) return;
        setGoals(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadGoals();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setFormState({
      title: '',
      deadline: new Date().toISOString().slice(0, 10),
      description: '',
      motivation: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setActiveGoal(null);
    setModalMode('add');
  };

  const openEditModal = (goal: PlannerGoal) => {
    setActiveGoal(goal);
    setFormState({
      title: goal.title,
      deadline: goal.deadline.slice(0, 10),
      description: goal.description || '',
      motivation: goal.motivation || '',
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveGoal(null);
    resetForm();
  };

  const isFormValid = useMemo(
    () => formState.title.trim().length > 0 && formState.deadline.trim().length > 0,
    [formState.title, formState.deadline],
  );

  const performUpdate = async (goal: PlannerGoal) => {
    setSaving(true);
    try {
      const updated = await updateGoal(goal);
      setGoals((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      closeModal();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError('Title and deadline are required.');
      return;
    }
    const isoDeadline = new Date(formState.deadline).toISOString();
    if (modalMode === 'add') {
      setSaving(true);
      try {
        const created = await createGoal({
          title: formState.title.trim(),
          deadline: isoDeadline,
          description: formState.description || undefined,
          motivation: formState.motivation || undefined,
        });
        setGoals((prev) => [...prev, created]);
        closeModal();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!activeGoal) return;
    const updatedGoal: PlannerGoal = {
      ...activeGoal,
      title: formState.title.trim(),
      deadline: isoDeadline,
      description: formState.description || undefined,
      motivation: formState.motivation || undefined,
    };
    const originalDeadline = new Date(activeGoal.deadline);
    const newDeadline = new Date(isoDeadline);
    if (
      activeGoal.motivation &&
      newDeadline.getTime() > originalDeadline.getTime()
    ) {
      setConfirmState({
        message: `Before you postpone this goal, remember your motivation:\n${activeGoal.motivation}\nAre you sure you still want to postpone it?`,
        action: () => performUpdate(updatedGoal),
      });
      return;
    }
    await performUpdate(updatedGoal);
  };

  const performDelete = async (goal: PlannerGoal) => {
    setSaving(true);
    try {
      await deleteGoal(goal.id);
      setGoals((prev) => prev.filter((entry) => entry.id !== goal.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (goal: PlannerGoal) => {
    if (goal.motivation) {
      setConfirmState({
        message: `Before you delete this goal, remember your motivation:\n${goal.motivation}\nAre you sure you still want to delete it?`,
        action: () => performDelete(goal),
      });
      return;
    }
    setConfirmState({
      message: 'Are you sure you want to delete this goal?',
      action: () => performDelete(goal),
    });
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setConfirming(true);
    try {
      await confirmState.action();
      setConfirmState(null);
      if (modalMode === 'edit') closeModal();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--card-bg)]/80 p-8 text-[color:var(--fg)] shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[0.2em]">Goals</h2>
          <p className="text-sm opacity-75">
            Capture what matters most, attach motivations, and keep track of upcoming deadlines.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-full border border-[color:var(--border)]/40 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em]"
        >
          Add Goal
        </button>
      </div>

      {loading ? <div className="text-sm opacity-80">Loading goals…</div> : null}
      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <div className="grid gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--bg)]/15 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] opacity-70">Goal</div>
                <div className="text-xl font-bold">{goal.title}</div>
                {goal.description ? (
                  <p className="mt-2 text-sm opacity-80">{goal.description}</p>
                ) : null}
                {goal.motivation ? (
                  <p className="mt-2 text-xs italic opacity-70">
                    Motivation: {goal.motivation}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                  Due Date
                </span>
                <span className="text-lg font-bold">
                  {new Date(goal.deadline).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(goal)}
                    className="rounded-lg border border-[color:var(--border)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(goal)}
                    className="rounded-lg border border-red-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border)]/30 bg-[color:var(--bg)]/15 p-6 text-sm opacity-75">
            No goals logged yet. Tap “Add Goal” to capture your next milestone.
          </div>
        ) : null}
      </div>

      {modalMode ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] p-6 text-[color:var(--fg)] shadow-[0_35px_80px_rgba(0,0,0,0.45)]">
            <h3 className="mb-4 text-lg font-bold uppercase tracking-[0.3em]">
              {modalMode === 'add' ? 'Add Goal' : 'Edit Goal'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em]">Title *</label>
                <input
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Deadline *
                </label>
                <input
                  type="date"
                  value={formState.deadline}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, deadline: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Motivation
                </label>
                <textarea
                  value={formState.motivation}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, motivation: e.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-[color:var(--border)]/40 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isFormValid || saving}
                onClick={handleSubmit}
                className="rounded-lg bg-[color:var(--fg)] px-4 py-2 text-sm font-semibold text-[color:var(--bg)] disabled:opacity-40"
              >
                {saving ? 'Saving…' : modalMode === 'add' ? 'Add Goal' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] p-6 text-[color:var(--fg)] shadow-[0_35px_80px_rgba(0,0,0,0.45)]">
            <p className="whitespace-pre-line text-sm opacity-90">{confirmState.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="rounded-lg border border-[color:var(--border)]/40 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                disabled={confirming}
              >
                {confirming ? 'Working…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
