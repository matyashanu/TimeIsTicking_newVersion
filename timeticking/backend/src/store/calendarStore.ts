import { EventDTO, SessionTypes, SubjectDTO } from '../types/calendar.js';

export const eventStore: EventDTO[] = [];
export const subjectStore: SubjectDTO[] = [];

const SEMESTER_MONTHS = {
  S1: new Set([8, 9, 10, 11, 0]), // September through January
  S2: new Set([1, 2, 3, 4, 5]), // February through June
};

export function createEmptySessionTypes(): SessionTypes {
  return {
    lecture: false,
    exercise: false,
    lab: false,
    project: false,
    seminar: false,
    exam: false,
    other: false,
  };
}

export function determineSemester(subject: SubjectDTO): SubjectDTO['semester'] {
  let s1 = 0;
  let s2 = 0;
  subject.events.forEach((eventId) => {
    const event = eventStore.find((item) => item.id === eventId);
    if (!event) return;
    const month = new Date(event.start).getMonth();
    if (SEMESTER_MONTHS.S1.has(month)) s1 += 1;
    else if (SEMESTER_MONTHS.S2.has(month)) s2 += 1;
  });
  if (s1 === 0 && s2 === 0) return '';
  if (s1 > s2) return 'S1';
  if (s2 > s1) return 'S2';
  return '';
}

export function updateSubjectSemester(subject: SubjectDTO) {
  const detected = determineSemester(subject);
  if (detected) {
    subject.semester = detected;
  } else if (!subject.semester) {
    subject.semester = '';
  }
}

export function getSubjectByCode(code: string): SubjectDTO | undefined {
  return subjectStore.find((subject) => subject.courseCode === code);
}

export function ensureSubject(code: string, name?: string): SubjectDTO {
  let subject = getSubjectByCode(code);
  if (!subject) {
    subject = {
      id: code,
      courseCode: code,
      name: name && name.length ? name : '(Unnamed Course)',
      semester: '',
      credits: undefined,
      confidence: 3,
      sessionTypes: createEmptySessionTypes(),
      events: [],
      createdManually: false,
    };
    subjectStore.push(subject);
  } else if (name && !subject.name) {
    subject.name = name;
  }
  return subject;
}

export function mergeSessionTypes(target: SessionTypes, incoming?: Partial<SessionTypes>) {
  if (!incoming) return;
  (Object.keys(target) as (keyof SessionTypes)[]).forEach((key) => {
    if (incoming[key]) {
      target[key] = Boolean(target[key] || incoming[key]);
    }
  });
}

export function linkEventToSubject(
  event: EventDTO,
  options?: { sessionTypes?: Partial<SessionTypes>; nameHint?: string },
) {
  if (!event.subjectCode) return;
  const subject = ensureSubject(event.subjectCode, options?.nameHint);
  mergeSessionTypes(subject.sessionTypes, options?.sessionTypes);
  if (!subject.events.includes(event.id)) {
    subject.events.push(event.id);
  }
  updateSubjectSemester(subject);
}

export function unlinkEventFromSubject(eventId: string, subjectCode?: string | null) {
  if (!subjectCode) return;
  const subject = getSubjectByCode(subjectCode);
  if (!subject) return;
  subject.events = subject.events.filter((id) => id !== eventId);
  updateSubjectSemester(subject);
}

export function deleteSubjectById(id: string): SubjectDTO | null {
  const index = subjectStore.findIndex((subject) => subject.id === id);
  if (index === -1) return null;
  const [removed] = subjectStore.splice(index, 1);
  eventStore.forEach((event) => {
    if (event.subjectCode === removed.courseCode) {
      event.subjectCode = null;
    }
  });
  return removed;
}
