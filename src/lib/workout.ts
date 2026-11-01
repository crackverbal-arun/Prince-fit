import type { SetEntry } from "@/db/schema";

export type Kind = "weight" | "time" | "cardio";
export type LogLike = {
  date: string; exercise: string; sets: number; reps: number; weightKg: number; durationSec: number | null;
  kind?: Kind | null; setsDetail?: SetEntry[] | null; distanceKm?: number | null; calories?: number | null; avgHr?: number | null;
};

export function kindOf(l: LogLike): Kind {
  if (l.kind) return l.kind;
  if (l.distanceKm != null) return "cardio";
  return l.durationSec != null ? "time" : "weight";
}

// Older logs only have a summary row; expand it so every log has per-set detail.
export function setsOf(l: LogLike): SetEntry[] {
  if (l.setsDetail?.length) return l.setsDetail;
  if (kindOf(l) === "time") return Array.from({ length: l.sets }, () => ({ sec: l.durationSec ?? 0 }));
  if (kindOf(l) === "cardio") return [];
  return Array.from({ length: l.sets }, () => ({ reps: l.reps, kg: l.weightKg }));
}

// Epley estimated one-rep max — the standard way to compare "60 kg × 8" with "65 kg × 5".
export const e1rm = (kg: number, reps: number) => (reps <= 1 ? kg : kg * (1 + reps / 30));

export function metrics(l: LogLike) {
  const k = kindOf(l), sets = setsOf(l);
  if (k === "weight") {
    const best = sets.reduce((b, s) => Math.max(b, e1rm(s.kg ?? 0, s.reps ?? 0)), 0);
    const volume = sets.reduce((v, s) => v + (s.kg ?? 0) * (s.reps ?? 0), 0);
    const top = sets.reduce<SetEntry | null>((t, s) => (!t || (s.kg ?? 0) > (t.kg ?? 0) || ((s.kg ?? 0) === (t.kg ?? 0) && (s.reps ?? 0) > (t.reps ?? 0)) ? s : t), null);
    return { kind: k, score: +best.toFixed(1), e1rm: +best.toFixed(1), volume: Math.round(volume), topKg: top?.kg ?? 0, topReps: top?.reps ?? 0, totalReps: sets.reduce((r, s) => r + (s.reps ?? 0), 0), sets: sets.length };
  }
  if (k === "time") {
    const longest = Math.max(0, ...sets.map((s) => s.sec ?? 0));
    return { kind: k, score: longest, longest, totalSec: sets.reduce((t, s) => t + (s.sec ?? 0), 0), sets: sets.length };
  }
  const dist = l.distanceKm ?? 0, sec = l.durationSec ?? 0;
  return { kind: k, score: dist || sec, distanceKm: dist, durationSec: sec, paceSecPerKm: dist ? Math.round(sec / dist) : null, calories: l.calories ?? null, avgHr: l.avgHr ?? null, sets: 1 };
}

export type Trend = "up" | "same" | "down" | "first";

/** Progressive overload: did this session beat the previous one, and has the lifter stalled? */
export function overload(history: LogLike[]) {
  // history: oldest → newest, same exercise
  const scores = history.map((l) => metrics(l).score);
  const last = scores.at(-1), prev = scores.at(-2);
  const trend: Trend = prev === undefined ? "first" : last! > prev ? "up" : last! < prev ? "down" : "same";
  // Plateau = no new best in the last 3 sessions
  const bestBefore = Math.max(0, ...scores.slice(0, -3));
  const plateau = scores.length >= 4 && Math.max(...scores.slice(-3)) <= bestBefore;
  return { trend, plateau, best: Math.max(0, ...scores) };
}

/** What to try next time: +2.5 kg once the top set hits the top of the rep range, else +1 rep. */
export function suggestNext(l: LogLike, repTarget?: string) {
  const m = metrics(l);
  if (m.kind !== "weight" || !m.topKg) return null;
  const top = Number(String(repTarget ?? "").split("-").at(-1)) || 10;
  return m.topReps >= top ? { kg: m.topKg + 2.5, reps: Number(String(repTarget ?? "").split("-")[0]) || Math.max(1, top - 2) } : { kg: m.topKg, reps: m.topReps + 1 };
}

// Rough calorie estimate for cardio when the machine doesn't show one: MET × weight × hours.
const METS: [RegExp, number][] = [[/run|jog/i, 9.8], [/skip|rope/i, 11], [/row/i, 7], [/cycl|bike|spin/i, 7.5], [/stair|step/i, 9], [/ellip|cross/i, 5], [/swim/i, 7], [/hiit|circuit/i, 8], [/walk|treadmill/i, 4.3]];
export function estimateCalories(exercise: string, durationSec: number, weightKg: number | null) {
  if (!durationSec || !weightKg) return null;
  const met = METS.find(([re]) => re.test(exercise))?.[1] ?? 6;
  return Math.round(met * weightKg * (durationSec / 3600));
}

export const CARDIO_NAMES = ["Treadmill", "Running", "Cycling", "Rowing machine", "Elliptical", "Skipping", "Stair climber", "Swimming", "HIIT circuit", "Brisk walk"];
