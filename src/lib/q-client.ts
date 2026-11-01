import "server-only";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db, users, bodyStats, assessments, foodLogs, waterLogs, foods, sessions, notifications, progressPhotos, workoutLogs } from "@/db";
import { computeTargets, sum, type Nutrients, type Profile, type Sex } from "./nutrition";
import { addDays, todayISO } from "./dates";

/** What the app knows about a client's body, pulled from the latest assessment and weigh-in. */
export async function getProfile(clientId: string): Promise<Profile> {
  const [a, w] = await Promise.all([
    db.select({ data: assessments.data }).from(assessments).where(eq(assessments.clientId, clientId)).orderBy(desc(assessments.date), desc(assessments.createdAt)).limit(1),
    db.select({ weightKg: bodyStats.weightKg }).from(bodyStats).where(and(eq(bodyStats.clientId, clientId))).orderBy(desc(bodyStats.date), desc(bodyStats.createdAt)),
  ]);
  const d = a[0]?.data ?? {};
  const g = String(d.gender ?? "").toLowerCase();
  return {
    sex: g === "male" ? "male" : g === "female" ? "female" as Sex : null,
    age: typeof d.age === "number" ? d.age : null,
    heightCm: typeof d.height === "number" ? d.height : null,
    weightKg: w.find((r) => r.weightKg != null)?.weightKg ?? (typeof d.weight === "number" ? d.weight : null),
    goals: Array.isArray(d.goals) ? d.goals : [],
  };
}

export async function getTargets(clientId: string) {
  const [p, u] = await Promise.all([getProfile(clientId), db.query.users.findFirst({ where: eq(users.id, clientId), columns: { targets: true } })]);
  return { profile: p, ...computeTargets(p, u?.targets) };
}

export async function getFoodLogs(clientId: string, from: string, to = from) {
  return db.select().from(foodLogs).where(and(eq(foodLogs.clientId, clientId), gte(foodLogs.date, from), lte(foodLogs.date, to)))
    .orderBy(asc(foodLogs.date), asc(foodLogs.createdAt));
}

export async function getWater(clientId: string, from: string, to = from) {
  return db.select().from(waterLogs).where(and(eq(waterLogs.clientId, clientId), gte(waterLogs.date, from), lte(waterLogs.date, to)))
    .orderBy(asc(waterLogs.date), asc(waterLogs.createdAt));
}

/** Per-day totals for a date range (days with nothing logged are included as empty). */
export async function getDailyNutrition(clientId: string, from: string, to: string) {
  const [logs, water] = await Promise.all([getFoodLogs(clientId, from, to), getWater(clientId, from, to)]);
  const days: { date: string; totals: Nutrients; waterMl: number; entries: number }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const dayLogs = logs.filter((l) => l.date === d);
    days.push({ date: d, totals: sum(dayLogs.map((l) => l.nutrients)), waterMl: water.filter((w) => w.date === d).reduce((s, w) => s + w.ml, 0), entries: dayLogs.length });
  }
  return days;
}

export async function getFoods() {
  return db.select().from(foods).orderBy(asc(foods.name));
}

export async function getSessions(opts: { from: string; to: string; clientId?: string }) {
  const where = [gte(sessions.date, opts.from), lte(sessions.date, opts.to)];
  if (opts.clientId) where.push(eq(sessions.clientId, opts.clientId));
  return db.select({ s: sessions, name: users.name, phone: users.phone }).from(sessions).innerJoin(users, eq(users.id, sessions.clientId))
    .where(and(...where)).orderBy(asc(sessions.date), asc(sessions.startTime));
}

export async function getNextSession(clientId: string) {
  const today = todayISO();
  const rows = await getSessions({ from: today, to: addDays(today, 60), clientId });
  return rows.find((r) => r.s.status === "scheduled") ?? null;
}

export async function getNotifications(sessionIds: string[]) {
  if (!sessionIds.length) return [];
  return db.select().from(notifications).where(inArray(notifications.sessionId, sessionIds)).orderBy(desc(notifications.createdAt));
}

export async function getPhotos(clientId: string) {
  const [photos, legacy] = await Promise.all([
    db.select().from(progressPhotos).where(eq(progressPhotos.clientId, clientId)).orderBy(asc(progressPhotos.date)),
    db.select({ id: bodyStats.id, date: bodyStats.date, photo: bodyStats.photo }).from(bodyStats).where(eq(bodyStats.clientId, clientId)).orderBy(asc(bodyStats.date)),
  ]);
  return [
    ...photos.map((p) => ({ id: p.id, date: p.date, pose: p.pose, photo: p.photo, legacy: false })),
    ...legacy.filter((l) => l.photo).map((l) => ({ id: l.id, date: l.date, pose: "front", photo: l.photo!, legacy: true })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getWorkoutLogsRange(clientId: string, from: string, to: string) {
  return db.select().from(workoutLogs).where(and(eq(workoutLogs.clientId, clientId), gte(workoutLogs.date, from), lte(workoutLogs.date, to)))
    .orderBy(desc(workoutLogs.date), asc(workoutLogs.createdAt));
}
