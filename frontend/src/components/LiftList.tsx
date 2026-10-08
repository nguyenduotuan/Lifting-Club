import { Dumbbell } from "lucide-react";
import type { Lift } from "../types/lift";

export default function LiftList({ lifts }: { lifts: Lift[] }) {
  return (
    <div className="lift-list">
      {lifts.map((lift) => (
        <div className="lift-row" key={lift.id}>
          <span className="lift-mark"><Dumbbell size={15} strokeWidth={1.8} /></span>
          <span className="lift-name">{lift.exercise_name}</span>
          <strong className="lift-result">{lift.weight} {lift.unit}<span> × {lift.reps}</span></strong>
        </div>
      ))}
    </div>
  );
}