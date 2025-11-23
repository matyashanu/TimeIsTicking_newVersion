import { Request, Response } from 'express';
import { readDb } from '../models/storage.js';

export function getUsers(_req: Request, res: Response) {
  const db = readDb();
  return res.json({ users: db.users || [] });
}
