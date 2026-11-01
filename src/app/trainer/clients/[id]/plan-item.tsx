"use client";
import { useState, useTransition } from "react";
import { updatePlanItem } from "@/app/actions/workout";
import { removeExercise } from "@/app/actions/trainer";
import { DAYS } from "@/lib/dates";
import { IconTrash } from "@/components/icons";

type Item = { id: string; exercise: string; dayOfWeek: number; sets: number; reps: string; metric: "weight" | "time" | "cardio"; targetKg: number | null; targetSec: number | null; targetKm: number | null };
const clock = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");

export function PlanItemRow({ clientId, item, target }: { clientId: string; item: Item; target: string }) {
  const [edit, setEdit] = useState(false);
  const [metric, setMetric] = useState(item.metric);
  const [pending, start] = useTransition();
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEdit(!edit)} className="flex flex-1 items-center gap-2 text-left">
          <span className="flex-1 text-sm">{item.exercise}</span><span className="text-sm text-muted">{target}</span>
        </button>
        <button type="button" onClick={() => setEdit(!edit)} className="text-xs font-semibold text-muted underline">Edit</button>
        <button type="button" disabled={pending} aria-label={`Remove ${item.exercise}`} onClick={() => confirm(`Remove ${item.exercise} from ${DAYS[item.dayOfWeek]}?`) && start(() => removeExercise(clientId, item.id))} className="grid size-8 place-items-center rounded-lg text-muted hover:text-bad"><IconTrash className="size-4" /></button>
      </div>
      {edit && (
        <form action={(fd) => start(async () => { await updatePlanItem(clientId, item.id, fd); setEdit(false); })} className="mt-2 space-y-2 rounded-xl bg-bg p-3 ring-1 ring-line">
          <input name="exercise" defaultValue={item.exercise} className="input bg-surface" aria-label="Exercise" />
          <div className="grid grid-cols-2 gap-2">
            <select name="day" defaultValue={item.dayOfWeek} className="input bg-surface" aria-label="Day">{[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}</select>
            <select name="metric" value={metric} onChange={(e) => setMetric(e.target.value as Item["metric"])} className="input bg-surface" aria-label="Type"><option value="weight">Weight × reps</option><option value="time">Timed</option><option value="cardio">Cardio</option></select>
          </div>
          {metric === "weight" && <div className="grid grid-cols-3 gap-2"><input name="sets" type="number" defaultValue={item.sets} className="input bg-surface" aria-label="Sets" /><input name="reps" defaultValue={item.reps} className="input bg-surface" aria-label="Reps" /><input name="kg" type="number" step="0.5" defaultValue={item.targetKg ?? ""} placeholder="kg" className="input bg-surface" aria-label="Kg" /></div>}
          {metric === "time" && <div className="grid grid-cols-2 gap-2"><input name="sets" type="number" defaultValue={item.sets} className="input bg-surface" aria-label="Sets" /><input name="time" defaultValue={clock(item.targetSec)} placeholder="m:ss" className="input bg-surface" aria-label="Time" /></div>}
          {metric === "cardio" && <div className="grid grid-cols-2 gap-2"><input type="hidden" name="sets" value="1" /><input name="time" defaultValue={clock(item.targetSec)} placeholder="Duration m:ss" className="input bg-surface" aria-label="Duration" /><input name="km" type="number" step="0.1" defaultValue={item.targetKm ?? ""} placeholder="km" className="input bg-surface" aria-label="Distance" /></div>}
          <div className="flex gap-2"><button type="button" onClick={() => setEdit(false)} className="btn-ghost flex-1 bg-surface">Cancel</button><button disabled={pending} className="btn-primary flex-[2]">Save</button></div>
        </form>
      )}
    </div>
  );
}
