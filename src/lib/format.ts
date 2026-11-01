import { fmtDuration } from "./dates";
import { kindOf, setsOf, type LogLike } from "./workout";

type PlanItem = { sets: number; reps: string; metric: "weight" | "time" | "cardio"; targetKg: number | null; targetSec: number | null; targetKm?: number | null };

// "4×8 · 50kg", "3× 45s", "20m · 3 km"
export function planTarget(p: PlanItem) {
  if (p.metric === "cardio") return [p.targetSec ? fmtDuration(p.targetSec) : null, p.targetKm ? `${p.targetKm} km` : null].filter(Boolean).join(" · ") || "Cardio";
  if (p.metric === "time") return `${p.sets}× ${p.targetSec ? fmtDuration(p.targetSec) : "—"}`;
  return `${p.sets}×${p.reps}${p.targetKg ? ` · ${p.targetKg}kg` : ""}`;
}

export function fmtPace(secPerKm: number) {
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, "0")}/km`;
}

/** One-line summary of a logged exercise, e.g. "3 sets · 60kg×8, 60kg×8, 62.5kg×6". */
export function logSummary(l: LogLike) {
  const k = kindOf(l);
  if (k === "cardio") {
    return [l.durationSec ? fmtDuration(l.durationSec) : null, l.distanceKm ? `${l.distanceKm} km` : null, l.calories ? `${l.calories} kcal` : null, l.avgHr ? `${l.avgHr} bpm` : null].filter(Boolean).join(" · ");
  }
  const sets = setsOf(l);
  if (k === "time") {
    const same = sets.every((s) => s.sec === sets[0]?.sec);
    return same ? `${sets.length}× ${fmtDuration(sets[0]?.sec ?? 0)}` : sets.map((s) => fmtDuration(s.sec ?? 0)).join(", ");
  }
  const same = sets.every((s) => s.kg === sets[0]?.kg && s.reps === sets[0]?.reps);
  return same ? `${sets.length}×${sets[0]?.reps ?? 0} @ ${sets[0]?.kg ?? 0}kg` : sets.map((s) => `${s.kg ?? 0}×${s.reps ?? 0}`).join(", ");
}
