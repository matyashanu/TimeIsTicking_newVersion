'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createSubjectApi,
  deleteSubjectApi,
  fetchSubjects,
  updateSubjectApi,
} from '@/components/calendar/api';
import type { SessionTypes, Subject } from '@/components/calendar/types';

const sessionTypeLabels: Record<keyof SessionTypes, string> = {
  lecture: 'Lecture',
  exercise: 'Exercise',
  lab: 'Lab',
  project: 'Project',
  seminar: 'Seminar',
  exam: 'Exam',
  other: 'Other',
};

const normalizeSemesterInput = (value: string) => value.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 2);

const createDefaultSubject = (): Subject => ({
  id: '',
  courseCode: '',
  name: '',
  semester: '',
  credits: undefined,
  confidence: 3,
  sessionTypes: {
    lecture: false,
    exercise: false,
    lab: false,
    project: false,
    seminar: false,
    exam: false,
    other: false,
  },
  events: [],
  createdManually: true,
});

export default function PlannerSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState<Subject>(createDefaultSubject());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'alphabetical' | 'credits' | 'confidence'>('alphabetical');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchSubjects();
        if (!mounted) return;
        const normalized = data.map((subject) => ({
          ...subject,
          semester: subject.semester && subject.semester !== 'Unknown' ? subject.semester : '',
          sessionTypes: {
            lecture: Boolean(subject.sessionTypes?.lecture),
            exercise: Boolean(subject.sessionTypes?.exercise),
            lab: Boolean(subject.sessionTypes?.lab),
            project: Boolean(subject.sessionTypes?.project),
            seminar: Boolean(subject.sessionTypes?.seminar),
            exam: Boolean(subject.sessionTypes?.exam),
            other: Boolean(subject.sessionTypes?.other),
          },
        }));
        setSubjects(normalized);
        setDirtyMap({});
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFieldChange = (id: string, patch: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((subject) => (subject.id === id ? { ...subject, ...patch } : subject)),
    );
    setDirtyMap((prev) => ({ ...prev, [id]: true }));
  };

  const handleSessionToggle = (id: string, key: keyof SessionTypes, value: boolean) => {
    const target = subjects.find((subject) => subject.id === id);
    if (!target) return;
    handleFieldChange(id, {
      sessionTypes: { ...target.sessionTypes, [key]: value },
    });
  };

  const saveSubject = async (subject: Subject) => {
    setSavingId(subject.id);
    try {
      const updated = await updateSubjectApi(subject);
      setSubjects((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDirtyMap((prev) => ({ ...prev, [subject.id]: false }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const canSaveNew = useMemo(
    () => newSubject.courseCode.trim().length >= 3 && newSubject.name.trim().length > 0,
    [newSubject.courseCode, newSubject.name],
  );

  const createSubject = async () => {
    if (!canSaveNew) return;
    setSavingId('new');
    try {
      const created = await createSubjectApi({
        courseCode: newSubject.courseCode.trim().toUpperCase(),
        name: newSubject.name.trim(),
        semester: normalizeSemesterInput(newSubject.semester),
        credits: newSubject.credits,
        confidence: newSubject.confidence,
        sessionTypes: newSubject.sessionTypes,
      });
      setSubjects((prev) => [...prev, created]);
      setDirtyMap((prev) => ({ ...prev, [created.id]: false }));
      setNewSubject(createDefaultSubject());
      setCreating(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteSubject = async (subject: Subject) => {
    setDeletingId(subject.id);
    try {
      await deleteSubjectApi(subject.id);
      setSubjects((prev) => prev.filter((item) => item.id !== subject.id));
      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[subject.id];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const renderConfidence = (value: number) => {
    const full = '★'.repeat(value);
    const empty = '☆'.repeat(5 - value);
    return (
      <span className="text-lg tracking-wide text-[color:var(--fg)]">
        {full}
        <span className="opacity-40">{empty}</span>
      </span>
    );
  };

  const sortedSubjects = useMemo(() => {
    const items = [...subjects];
    if (sortMode === 'alphabetical') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'credits') {
      items.sort((a, b) => {
        if (a.credits == null && b.credits == null) return a.name.localeCompare(b.name);
        if (a.credits == null) return 1;
        if (b.credits == null) return -1;
        return a.credits - b.credits || a.name.localeCompare(b.name);
      });
    } else if (sortMode === 'confidence') {
      items.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
    }
    return items;
  }, [subjects, sortMode]);

  return (
    <section className="space-y-6 rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--card-bg)]/80 p-8 text-[color:var(--fg)] shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[0.2em]">Subjects</h2>
          <p className="text-sm opacity-75">
            Imported iCal events automatically populate subjects. You can adjust details or add your own below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            className="rounded-full border border-[color:var(--border)]/40 bg-[color:var(--card-bg)] px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] outline-none"
          >
            <option value="alphabetical">Alphabetical (A→Z)</option>
            <option value="credits">ECTS (ascending)</option>
            <option value="confidence">Confidence (high → low)</option>
          </select>
          <button
            type="button"
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-full border border-[color:var(--border)]/40 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em]"
          >
            {creating ? 'Cancel' : 'Add Subject'}
          </button>
        </div>
      </div>

      {creating ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)]/40 bg-[color:var(--bg)]/20 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold">Course Code</label>
              <input
                value={newSubject.courseCode}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, courseCode: e.target.value.toUpperCase() }))
                }
                className="mt-1 rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold">Course Name</label>
              <input
                value={newSubject.name}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold">Semester (optional)</label>
              <input
                value={newSubject.semester}
                onChange={(e) =>
                  setNewSubject((prev) => ({
                    ...prev,
                    semester: normalizeSemesterInput(e.target.value),
                  }))
                }
                placeholder="S1 / S2"
                className="mt-1 rounded-lg border border-[color:var(--border)]/40 bg-transparent px-3 py-2 text-sm uppercase outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-semibold">Confidence</label>
              <input
                type="range"
                min={1}
                max={5}
                value={newSubject.confidence}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, confidence: Number(e.target.value) }))
                }
                className="mt-2 w-full"
              />
            </div>
            {renderConfidence(newSubject.confidence)}
            <button
              type="button"
              disabled={!canSaveNew || savingId === 'new'}
              onClick={createSubject}
              className="ml-auto rounded-lg bg-[color:var(--fg)] px-4 py-2 text-sm font-semibold text-[color:var(--bg)] disabled:opacity-40"
            >
              {savingId === 'new' ? 'Saving…' : 'Save Subject'}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <div className="text-sm opacity-80">Loading subjects…</div> : null}
      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <div className="grid gap-4">
        {sortedSubjects.map((subject) => {
          const dirty = dirtyMap[subject.id];
          return (
            <div
              key={subject.id}
              className="rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--bg)]/15 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.3em] opacity-70">Course Code</div>
                  <div className="text-2xl font-bold tracking-widest">{subject.courseCode}</div>
                  <input
                    value={subject.name}
                    onChange={(e) => handleFieldChange(subject.id, { name: e.target.value })}
                    className="mt-2 w-full min-w-[320px] rounded-lg border border-[color:var(--border)]/30 bg-transparent px-3 py-2 text-sm outline-none md:min-w-[520px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em]">Credits</label>
                  <input
                    type="number"
                    min="0"
                    value={subject.credits ?? ''}
                    onChange={(e) =>
                      handleFieldChange(subject.id, {
                        credits: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-28 rounded-lg border border-[color:var(--border)]/30 bg-transparent px-2 py-1 text-sm outline-none"
                  />
                  <label className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Confidence ({subject.confidence})
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={subject.confidence}
                    onChange={(e) =>
                      handleFieldChange(subject.id, { confidence: Number(e.target.value) })
                    }
                    className="w-40"
                  />
                  {renderConfidence(subject.confidence)}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em]">Semester</label>
                  <input
                    value={subject.semester}
                    placeholder="S1 / S2"
                    onChange={(e) =>
                      handleFieldChange(subject.id, { semester: normalizeSemesterInput(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-[color:var(--border)]/30 bg-transparent px-3 py-1 text-sm uppercase outline-none"
                  />
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <button
                    type="button"
                    disabled={!dirty || savingId === subject.id}
                    onClick={() => saveSubject(subject)}
                    className="rounded-lg bg-[color:var(--fg)] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--bg)] disabled:opacity-40"
                  >
                    {savingId === subject.id ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSubject(subject)}
                    disabled={deletingId === subject.id}
                    className="rounded-full border border-red-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 hover:text-red-300 disabled:opacity-40"
                  >
                    {deletingId === subject.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {(Object.keys(sessionTypeLabels) as (keyof SessionTypes)[]).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(subject.sessionTypes[key])}
                      onChange={(e) => handleSessionToggle(subject.id, key, e.target.checked)}
                    />
                    {sessionTypeLabels[key]}
                  </label>
                ))}
              </div>

            </div>
          );
        })}
        {!loading && subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border)]/30 bg-[color:var(--bg)]/15 p-6 text-sm opacity-75">
            No subjects yet. Import an iCal feed or add one manually to get started.
          </div>
        ) : null}
      </div>
    </section>
  );
}
