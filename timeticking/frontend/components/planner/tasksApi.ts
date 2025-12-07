'use client';

import type { PlannerTask } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Request failed');
  }
  return res.json();
}

export async function fetchTasks(): Promise<PlannerTask[]> {
  const data = await request('/api/tasks');
  return (data.tasks || []) as PlannerTask[];
}
