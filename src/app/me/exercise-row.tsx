"use client";
import { useState } from "react";
import { logWorkout } from "@/app/actions/client";
import { Submit } from "@/components/submit";
import { IconCheck, IconTrophy } from "@/components/icons";

type Props = {
  exercise: string;
  target: string;
  defaults: { sets: number; reps: number; weight: number };
  last: string | null;
  logged: boolean;
  isPR: boolean;
};

export function ExerciseRow({ exercise, target, defaults, last, logged, isPR }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card p-0 ${logged ? "ring-green-200" : ""}`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${logged ? "bg-good text-white" : "bg-bg ring-1 ring-line"}`}>
          {logged && <IconCheck className="size-4" />}
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{exercise}</span>
          <span className="block text-xs text-muted">Target {target}{last && ` · Last ${last}`}</span>
        </span>
        {isPR && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-warn ring-1 ring-amber-200"><IconTrophy className="size-3.5" />PR</span>}
      </button>
      {open && (
        <form action={async (fd) => { await logWorkout(fd); setOpen(false); }} className="grid grid-cols-3 gap-2 border-t border-line p-4">
          <input type="hidden" name="exercise" value={exercise} />
          {([["sets", "Sets", defaults.sets, "1"], ["reps", "Reps", defaults.reps, "1"], ["weight", "Kg", defaults.weight, "0.5"]] as const).map(([n, l, v, step]) => (
            <label key={n}>
              <span className="label">{l}</span>
              <input name={n} type="number" inputMode="decimal" step={step} min="0" defaultValue={v} className="input text-center font-semibold" />
            </label>
          ))}
          <div className="col-span-3 mt-1"><Submit>{logged ? "Update" : "Log it"}</Submit></div>
        </form>
      )}
    </div>
  );
}
