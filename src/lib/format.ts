import { fmtDuration } from "./dates";

type PlanItem = { sets: number; reps: string; metric: "weight" | "time"; targetKg: number | null; targetSec: number | null };

// "4×8 · 50kg" or "3× 45s"
export function planTarget(p: PlanItem) {
  if (p.metric === "time") return `${p.sets}× ${p.targetSec ? fmtDuration(p.targetSec) : "—"}`;
  return `${p.sets}×${p.reps}${p.targetKg ? ` · ${p.targetKg}kg` : ""}`;
}

type LogItem = { sets: number; reps: number; weightKg: number; durationSec: number | null };

export function logSummary(l: LogItem) {
  return l.durationSec != null ? `${l.sets}× ${fmtDuration(l.durationSec)}` : `${l.sets}×${l.reps} @ ${l.weightKg}kg`;
}
