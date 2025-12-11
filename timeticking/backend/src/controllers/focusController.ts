import { Request, Response } from 'express';
import { readDb, writeDb } from '../models/storage';
import { v4 as uuid } from 'uuid';

function getWeekStart(d = new Date()) {
  // Return Monday 00:00:00 UTC of the current week for the given date
  const date = new Date(d);
  const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (day + 6) % 7; // 0 for Monday
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

export async function startFocus(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const db = readDb();
  db.focusSessions = db.focusSessions || [];
  // if there's already an open session for this user, return it instead of creating a duplicate
  const existing = db.focusSessions.find((s: any) => s.userId === userId && !s.end);
  if (existing) {
    return res.json({ ok: true, session: existing, note: 'already_active' });
  }

  // create a session with start and no end
  const session = { id: uuid(), userId, start: new Date().toISOString(), end: null };
  db.focusSessions.push(session);
  writeDb(db);
  return res.json({ ok: true, session });
}

export async function stopFocus(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const db = readDb();
  db.focusSessions = db.focusSessions || [];
  // find last open session for this user
  const last = [...db.focusSessions].reverse().find((s: any) => s.userId === userId && !s.end);
  if (!last) return res.status(400).json({ message: 'No active session' });
  last.end = new Date().toISOString();
  writeDb(db);
  return res.json({ ok: true, session: last });
}

export async function getLeaderboard(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const db = readDb();
  db.focusSessions = db.focusSessions || [];
  db.friendships = db.friendships || [];
  db.users = db.users || [];

  // get friend ids
  const friendEntries = (db.friendships || []).filter((f: any) => f.users.includes(userId));
  const friendIds = friendEntries.map((f: any) => f.users.find((u: string) => u !== userId));
  // include the requesting user so their own time appears in the leaderboard
  if (!friendIds.includes(userId)) friendIds.push(userId);

  const weekStart = getWeekStart(new Date());
  const weekStartTs = weekStart.getTime();
  const now = Date.now();

  const leaderboard = friendIds.map((fid: string) => {
    const sessions = (db.focusSessions || []).filter((s: any) => s.userId === fid);
    // build intervals clipped to this week and to now
    const intervals: Array<[number, number]> = [];
    for (const s of sessions) {
      const sStart = new Date(s.start).getTime();
      const sEnd = s.end ? new Date(s.end).getTime() : now;
      const from = Math.max(sStart, weekStartTs);
      const to = Math.min(sEnd, now);
      if (to > from) intervals.push([from, to]);
    }

    // merge overlapping intervals
    intervals.sort((a, b) => a[0] - b[0]);
    let total = 0;
    let cur: [number, number] | null = null;
    for (const iv of intervals) {
      if (!cur) {
        cur = [iv[0], iv[1]];
        continue;
      }
      if (iv[0] <= cur[1]) {
        // overlap — extend current
        cur[1] = Math.max(cur[1], iv[1]);
      } else {
        // disjoint — accumulate and start new
        total += cur[1] - cur[0];
        cur = [iv[0], iv[1]];
      }
    }
    if (cur) total += cur[1] - cur[0];
    const user = (db.users || []).find((u: any) => u.id === fid) || { id: fid, username: fid };
    return { user: { id: user.id, username: user.username, email: user.email }, totalSeconds: Math.round(total / 1000) };
  });

  leaderboard.sort((a: any, b: any) => b.totalSeconds - a.totalSeconds);
  return res.json({ ok: true, leaderboard });
}
