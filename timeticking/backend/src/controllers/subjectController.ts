import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  subjectStore,
  createEmptySessionTypes,
  deleteSubjectById,
  normalizeCourseCode,
} from '../store/calendarStore.js';
import { subjectStore, createEmptySessionTypes, deleteSubjectById, normalizeCourseCode } from '../store/calendarStore.js';
import { SubjectDTO } from '../types/calendar.js';

function normalizeSemester(value?: string | null): SubjectDTO['semester'] {
  if (!value) return '';
  const normalized = value.trim().toUpperCase();
  return normalized === 'S1' || normalized === 'S2' ? normalized : '';
}

export function listSubjects(_req: Request, res: Response) {
  return res.json({ subjects: subjectStore });
}

export function createSubject(req: Request, res: Response) {
  const body = req.body as Partial<SubjectDTO>;
  const rawCode = body.courseCode || body.id || uuid();
  const code = normalizeCourseCode(rawCode);
  if (!code) return res.status(400).json({ message: 'Invalid course code' });
  const name = body.name && body.name.length ? body.name : '(Unnamed Course)';
  const semester = normalizeSemester(body.semester);
  const existing = subjectStore.find((subject) => subject.courseCode === code);
  if (existing) {
    return res.status(409).json({ message: `Subject ${code} already exists` });
  }

  const subject: SubjectDTO = {
    id: code,
    courseCode: code,
    name,
    semester,
    credits: body.credits,
    confidence: body.confidence ?? 3,
    sessionTypes: body.sessionTypes || createEmptySessionTypes(),
    events: [],
    createdManually: true,
  };
  subjectStore.push(subject);
  return res.status(201).json({ subject });
}

export function updateSubject(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing subject id' });
  const subject = subjectStore.find((item) => item.id === id);
  if (!subject) return res.status(404).json({ message: `Subject ${id} not found` });

  const body = req.body as Partial<SubjectDTO>;
  if (body.name !== undefined) subject.name = body.name || subject.name;
  if (body.credits !== undefined) subject.credits = body.credits;
  if (body.confidence !== undefined) subject.confidence = Math.min(5, Math.max(1, body.confidence));
  if (body.semester !== undefined) subject.semester = normalizeSemester(body.semester);
  if (body.sessionTypes) {
    subject.sessionTypes = {
      ...subject.sessionTypes,
      ...body.sessionTypes,
    };
  }
  if (body.createdManually !== undefined) {
    subject.createdManually = body.createdManually;
  }

  return res.json({ subject });
}

export function deleteSubject(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing subject id' });
  const removed = deleteSubjectById(id);
  if (!removed) return res.status(404).json({ message: `Subject ${id} not found` });
  return res.json({ id: removed.id });
}
