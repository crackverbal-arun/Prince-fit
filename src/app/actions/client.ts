"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, attendance, mealLogs, mealPlan } from "@/db";
import { requireClient } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { checkPhoto } from "@/lib/validate";
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

