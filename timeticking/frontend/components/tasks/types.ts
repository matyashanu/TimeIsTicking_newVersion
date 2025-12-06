export interface PriorityTask {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  priorityRank: number; // 1 = highest priority
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface CreateTaskInput {
  title: string;
  dueDate: string;
  priorityRank: number;
}
