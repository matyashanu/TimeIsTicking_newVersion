import { Request, Response } from 'express';

export function getUsers(_req: Request, res: Response) {
  res.json({ users: [] });
}
