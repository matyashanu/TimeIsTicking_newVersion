import { Request, Response } from 'express';

export function getGoals(_req: Request, res: Response) {
  res.json({ goals: [] });
}
