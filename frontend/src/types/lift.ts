export interface Lift {
  id: number;
  exercise_name: string;
  weight: number;
  unit: "kg" | "lb";
  reps: number;
}

export interface LiftInput {
  exercise_name: string;
  weight: number;
  unit: "kg" | "lb";
  reps: number;
}