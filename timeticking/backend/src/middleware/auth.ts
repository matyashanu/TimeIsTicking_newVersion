import { Request, Response, NextFunction } from 'express';

// Simple demo auth: expects `x-user-id` header with the current user id.
// In production replace with real auth (JWT/session).
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ message: 'Missing x-user-id header' });
  // attach to request for downstream handlers
  (req as any).userId = userId;
  return next();
}

export function getUserId(req: Request): string | undefined {
  return (req as any).userId;
}

export default requireUser;
