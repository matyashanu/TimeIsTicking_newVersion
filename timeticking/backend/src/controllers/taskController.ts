import { Request, Response } from 'express';

export function getTasks(_req: Request, res: Response) {
  res.json({ tasks: [] });
}
