'use client';

import type { PlannerGoal } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Request failed');
  }
  return res.json();
}

export async function fetchGoals(): Promise<PlannerGoal[]> {
  const data = await request('/api/goals');
  return (data.goals || []) as PlannerGoal[];
}

export async function createGoal(goal: Omit<PlannerGoal, 'id'>): Promise<PlannerGoal> {
  const data = await request('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  return data.goal as PlannerGoal;
}

export async function updateGoal(goal: PlannerGoal): Promise<PlannerGoal> {
  const data = await request(`/api/goals/${goal.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  return data.goal as PlannerGoal;
}

export async function deleteGoal(id: string): Promise<void> {
  await request(`/api/goals/${id}`, { method: 'DELETE' });
}
