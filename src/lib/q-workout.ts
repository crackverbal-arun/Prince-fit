import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, workoutLogs, type WorkoutLog } from "@/db";
import { getWorkoutPlan } from "./queries";
import { dayOfWeek } from "./dates";
import { planTarget, logSummary } from "./format";
import { kindOf, metrics, overload, setsOf, suggestNext, type Kind } from "./workout";
import type { SetEntry } from "@/db/schema";

export type LoggerItem = {
  exercise: string;
  kind: Kind;
  target: string | null;
  planned: boolean;
  last: string | null; // previous session summary
  suggestion: string | null;
  prefill: { sets: SetEntry[]; duration?: number | null; distance?: number | null; calories?: number | null; avgHr?: number | null; notes?: string | null };
  logged: { id: string; summary: string; trend: "up" | "same" | "down" | "first"; plateau: boolean } | null;
};

export async function getAllLogs(clientId: string) {
  return db.select().from(workoutLogs).where(eq(workoutLogs.clientId, clientId)).orderBy(asc(workoutLogs.date), asc(workoutLogs.createdAt));
}

/** Everything the session logger needs for one client on one date: the plan for that weekday plus anything already logged. */
export async function getLoggerItems(clientId: string, date: string): Promise<LoggerItem[]> {
  const [plan, logs] = await Promise.all([getWorkoutPlan(clientId), getAllLogs(clientId)]);
  const todays = plan.filter((p) => p.dayOfWeek === dayOfWeek(date));
  const loggedToday = logs.filter((l) => l.date === date);
  const names = [...todays.map((p) => p.exercise), ...loggedToday.map((l) => l.exercise).filter((n) => !todays.some((p) => p.exercise === n))];

  return names.map((exercise) => {
    const p = todays.find((x) => x.exercise === exercise);
    const history = logs.filter((l) => l.exercise === exercise && l.date <= date);
    const today = history.find((l) => l.date === date) ?? null;
    const prev = history.filter((l) => l.date < date).at(-1) ?? null;
    const kind: Kind = today ? kindOf(today) : p?.metric ?? (prev ? kindOf(prev) : "weight");
    const next = prev ? suggestNext(prev, p?.reps) : null;

    const src: WorkoutLog | null = today ?? prev;
    let sets: SetEntry[];
    if (today) sets = setsOf(today);
    else if (kind === "weight") {
      const n = p?.sets ?? (prev ? setsOf(prev).length : 3);
      const reps = next?.reps ?? (prev ? metrics(prev).topReps as number : Number(String(p?.reps ?? "10").split("-")[0]) || 10);
      const kg = next?.kg ?? (prev ? metrics(prev).topKg as number : p?.targetKg ?? 0);
      sets = Array.from({ length: n }, () => ({ reps, kg }));
    } else if (kind === "time") {
      const n = p?.sets ?? (prev ? setsOf(prev).length : 3);
      const sec = prev ? (metrics(prev).longest as number) : p?.targetSec ?? 60;
      sets = Array.from({ length: n }, () => ({ sec }));
    } else sets = [];

    const o = today ? overload(history) : null;
    return {
      exercise, kind, planned: !!p,
      target: p ? planTarget(p) : null,
      last: prev ? `${logSummary(prev)} · ${prev.date.slice(5).split("-").reverse().join("/")}` : null,
      suggestion: !today && next ? `Try ${next.kg} kg × ${next.reps}` : null,
      prefill: {
        sets,
        duration: src && kind === "cardio" ? src.durationSec : kind === "cardio" ? p?.targetSec ?? null : null,
        distance: src && kind === "cardio" ? src.distanceKm : kind === "cardio" ? p?.targetKm ?? null : null,
        calories: today?.calories ?? null, avgHr: today?.avgHr ?? null, notes: today?.notes ?? null,
      },
      logged: today && o ? { id: today.id, summary: logSummary(today), trend: o.trend, plateau: o.plateau } : null,
    };
  });
}
