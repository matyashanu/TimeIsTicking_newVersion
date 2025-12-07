export interface PlannerGoal {
  id: string;
  title: string;
  deadline: string;
  description?: string;
  motivation?: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  start?: string;
  end: string;
  completed?: boolean;
  description?: string;
}
