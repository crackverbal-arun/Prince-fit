"use client";
import { useState } from "react";
import { logWorkout } from "@/app/actions/client";
import { Submit } from "@/components/submit";
import { IconCheck, IconTrophy } from "@/components/icons";

type Props = {
  exercise: string;
  timed: boolean;
  target: string;
  defaults: { sets: number; reps: number; weight: number; time: string };
  last: string | null;
  logged: boolean;
  isPR: boolean;
};

export function ExerciseRow({ exercise, timed, target, defaults, last, logged, isPR }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fields = timed
    ? ([["sets", "Sets", defaults.sets, "numeric"], ["time", "Time (m:ss)", defaults.time, "text"]] as const)
    : ([["sets", "Sets", defaults.sets, "numeric"], ["reps", "Reps", defaults.reps, "numeric"], ["weight", "Kg", defaults.weight, "decimal"]] as const);

  return (
    <div className={`card p-0 ${logged ? "ring-green-200" : ""}`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${logged ? "bg-good text-white" : "bg-bg ring-1 ring-line"}`}>
          {logged && <IconCheck className="size-4" />}
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{exercise}{timed && <span className="ml-1.5 rounded bg-bg px-1.5 py-0.5 align-middle text-[10px] font-semibold text-muted ring-1 ring-line">TIMED</span>}</span>
          <span className="block text-xs text-muted">Target {target}{last && ` · Last ${last}`}</span>
        </span>
        {isPR && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-warn ring-1 ring-amber-200"><IconTrophy className="size-3.5" />PR</span>}
      </button>
      {open && (
        <form
          action={async (fd) => { const res = await logWorkout(fd); if (res?.error) setError(res.error); else { setError(null); setOpen(false); } }}
          className={`grid gap-2 border-t border-line p-4 ${timed ? "grid-cols-2" : "grid-cols-3"}`}
        >
          <input type="hidden" name="exercise" value={exercise} />
          <input type="hidden" name="metric" value={timed ? "time" : "weight"} />
          {fields.map(([n, l, v, mode]) => (
            <label key={n}>
              <span className="label">{l}</span>
              <input name={n} type={mode === "text" ? "text" : "number"} inputMode={mode} step={n === "weight" ? "0.5" : "1"} min="0" defaultValue={v} className="input text-center font-semibold" />
            </label>
          ))}
          {error && <p className="col-span-full text-sm text-bad">{error}</p>}
          <div className="col-span-full mt-1"><Submit>{logged ? "Update" : "Log it"}</Submit></div>
        </form>
      )}
    </div>
  );
}
