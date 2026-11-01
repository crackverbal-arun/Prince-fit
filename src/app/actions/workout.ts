"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, attendance, workoutLogs, workoutPlan, type SetEntry } from "@/db";
import { requireActor, requireTrainer } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { num, parseDuration } from "@/lib/validate";
import { estimateCalories } from "@/lib/workout";
import { getProfile } from "@/lib/q-client";

const refresh = () => { revalidatePath("/me", "layout"); revalidatePath("/trainer", "layout"); };
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export type LogResult = { error?: string; ok?: boolean };

/**
 * Save one exercise for one day (create or replace). Used by both Prince (during a session, or
 * back-filling) and the client. Logging also marks the day present.
 */
export async function saveExerciseLog(clientId: string, formData: FormData): Promise<LogResult> {
  const { by } = await requireActor(clientId);
  const date = String(formData.get("date") ?? todayISO());
  if (!isDate(date) || date > todayISO()) return { error: "Pick a date that isn't in the future." };
  const exercise = String(formData.get("exercise") ?? "").trim().slice(0, 80);
  const kind = (["weight", "time", "cardio"] as const).find((k) => k === formData.get("kind")) ?? "weight";
  if (!exercise) return { error: "Exercise name is missing." };
  const originalName = String(formData.get("originalExercise") ?? "").trim();

  let row: Omit<typeof workoutLogs.$inferInsert, "clientId" | "date" | "exercise">;
  if (kind === "cardio") {
    const durationSec = parseDuration(formData.get("duration"));
    const distanceKm = num(formData.get("distance"), 0.01, 300);
    if (!durationSec && !distanceKm) return { error: "Enter a duration or a distance." };
    let calories = num(formData.get("calories"), 1, 5000);
    if (calories === null && durationSec) calories = estimateCalories(exercise, durationSec, (await getProfile(clientId)).weightKg);
    row = { kind, sets: 1, reps: 1, weightKg: 0, durationSec, distanceKm, calories, avgHr: num(formData.get("avgHr"), 40, 230), setsDetail: null };
  } else {
    let raw: SetEntry[] = [];
    try { raw = JSON.parse(String(formData.get("sets") ?? "[]")); } catch { return { error: "Couldn't read the sets." }; }
    const sets: SetEntry[] = [];
    for (const s of raw.slice(0, 20)) {
      if (kind === "time") {
        const sec = typeof s.sec === "number" ? s.sec : parseDuration(String(s.sec ?? ""));
        if (sec && sec > 0 && sec <= 6 * 3600) sets.push({ sec: Math.round(sec) });
      } else {
        const reps = Number(s.reps), kg = Number(s.kg ?? 0);
        if (Number.isFinite(reps) && reps >= 1 && reps <= 200 && Number.isFinite(kg) && kg >= 0 && kg <= 500) sets.push({ reps: Math.round(reps), kg: Math.round(kg * 4) / 4 });
      }
    }
    if (!sets.length) return { error: kind === "time" ? "Add at least one set with a time like 45s or 1:30." : "Add at least one set with reps." };
    const top = kind === "time"
      ? { reps: 1, weightKg: 0, durationSec: Math.max(...sets.map((s) => s.sec!)) }
      : (() => { const t = sets.reduce((a, b) => ((b.kg ?? 0) > (a.kg ?? 0) || ((b.kg ?? 0) === (a.kg ?? 0) && (b.reps ?? 0) > (a.reps ?? 0)) ? b : a)); return { reps: t.reps!, weightKg: t.kg ?? 0, durationSec: null }; })();
    row = { kind, sets: sets.length, ...top, setsDetail: sets, distanceKm: null, calories: null, avgHr: null };
  }
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 300) || null;

  // Renaming an exercise while editing: remove the old row first.
  if (originalName && originalName !== exercise) {
    await db.delete(workoutLogs).where(and(eq(workoutLogs.clientId, clientId), eq(workoutLogs.date, date), eq(workoutLogs.exercise, originalName)));
  }
  await db.insert(workoutLogs).values({ clientId, date, exercise, ...row, notes, loggedBy: by })
    .onConflictDoUpdate({ target: [workoutLogs.clientId, workoutLogs.date, workoutLogs.exercise], set: { ...row, notes, loggedBy: by } });
  await db.insert(attendance).values({ clientId, date, markedBy: by, status: "present" })
    .onConflictDoUpdate({ target: [attendance.clientId, attendance.date], set: { status: "present", reason: null } });
  refresh();
  return { ok: true };
}

export async function deleteWorkoutLog(clientId: string, logId: string) {
  await requireActor(clientId);
  await db.delete(workoutLogs).where(and(eq(workoutLogs.id, logId), eq(workoutLogs.clientId, clientId)));
  refresh();
}

/** Edit a plan item in place (Prince). */
export async function updatePlanItem(clientId: string, itemId: string, formData: FormData) {
  await requireTrainer();
  const metric = (["weight", "time", "cardio"] as const).find((k) => k === formData.get("metric")) ?? "weight";
  const exercise = String(formData.get("exercise") ?? "").trim().slice(0, 80);
  const day = num(formData.get("day"), 0, 6);
  if (!exercise || day === null) return;
  await db.update(workoutPlan).set({
    exercise, dayOfWeek: day, metric,
    sets: num(formData.get("sets"), 1, 20) ?? 1,
    reps: metric === "weight" ? String(formData.get("reps") ?? "10").trim().slice(0, 20) || "10" : "1",
    targetKg: metric === "weight" ? num(formData.get("kg"), 0, 500) : null,
    targetSec: metric === "weight" ? null : parseDuration(formData.get("time")),
    targetKm: metric === "cardio" ? num(formData.get("km"), 0.1, 300) : null,
  }).where(and(eq(workoutPlan.id, itemId), eq(workoutPlan.clientId, clientId)));
  refresh();
}
