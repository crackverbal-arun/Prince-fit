"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, attendance, workoutLogs, mealLogs, mealPlan, bodyStats } from "@/db";
import { requireClient } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { checkPhoto, num, parseDuration } from "@/lib/validate";
import { ABSENCE_REASONS } from "@/lib/dates";

async function markPresent(clientId: string, date: string) {
  await db.insert(attendance).values({ clientId, date, markedBy: "client", status: "present" })
    .onConflictDoUpdate({ target: [attendance.clientId, attendance.date], set: { status: "present", reason: null, markedBy: "client" } });
}

export async function checkIn() {
  const me = await requireClient();
  await markPresent(me.id, todayISO());
  revalidatePath("/me", "layout");
}

// "Can't make it today" — tells Prince why, so he doesn't chase a sick client.
export async function markAbsentToday(reason: string, note: string) {
  const me = await requireClient();
  const r = ABSENCE_REASONS.includes(reason) ? reason : "Other";
  const full = note.trim() ? `${r}: ${note.trim().slice(0, 120)}` : r;
  await db.insert(attendance).values({ clientId: me.id, date: todayISO(), markedBy: "client", status: "absent", reason: full })
    .onConflictDoUpdate({ target: [attendance.clientId, attendance.date], set: { status: "absent", reason: full, markedBy: "client" } });
  revalidatePath("/me", "layout");
}

export async function logWorkout(formData: FormData) {
  const me = await requireClient();
  const exercise = String(formData.get("exercise") ?? "").trim().slice(0, 80);
  const sets = num(formData.get("sets"), 1, 20);
  const timed = formData.get("metric") === "time";
  const durationSec = timed ? parseDuration(formData.get("time")) : null;
  const reps = timed ? 1 : num(formData.get("reps"), 1, 200);
  const weightKg = timed ? 0 : num(formData.get("weight"), 0, 500) ?? 0;
  if (!exercise || sets === null || reps === null || (timed && durationSec === null)) return { error: timed ? "Enter a time like 45s or 1:30" : "Check the numbers" };
  const date = todayISO();
  await db.insert(workoutLogs).values({ clientId: me.id, date, exercise, sets, reps, weightKg, durationSec })
    .onConflictDoUpdate({ target: [workoutLogs.clientId, workoutLogs.date, workoutLogs.exercise], set: { sets, reps, weightKg, durationSec } });
  // Logging a workout counts as showing up (and overrides an earlier "can't make it").
  await markPresent(me.id, date);
  revalidatePath("/me", "layout");
  return {};
}

async function ownMeal(clientId: string, mealPlanId: string) {
  return db.query.mealPlan.findFirst({ where: and(eq(mealPlan.id, mealPlanId), eq(mealPlan.clientId, clientId)) });
}

export async function toggleMeal(mealPlanId: string) {
  const me = await requireClient();
  if (!(await ownMeal(me.id, mealPlanId))) return;
  const date = todayISO();
  const where = and(eq(mealLogs.clientId, me.id), eq(mealLogs.mealPlanId, mealPlanId), eq(mealLogs.date, date));
  const existing = await db.query.mealLogs.findFirst({ where });
  if (existing) await db.delete(mealLogs).where(where);
  else await db.insert(mealLogs).values({ clientId: me.id, mealPlanId, date });
  revalidatePath("/me", "layout");
}

export async function mealPhoto(mealPlanId: string, photo: string) {
  const me = await requireClient();
  if (!(await ownMeal(me.id, mealPlanId)) || !checkPhoto(photo)) return { error: "Photo too large or invalid." };
  const date = todayISO();
  await db.insert(mealLogs).values({ clientId: me.id, mealPlanId, date, photo })
    .onConflictDoUpdate({ target: [mealLogs.clientId, mealLogs.mealPlanId, mealLogs.date], set: { photo } });
  revalidatePath("/me", "layout");
  return {};
}

export async function addBodyStat(_: unknown, formData: FormData) {
  const me = await requireClient();
  const photo = String(formData.get("photo") ?? "") || null;
  if (photo && !checkPhoto(photo)) return { error: "Photo too large." };
  const row = {
    weightKg: num(formData.get("weight"), 20, 300),
    waistCm: num(formData.get("waist"), 30, 250),
    chestCm: num(formData.get("chest"), 30, 250),
    armCm: num(formData.get("arm"), 10, 100),
  };
  if (Object.values(row).every((v) => v === null) && !photo) return { error: "Enter at least one number or a photo." };
  await db.insert(bodyStats).values({ clientId: me.id, date: todayISO(), ...row, photo });
  revalidatePath("/me", "layout");
  return { ok: "Saved. Keep going! 💪" };
}
