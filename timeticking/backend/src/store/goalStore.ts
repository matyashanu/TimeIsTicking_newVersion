export interface GoalDTO {
  id: string;
  title: string;
  deadline: string;
  description?: string;
  motivation?: string;
}

export const goalStore: GoalDTO[] = [];
