export interface GoalMilestone {
  id: number;
  title: string;
  completed: boolean;
  position: number;
}

export interface GoalUpdate {
  id: number;
  body: string;
  created_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  deadline: string | null;
  progress_enabled: boolean;
  current_value: number;
  target_value: number | null;
  unit: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
  milestones: GoalMilestone[];
  updates: GoalUpdate[];
}

export interface GoalCreateInput {
  title: string;
  description: string;
  category: string;
  deadline: string | null;
  progress_enabled: boolean;
  current_value: number;
  target_value: number | null;
  unit: string | null;
  milestones: { title: string }[];
}
