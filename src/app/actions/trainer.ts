"use server";
import bcrypt from "bcryptjs";
import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, users, packages, attendance, workoutPlan, mealPlan } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { normalizePhone, num } from "@/lib/validate";

const done = () => revalidatePath("/trainer", "layout");

async function client(id: string) {
  await requireTrainer();
  const c = await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.role, "client")) });
  if (!c) throw new Error("Client not found");
  return c;
}

export type CreateState = { error?: string; created?: { id: string; name: string; phone: string; password: string } } | undefined;

export async function createClient(_: CreateState, formData: FormData): Promise<CreateState> {
  await requireTrainer();
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "").trim();
  if (!name) return { error: "Name is required." };
  if (phone.length !== 10) return { error: "Enter a 10-digit mobile number." };
  if (password.length < 6) return { error: "Password needs at least 6 characters." };
  if (await db.query.users.findFirst({ where: eq(users.phone, phone) })) return { error: "That number is already registered." };

  const [c] = await db.insert(users).values({
    role: "client", name, phone,
    passwordHash: await bcrypt.hash(password, 10),
    goal: String(formData.get("goal") ?? "").trim() || null,
  }).returning();

  const sessions = num(formData.get("sessions"), 1, 500);
  const amount = num(formData.get("amount"), 0, 10_000_000);
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (sessions && amount !== null && start && end) {
    await db.insert(packages).values({
      clientId: c.id, name: String(formData.get("pkgName") ?? "").trim() || `${sessions} sessions`,
      totalSessions: sessions, startDate: start, endDate: end, amount,
      paid: num(formData.get("paid"), 0, 10_000_000) ?? 0,
    });
  }
  done();
  return { created: { id: c.id, name, phone, password } };
}

export async function updateClient(id: string, formData: FormData) {
  await client(id);
  await db.update(users).set({
    name: String(formData.get("name") ?? "").trim() || undefined,
    goal: String(formData.get("goal") ?? "").trim() || null,
    trainerNote: String(formData.get("note") ?? "").trim() || null,
  }).where(eq(users.id, id));
  done();
}

export async function setActive(id: string, active: boolean) {
  await client(id);
  await db.update(users).set({ active }).where(eq(users.id, id));
  done();
}

export async function resetPassword(id: string, _: unknown, formData: FormData) {
  await client(id);
  const password = String(formData.get("password") ?? "").trim();
  if (password.length < 6) return { error: "At least 6 characters." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, id));
  return { ok: `New password: ${password}` };
}

export async function toggleAttendance(id: string, date: string) {
  await client(id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const where = and(eq(attendance.clientId, id), eq(attendance.date, date));
  if (await db.query.attendance.findFirst({ where })) await db.delete(attendance).where(where);
  else await db.insert(attendance).values({ clientId: id, date, markedBy: "trainer" });
  done();
}

export async function addExercise(id: string, formData: FormData) {
  await client(id);
  const day = num(formData.get("day"), 0, 6);
  const exercise = String(formData.get("exercise") ?? "").trim().slice(0, 80);
  const sets = num(formData.get("sets"), 1, 20);
  const reps = String(formData.get("reps") ?? "").trim().slice(0, 20);
  if (day === null || !exercise || !sets || !reps) return;
  const [{ pos }] = await db.select({ pos: max(workoutPlan.position) }).from(workoutPlan)
    .where(and(eq(workoutPlan.clientId, id), eq(workoutPlan.dayOfWeek, day)));
  await db.insert(workoutPlan).values({
    clientId: id, dayOfWeek: day, exercise, sets, reps,
    targetKg: num(formData.get("kg"), 0, 500), position: (pos ?? 0) + 1,
  });
  done();
}

export async function removeExercise(id: string, itemId: string) {
  await client(id);
  await db.delete(workoutPlan).where(and(eq(workoutPlan.id, itemId), eq(workoutPlan.clientId, id)));
  done();
}

export async function copyDay(id: string, from: number, to: number) {
  await client(id);
  const items = await db.select().from(workoutPlan).where(and(eq(workoutPlan.clientId, id), eq(workoutPlan.dayOfWeek, from)));
  await db.delete(workoutPlan).where(and(eq(workoutPlan.clientId, id), eq(workoutPlan.dayOfWeek, to)));
  if (items.length) {
    await db.insert(workoutPlan).values(items.map((it) => ({ clientId: it.clientId, exercise: it.exercise, sets: it.sets, reps: it.reps, targetKg: it.targetKg, position: it.position, dayOfWeek: to })));
  }
  done();
}

export async function addMeal(id: string, formData: FormData) {
  await client(id);
  const slot = String(formData.get("slot") ?? "").trim().slice(0, 30);
  const description = String(formData.get("description") ?? "").trim().slice(0, 300);
  if (!slot || !description) return;
  const [{ pos }] = await db.select({ pos: max(mealPlan.position) }).from(mealPlan).where(eq(mealPlan.clientId, id));
  await db.insert(mealPlan).values({ clientId: id, slot, description, position: (pos ?? 0) + 1 });
  done();
}

export async function removeMeal(id: string, itemId: string) {
  await client(id);
  await db.delete(mealPlan).where(and(eq(mealPlan.id, itemId), eq(mealPlan.clientId, id)));
  done();
}

export async function addPackage(id: string, formData: FormData) {
  await client(id);
  const sessions = num(formData.get("sessions"), 1, 500);
  const amount = num(formData.get("amount"), 0, 10_000_000);
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (!sessions || amount === null || !start || !end || end < start) return;
  await db.insert(packages).values({
    clientId: id, name: String(formData.get("name") ?? "").trim() || `${sessions} sessions`,
    totalSessions: sessions, startDate: start, endDate: end, amount,
    paid: num(formData.get("paid"), 0, 10_000_000) ?? 0,
  });
  done();
}

export async function recordPayment(id: string, packageId: string, formData: FormData) {
  await client(id);
  const amount = num(formData.get("amount"), 1, 10_000_000);
  if (!amount) return;
  const p = await db.query.packages.findFirst({ where: and(eq(packages.id, packageId), eq(packages.clientId, id)) });
  if (!p) return;
  await db.update(packages).set({ paid: Math.min(p.amount, p.paid + amount) }).where(eq(packages.id, packageId));
  done();
}
