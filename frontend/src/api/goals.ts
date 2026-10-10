import { jsonBody, request } from "./client";
import type { Goal, GoalCreateInput, GoalUpdate } from "../types/goal";

export function getGoals(): Promise<Goal[]> {
  return request<Goal[]>("/goals");
}

export function createGoal(payload: GoalCreateInput): Promise<Goal> {
  return request<Goal>("/goals", jsonBody(payload));
}

export function updateGoal(goalId: number, currentValue: number, status?: Goal["status"]): Promise<Goal> {
  return request<Goal>(`/goals/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_value: currentValue, status }),
  });
}

export function toggleMilestone(goalId: number, milestoneId: number): Promise<Goal> {
  return request<Goal>(`/goals/${goalId}/milestones/${milestoneId}`, { method: "PATCH" });
}

export function addGoalUpdate(goalId: number, body: string): Promise<GoalUpdate> {
  return request<GoalUpdate>(`/goals/${goalId}/updates`, jsonBody({ body }));
}

export function deleteGoal(goalId: number): Promise<void> {
  return request<void>(`/goals/${goalId}`, { method: "DELETE" });
}
