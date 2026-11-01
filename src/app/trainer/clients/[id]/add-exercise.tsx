"use client";
import { useState } from "react";
import { DAYS } from "@/lib/dates";
import { Submit } from "@/components/submit";
import { CARDIO_NAMES } from "@/lib/workout";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const COMMON = ["Back Squat", "Bench Press", "Deadlift", "Overhead Press", "Barbell Row", "Lat Pulldown", "Leg Press", "Romanian Deadlift", "Incline DB Press", "Seated Cable Row", "Bicep Curl", "Tricep Pushdown", "Lunges"];
const TIMED = ["Plank", "Side Plank", "Wall Sit", "Dead Hang", "Hollow Hold", "L-sit"];

export function AddExerciseForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [metric, setMetric] = useState<"weight" | "time" | "cardio">("weight");
  return (
    <form action={action} className="card space-y-2">
      <div className="text-sm font-semibold">Add exercise</div>
      <div className="grid grid-cols-7 gap-1">
        {ORDER.map((d) => (
          <label key={d} className="cursor-pointer">
            <input type="radio" name="day" value={d} defaultChecked={d === 1} className="peer sr-only" />
            <span className="block rounded-lg bg-bg py-2 text-center text-xs font-semibold text-muted ring-1 ring-line peer-checked:bg-ink peer-checked:text-volt">{DAYS[d].slice(0, 2)}</span>
          </label>
        ))}
      </div>
      <input type="hidden" name="metric" value={metric} />
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">
        {(["weight", "time", "cardio"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMetric(m)}
            className={`rounded-lg py-2 text-xs font-semibold ${metric === m ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted"}`}>
            {m === "weight" ? "Weight × reps" : m === "time" ? "Timed hold" : "Cardio"}
          </button>
        ))}
      </div>
      <input name="exercise" list={`ex-${metric}`} required placeholder="Exercise" className="input" />
      <datalist id={`ex-${metric}`}>{(metric === "time" ? TIMED : metric === "cardio" ? CARDIO_NAMES : COMMON).map((e) => <option key={e} value={e} />)}</datalist>
      {metric === "weight" ? (
        <div className="grid grid-cols-3 gap-2">
          <input name="sets" type="number" inputMode="numeric" placeholder="Sets" defaultValue={3} required className="input" aria-label="Sets" />
          <input name="reps" placeholder="Reps e.g. 8-10" defaultValue="10" required className="input" aria-label="Reps" />
          <input name="kg" type="number" inputMode="decimal" step="0.5" placeholder="Kg" className="input" aria-label="Target kg" />
        </div>
      ) : metric === "time" ? (
        <div className="grid grid-cols-3 gap-2">
          <input name="sets" type="number" inputMode="numeric" placeholder="Sets" defaultValue={3} required className="input" aria-label="Sets" />
          <input name="time" placeholder="Time per set: 45s, 1:30" required className="input col-span-2" aria-label="Target time" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input type="hidden" name="sets" value="1" />
          <input name="time" placeholder="Duration: 20m, 30:00" className="input" aria-label="Target duration" />
          <input name="km" type="number" inputMode="decimal" step="0.1" placeholder="Distance km" className="input" aria-label="Target distance" />
        </div>
      )}
      <Submit>Add to plan</Submit>
    </form>
  );
}
