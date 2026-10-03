import "server-only";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, users, packages, attendance, mealPlan, mealLogs, workoutLogs, workoutPlan, bodyStats, type Package } from "@/db";
import { addDays, daysBetween, todayISO } from "./dates";

export type PackageStatus = {
  pkg: Package;
  used: number;
  left: number;
  daysLeft: number;
  due: number;
  expired: boolean;
};

function packageStatus(pkg: Package, presentDates: string[], today: string): PackageStatus {
  const used = presentDates.filter((d) => d >= pkg.startDate && d <= pkg.endDate).length;
  const daysLeft = daysBetween(today, pkg.endDate);
  return {
    pkg,
    used,
    left: Math.max(0, pkg.totalSessions - used),
    daysLeft,
    due: Math.max(0, pkg.amount - pkg.paid),
    expired: daysLeft < 0 || used >= pkg.totalSessions,
  };
}

// Packages arrive newest-start first. Current = the one covering today, else the latest started.
function pickCurrent(list: PackageStatus[], today: string) {
  return list.find((s) => s.pkg.startDate <= today && !s.expired)
    ?? list.find((s) => s.pkg.startDate <= today)
    ?? list.at(-1) ?? null;
}

export type Flag = { kind: "missed" | "renewal" | "dues" | "diet" | "nopackage"; label: string };

export type ClientSummary = {
  id: string;
  name: string;
  phone: string;
  goal: string | null;
  active: boolean;
  lastVisit: string | null;
  daysSinceVisit: number | null;
  inToday: boolean;
  visits30: number;
  current: PackageStatus | null;
  due: number;
  flags: Flag[];
};

// One pass over all clients, used by the trainer dashboard and client list.
export async function getClientSummaries(): Promise<ClientSummary[]> {
  const today = todayISO();
  const clients = await db.select().from(users).where(eq(users.role, "client")).orderBy(asc(users.name));
  if (!clients.length) return [];
  const ids = clients.map((c) => c.id);

  const [pkgs, att, plans, logsToday] = await Promise.all([
    db.select().from(packages).where(inArray(packages.clientId, ids)).orderBy(desc(packages.startDate)),
    db.select({ clientId: attendance.clientId, date: attendance.date, status: attendance.status, reason: attendance.reason }).from(attendance)
      .where(and(inArray(attendance.clientId, ids), gte(attendance.date, addDays(today, -400)))),
    db.select({ clientId: mealPlan.clientId, n: sql<number>`count(*)` }).from(mealPlan)
      .where(inArray(mealPlan.clientId, ids)).groupBy(mealPlan.clientId),
    db.select({ clientId: mealLogs.clientId, n: sql<number>`count(*)` }).from(mealLogs)
      .where(and(inArray(mealLogs.clientId, ids), eq(mealLogs.date, addDays(today, -1)))).groupBy(mealLogs.clientId),
  ]);

  return clients.map((c) => {
    const records = att.filter((a) => a.clientId === c.id).sort((a, b) => a.date.localeCompare(b.date));
    const dates = records.filter((a) => a.status === "present").map((a) => a.date);
    // Most recent absence after the last visit, so Prince knows *why* before nudging
    const absence = records.findLast((a) => a.status === "absent" && (!dates.length || a.date > dates.at(-1)!));
    const lastVisit = dates.at(-1) ?? null;
    const daysSinceVisit = lastVisit ? daysBetween(lastVisit, today) : null;
    const mine = pkgs.filter((p) => p.clientId === c.id).map((p) => packageStatus(p, dates, today));
    const current = pickCurrent(mine, today);
    const renewed = mine.some((s) => s.pkg.startDate > today);
    const mealsTotal = plans.find((p) => p.clientId === c.id)?.n ?? 0;
    const mealsYesterday = logsToday.find((l) => l.clientId === c.id)?.n ?? 0;

    const flags: Flag[] = [];
    if (c.active) {
      if (daysSinceVisit === null) flags.push({ kind: "missed", label: "Never checked in" });
      else if (daysSinceVisit >= 3)
        flags.push({ kind: "missed", label: `Absent ${daysSinceVisit}d${absence?.reason ? ` · ${absence.reason}` : ""}` });
      if (!current) flags.push({ kind: "nopackage", label: "No package" });
      else if (renewed) { /* next package already booked */ }
      else if (current.expired) flags.push({ kind: "renewal", label: "Package ended" });
      else if (current.left <= 2 || current.daysLeft <= 5)
        flags.push({ kind: "renewal", label: current.left <= 2 ? `${current.left} sessions left` : `Ends in ${current.daysLeft}d` });
      const due = mine.reduce((sum, s) => sum + s.due, 0);
      if (due > 0) flags.push({ kind: "dues", label: `₹${due.toLocaleString("en-IN")} due` });
      if (mealsTotal > 0 && mealsYesterday < mealsTotal / 2) flags.push({ kind: "diet", label: `Diet ${mealsYesterday}/${mealsTotal} yesterday` });
    }

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      goal: c.goal,
      active: c.active,
      lastVisit,
      daysSinceVisit,
      inToday: lastVisit === today,
      visits30: dates.filter((d) => d > addDays(today, -30)).length,
      current,
      due: mine.reduce((sum, s) => sum + s.due, 0),
      flags,
    };
  });
}

export async function getPackages(clientId: string) {
  const today = todayISO();
  const [pkgs, att] = await Promise.all([
    db.select().from(packages).where(eq(packages.clientId, clientId)).orderBy(desc(packages.startDate)),
    db.select({ date: attendance.date }).from(attendance).where(and(eq(attendance.clientId, clientId), eq(attendance.status, "present"))),
  ]);
  const dates = att.map((a) => a.date);
  const all = pkgs.map((p) => packageStatus(p, dates, today));
  const current = pickCurrent(all, today);
  return { current, others: all.filter((s) => s !== current) };
}

export type AttendanceDay = { status: "present" | "absent"; reason: string | null; markedBy: "client" | "trainer" };

export async function getAttendance(clientId: string, fromDate: string) {
  const rows = await db.select({ date: attendance.date, status: attendance.status, reason: attendance.reason, markedBy: attendance.markedBy })
    .from(attendance).where(and(eq(attendance.clientId, clientId), gte(attendance.date, fromDate)));
  return new Map<string, AttendanceDay>(rows.map(({ date, ...r }) => [date, r]));
}

export async function getWorkoutPlan(clientId: string) {
  return db.select().from(workoutPlan).where(eq(workoutPlan.clientId, clientId))
    .orderBy(asc(workoutPlan.dayOfWeek), asc(workoutPlan.position));
}

export async function getMealPlan(clientId: string) {
  return db.select().from(mealPlan).where(eq(mealPlan.clientId, clientId)).orderBy(asc(mealPlan.position));
}

export async function getMealLogs(clientId: string, fromDate: string) {
  return db.select().from(mealLogs).where(and(eq(mealLogs.clientId, clientId), gte(mealLogs.date, fromDate)))
    .orderBy(desc(mealLogs.date));
}

export async function getWorkoutLogs(clientId: string, fromDate?: string) {
  return db.select().from(workoutLogs)
    .where(fromDate ? and(eq(workoutLogs.clientId, clientId), gte(workoutLogs.date, fromDate)) : eq(workoutLogs.clientId, clientId))
    .orderBy(desc(workoutLogs.date));
}

type Log = Awaited<ReturnType<typeof getWorkoutLogs>>[number];

// What "better" means for one log: longer hold/run for timed work, heavier (then more reps) otherwise.
export function score(l: Pick<Log, "weightKg" | "reps" | "durationSec">) {
  return l.durationSec != null ? l.durationSec : l.weightKg * 1000 + l.reps;
}

export type ExerciseProgress = {
  exercise: string;
  timed: boolean;
  points: { date: string; value: number }[]; // kg or seconds per session
  first: number;
  latest: number;
  best: Log;
  sessions: number;
};

// Per-exercise history for the Progress screen: trend, first vs latest, personal best.
export async function getExerciseProgress(clientId: string): Promise<ExerciseProgress[]> {
  const logs = (await getWorkoutLogs(clientId)).reverse(); // oldest first
  const byExercise = Map.groupBy(logs, (l) => l.exercise);
  return [...byExercise].map(([exercise, rows]) => {
    const timed = rows.some((r) => r.durationSec != null);
    const points = rows.map((r) => ({ date: r.date, value: timed ? (r.durationSec ?? 0) : r.weightKg }));
    const best = rows.reduce((b, r) => (score(r) > score(b) ? r : b));
    return { exercise, timed, points, first: points[0].value, latest: points.at(-1)!.value, best, sessions: rows.length };
  }).sort((a, b) => b.points.at(-1)!.date.localeCompare(a.points.at(-1)!.date));
}

export async function getBodyStats(clientId: string) {
  return db.select().from(bodyStats).where(eq(bodyStats.clientId, clientId)).orderBy(asc(bodyStats.date));
}
