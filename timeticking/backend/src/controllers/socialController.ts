import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { readDb, writeDb } from '../models/storage.js';
import { getEventsForUser } from './calendarController.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'socials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const upload = multer({ storage });

function otherUser(userId: string, a: string, b: string) {
  return a === userId ? b : a;
}

export function searchUsers(req: Request, res: Response) {
  const q = (req.query.q as string || '').toLowerCase();
  const db = readDb();
  const userId = (req as any).userId as string;
  const users = (db.users || []).filter((u: any) => {
    if (u.id === userId) return false;
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  return res.json({ users });
}

export function sendFriendRequest(req: Request, res: Response) {
  const db = readDb();
  const from = (req as any).userId as string;
  const { to } = req.body as { to?: string };
  if (!to) return res.status(400).json({ message: 'Missing to' });
  if (from === to) return res.status(400).json({ message: 'Cannot friend yourself' });
  const exists = db.friendRequests.find((r: any) => r.from === from && r.to === to && r.status === 'pending');
  if (exists) return res.status(400).json({ message: 'Request already pending' });
  const fr = { id: uuid(), from, to, status: 'pending', createdAt: new Date().toISOString() };
  db.friendRequests.push(fr);
  writeDb(db);
  return res.json({ request: fr });
}

export function listFriendRequests(req: Request, res: Response) {
  const db = readDb();
  const userId = (req as any).userId as string;
  const incoming = db.friendRequests.filter((r: any) => r.to === userId && r.status === 'pending');
  const outgoing = db.friendRequests.filter((r: any) => r.from === userId && r.status === 'pending');
  return res.json({ incoming, outgoing });
}

export function respondFriendRequest(req: Request, res: Response) {
  const db = readDb();
  const userId = (req as any).userId as string;
  const id = req.params.id;
  const { action } = req.body as { action?: string };
  if (!id || !action) return res.status(400).json({ message: 'Missing id or action' });
  const reqObj = db.friendRequests.find((r: any) => r.id === id);
  if (!reqObj) return res.status(404).json({ message: 'Request not found' });
  if (reqObj.to !== userId) return res.status(403).json({ message: 'Not authorized' });
  if (action === 'accept') {
    reqObj.status = 'accepted';
    db.friendships.push({ id: uuid(), users: [reqObj.from, reqObj.to], since: new Date().toISOString() });
  } else if (action === 'decline') {
    reqObj.status = 'rejected';
  } else {
    return res.status(400).json({ message: 'Unknown action' });
  }
  writeDb(db);
  return res.json({ request: reqObj });
}

export function listFriends(req: Request, res: Response) {
  const db = readDb();
  const userId = (req as any).userId as string;
  const friends = (db.friendships || []).filter((f: any) => f.users.includes(userId)).map((f: any) => {
    const other = otherUser(userId, f.users[0], f.users[1]);
    const user = (db.users || []).find((u: any) => u.id === other);
    return { id: other, user, since: f.since };
  });
  return res.json({ friends });
}

export function getFriendCalendar(req: Request, res: Response) {
  const friendId = req.params.friendId;
  const userId = (req as any).userId as string;
  const db = readDb();
  const isFriend = (db.friendships || []).some((f: any) => f.users.includes(userId) && f.users.includes(friendId));
  if (!isFriend) return res.status(403).json({ message: 'Not friends' });
  // relies on calendar controller helper
  const events = getEventsForUser(friendId);
  return res.json({ events });
}

function chatIdFor(a: string, b: string) {
  return [a, b].sort().join('__');
}

export function listMessages(req: Request, res: Response) {
  const friendId = req.params.friendId;
  const userId = (req as any).userId as string;
  const db = readDb();
  const isFriend = (db.friendships || []).some((f: any) => f.users.includes(userId) && f.users.includes(friendId));
  if (!isFriend) return res.status(403).json({ message: 'Not friends' });
  const cid = chatIdFor(userId, friendId);
  const messages = (db.messages || []).filter((m: any) => m.chatId === cid);
  return res.json({ messages });
}

export function sendMessage(req: Request, res: Response) {
  const friendId = req.params.friendId;
  const userId = (req as any).userId as string;
  const db = readDb();
  const isFriend = (db.friendships || []).some((f: any) => f.users.includes(userId) && f.users.includes(friendId));
  if (!isFriend) return res.status(403).json({ message: 'Not friends' });
  const cid = chatIdFor(userId, friendId);
  const text = req.body.text as string | undefined;
  const file = (req as any).file;
  const fileMeta = file ? { filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, size: file.size, url: `/uploads/socials/${file.filename}` } : undefined;
  const msg = { id: uuid(), chatId: cid, from: userId, text: text || '', file: fileMeta, createdAt: new Date().toISOString() };
  db.messages.push(msg);
  writeDb(db);
  return res.json({ message: msg });
}
