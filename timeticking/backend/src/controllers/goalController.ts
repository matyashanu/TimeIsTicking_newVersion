import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { goalStore, GoalDTO } from '../store/goalStore.js';

export function listGoals(_req: Request, res: Response) {
  res.json({ goals: goalStore });
}

export function createGoal(req: Request, res: Response) {
  const body = req.body as Partial<GoalDTO>;
  if (!body.title || !body.deadline) {
    return res.status(400).json({ message: 'Title and deadline are required' });
  }
  const goal: GoalDTO = {
    id: uuid(),
    title: body.title,
    deadline: new Date(body.deadline).toISOString(),
    description: body.description,
    motivation: body.motivation,
  };
  goalStore.push(goal);
  res.status(201).json({ goal });
}

export function updateGoal(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing goal id' });
  const goal = goalStore.find((item) => item.id === id);
  if (!goal) return res.status(404).json({ message: `Goal ${id} not found` });
  const body = req.body as Partial<GoalDTO>;
  if (body.title !== undefined) {
    if (!body.title) return res.status(400).json({ message: 'Title cannot be empty' });
    goal.title = body.title;
  }
  if (body.deadline !== undefined) {
    if (!body.deadline) return res.status(400).json({ message: 'Deadline cannot be empty' });
    goal.deadline = new Date(body.deadline).toISOString();
  }
  if (body.description !== undefined) goal.description = body.description;
  if (body.motivation !== undefined) goal.motivation = body.motivation;
  return res.json({ goal });
}

export function deleteGoal(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing goal id' });
  const index = goalStore.findIndex((goal) => goal.id === id);
  if (index === -1) return res.status(404).json({ message: `Goal ${id} not found` });
  const [removed] = goalStore.splice(index, 1);
  return res.json({ id: removed.id });
}
