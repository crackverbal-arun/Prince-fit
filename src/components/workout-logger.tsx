"use client";
import { useState, useTransition } from "react";
import { deleteWorkoutLog, saveExerciseLog } from "@/app/actions/workout";
import type { LoggerItem } from "@/lib/q-workout";
import type { SetEntry } from "@/db/schema";
import { IconCheck, IconPlus, IconTrash, IconTrophy } from "./icons";
import { CARDIO_NAMES } from "@/lib/workout";

const fmtClock = (sec?: number) => (sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : "");

const TREND = {
  up: { label: "Progressive overload ✓", cls: "bg-green-50 text-good ring-green-200" },
  same: { label: "Same as last time", cls: "bg-bg text-muted ring-line" },
  down: { label: "Below last session", cls: "bg-amber-50 text-warn ring-amber-200" },
  first: { label: "First time logged", cls: "bg-bg text-muted ring-line" },
};

function Stepper({ value, onChange, step, label, decimals = false }: { value: number; onChange: (v: number) => void; step: number; label: string; decimals?: boolean }) {
  return (
    <div className="flex items-center rounded-xl bg-bg ring-1 ring-line">
      <button type="button" aria-label={`Less ${label}`} onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))} className="h-10 w-9 shrink-0 text-lg text-muted">−</button>
      <input aria-label={label} inputMode={decimals ? "decimal" : "numeric"} value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => onChange(Number(e.target.value.replace(",", ".")) || 0)}
        className="h-10 w-full min-w-0 bg-transparent text-center text-[16px] font-semibold outline-none" />
      <button type="button" aria-label={`More ${label}`} onClick={() => onChange(+(value + step).toFixed(2))} className="h-10 w-9 shrink-0 text-lg text-muted">+</button>
    </div>
  );
}

function ExerciseCard({ clientId, date, item, defaultOpen }: { clientId: string; date: string; item: LoggerItem; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [sets, setSets] = useState<SetEntry[]>(item.prefill.sets.length ? item.prefill.sets : item.kind === "time" ? [{ sec: 60 }] : [{ reps: 10, kg: 0 }]);
  const [secText, setSecText] = useState<string[]>(item.prefill.sets.length ? item.prefill.sets.map((s) => fmtClock(s.sec)) : ["1:00"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const update = (i: number, patch: SetEntry) => setSets(sets.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const save = (fd: FormData) => {
    fd.set("date", date); fd.set("exercise", item.exercise); fd.set("kind", item.kind);
    if (item.kind === "time") fd.set("sets", JSON.stringify(secText.map((t) => ({ sec: t }))));
    else if (item.kind === "weight") fd.set("sets", JSON.stringify(sets));
    start(async () => {
      const r = await saveExerciseLog(clientId, fd);
      if (r.error) setError(r.error); else { setError(null); setOpen(false); }
    });
  };

  return (
    <div className={`card p-0 ${item.logged ? "ring-green-200" : ""}`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${item.logged ? "bg-good text-white" : "bg-bg ring-1 ring-line"}`}>{item.logged && <IconCheck className="size-4" />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{item.exercise}</span>
            {item.kind !== "weight" && <span className="rounded bg-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted ring-1 ring-line">{item.kind === "time" ? "Timed" : "Cardio"}</span>}
          </span>
          <span className="block truncate text-xs text-muted">
            {item.logged ? item.logged.summary : [item.target && `Target ${item.target}`, item.last && `Last ${item.last}`].filter(Boolean).join(" · ") || "Not in today's plan"}
          </span>
        </span>
        {item.logged?.trend === "up" && <IconTrophy className="size-5 shrink-0 text-warn" />}
      </button>

      {item.logged && !open && (
        <div className="-mt-2 flex flex-wrap gap-1.5 px-4 pb-3">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${TREND[item.logged.trend].cls}`}>{TREND[item.logged.trend].label}</span>
          {item.logged.plateau && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-warn ring-1 ring-amber-200">Plateau: no new best in 3 sessions</span>}
        </div>
      )}

      {open && (
        <form action={save} className="space-y-3 border-t border-line p-4">
          {item.suggestion && <div className="rounded-xl bg-volt/40 px-3 py-2 text-xs font-semibold text-volt-ink ring-1 ring-lime-300">💡 {item.suggestion} to keep progressing{item.last ? ` (last: ${item.last})` : ""}</div>}

          {item.kind === "weight" && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1.5rem_1fr_1fr_2rem] gap-2 text-[11px] font-semibold text-muted"><span>#</span><span className="text-center">Reps</span><span className="text-center">Kg</span><span /></div>
              {sets.map((s, i) => (
                <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_2rem] items-center gap-2">
                  <span className="text-sm font-semibold text-muted">{i + 1}</span>
                  <Stepper label={`set ${i + 1} reps`} value={s.reps ?? 0} step={1} onChange={(v) => update(i, { reps: v })} />
                  <Stepper label={`set ${i + 1} kg`} value={s.kg ?? 0} step={2.5} decimals onChange={(v) => update(i, { kg: v })} />
                  <button type="button" aria-label={`Remove set ${i + 1}`} onClick={() => setSets(sets.filter((_, j) => j !== i))} className="grid size-8 place-items-center text-muted"><IconTrash className="size-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setSets([...sets, { ...(sets.at(-1) ?? { reps: 10, kg: 0 }) }])} className="btn-ghost btn-sm w-full"><IconPlus className="size-4" />Add set</button>
            </div>
          )}

          {item.kind === "time" && (
            <div className="space-y-2">
              {secText.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-sm font-semibold text-muted">{i + 1}</span>
                  <input aria-label={`set ${i + 1} time`} value={t} onChange={(e) => setSecText(secText.map((x, j) => (j === i ? e.target.value : x)))} placeholder="m:ss" className="input text-center font-semibold" />
                  <button type="button" aria-label={`Remove set ${i + 1}`} onClick={() => setSecText(secText.filter((_, j) => j !== i))} className="grid size-8 shrink-0 place-items-center text-muted"><IconTrash className="size-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setSecText([...secText, secText.at(-1) ?? "1:00"])} className="btn-ghost btn-sm w-full"><IconPlus className="size-4" />Add set</button>
            </div>
          )}

          {item.kind === "cardio" && (
            <div className="grid grid-cols-2 gap-2">
              <label><span className="label">Duration (m:ss)</span><input name="duration" defaultValue={fmtClock(item.prefill.duration ?? undefined)} placeholder="20:00" className="input" /></label>
              <label><span className="label">Distance (km)</span><input name="distance" type="number" inputMode="decimal" step="0.01" defaultValue={item.prefill.distance ?? ""} className="input" /></label>
              <label><span className="label">Calories</span><input name="calories" type="number" inputMode="numeric" defaultValue={item.prefill.calories ?? ""} placeholder="auto" className="input" /></label>
              <label><span className="label">Avg heart rate</span><input name="avgHr" type="number" inputMode="numeric" defaultValue={item.prefill.avgHr ?? ""} placeholder="bpm" className="input" /></label>
              <p className="col-span-2 text-[11px] text-muted">Leave calories blank to estimate them from duration and body weight.</p>
            </div>
          )}

          <input name="notes" defaultValue={item.prefill.notes ?? ""} placeholder="Notes (optional): form, pain, felt easy…" className="input" />
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex gap-2">
            {item.logged && (
              <button type="button" disabled={pending} aria-label="Delete this log"
                onClick={() => confirm(`Delete ${item.exercise} for this day?`) && start(() => deleteWorkoutLog(clientId, item.logged!.id))}
                className="btn-ghost text-bad"><IconTrash className="size-4" /></button>
            )}
            <button disabled={pending} className="btn-primary flex-1">{pending ? "Saving…" : item.logged ? "Update" : "Save"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function WorkoutLogger({ clientId, date, items }: { clientId: string; date: string; items: LoggerItem[] }) {
  const [extra, setExtra] = useState<LoggerItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<LoggerItem["kind"]>("weight");
  const all = [...items, ...extra.filter((e) => !items.some((i) => i.exercise === e.exercise))];

  return (
    <div className="space-y-2">
      {all.map((it) => <ExerciseCard key={`${date}-${it.exercise}`} clientId={clientId} date={date} item={it} defaultOpen={extra.includes(it)} />)}
      {adding ? (
        <div className="card space-y-2">
          <div className="text-sm font-semibold">Add an exercise</div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-bg p-1 ring-1 ring-line">
            {(["weight", "time", "cardio"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-lg py-2 text-xs font-semibold ${kind === k ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted"}`}>
                {k === "weight" ? "Weights" : k === "time" ? "Timed" : "Cardio"}
              </button>
            ))}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} list="logger-ex" placeholder="Exercise name" className="input" />
          <datalist id="logger-ex">{(kind === "cardio" ? CARDIO_NAMES : kind === "time" ? ["Plank", "Side plank", "Wall sit", "Dead hang"] : ["Bench Press", "Back Squat", "Deadlift", "Lat Pulldown", "Shoulder Press", "Leg Press"]).map((n) => <option key={n} value={n} />)}</datalist>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="button" disabled={!name.trim()} onClick={() => {
              setExtra([...extra, { exercise: name.trim(), kind, target: null, planned: false, last: null, suggestion: null, logged: null, prefill: { sets: kind === "weight" ? [{ reps: 10, kg: 0 }, { reps: 10, kg: 0 }, { reps: 10, kg: 0 }] : kind === "time" ? [{ sec: 60 }] : [] } }]);
              setName(""); setAdding(false);
            }} className="btn-primary flex-[2]">Add</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn-ghost w-full"><IconPlus className="size-4" />Add exercise not in the plan</button>
      )}
    </div>
  );
}
