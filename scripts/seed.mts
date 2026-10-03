// Creates Prince's trainer login. With --demo, also adds 4 sample clients with 6 weeks of history.
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "../src/db/schema";
import { addDays, todayISO, dayOfWeek } from "../src/lib/dates";
import { parseDuration } from "../src/lib/validate";

try { process.loadEnvFile(".env.local"); } catch {}
const db = drizzle({ connection: { url: process.env.DATABASE_URL ?? "file:local.db", authToken: process.env.DATABASE_AUTH_TOKEN }, schema: s });

async function upsertUser(v: { role: "trainer" | "client"; name: string; phone: string; password: string; goal?: string }) {
  const existing = await db.query.users.findFirst({ where: eq(s.users.phone, v.phone) });
  if (existing) return { user: existing, created: false };
  const [user] = await db.insert(s.users).values({ ...v, passwordHash: await bcrypt.hash(v.password, 10) }).returning();
  return { user, created: true };
}

const phone = (process.env.TRAINER_PHONE ?? "").replace(/\D/g, "");
const password = process.env.TRAINER_PASSWORD ?? "";
if (phone.length !== 10 || password.length < 6 || password === "change-me") {
  console.error("Set TRAINER_PHONE (10 digits) and TRAINER_PASSWORD (6+ chars, not 'change-me') in .env.local first.");
  process.exit(1);
}
const { created } = await upsertUser({ role: "trainer", name: process.env.TRAINER_NAME || "Prince", phone, password });
console.log(created ? `Trainer login created: ${phone}` : `Trainer ${phone} already exists`);

if (process.argv.includes("--demo")) {
  const today = todayISO();
  const rand = (seed: number) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const r = rand(42);

  const demos = [
    { name: "Rahul Mehta", phone: "9000000001", goal: "Lose 8kg before wedding", show: 0.85, diet: 0.9, start: 86, paid: 1, days: [1, 3, 5] },
    { name: "Ananya Iyer", phone: "9000000002", goal: "Build strength, deadlift 80kg", show: 0.75, diet: 0.6, start: 62, paid: 0.5, days: [1, 2, 4, 6] },
    { name: "Vikram Singh", phone: "9000000003", goal: "Back pain rehab + mobility", show: 0.3, diet: 0.3, start: 95, paid: 1, days: [2, 4, 6] },
    { name: "Sneha Kapoor", phone: "9000000004", goal: "Tone up, 5k run", show: 0.9, diet: 0.8, start: 70, paid: 1, days: [1, 3, 5] },
  ];
  const workouts: Record<number, [string, number, string, number][]> = {
    1: [["Back Squat", 4, "8", 50], ["Leg Press", 3, "12", 90], ["Plank", 3, "45s", 0]],
    2: [["Bench Press", 4, "8", 35], ["Lat Pulldown", 3, "10", 40], ["Tricep Pushdown", 3, "12", 15]],
    3: [["Deadlift", 4, "6", 60], ["Barbell Row", 3, "10", 30], ["Bicep Curl", 3, "12", 8]],
    4: [["Overhead Press", 4, "8", 25], ["Incline DB Press", 3, "10", 12], ["Lunges", 3, "12", 10]],
    5: [["Back Squat", 4, "6", 55], ["Romanian Deadlift", 3, "10", 40], ["Treadmill", 1, "20m", 0]],
    6: [["Deadlift", 3, "5", 65], ["Seated Cable Row", 3, "12", 35], ["Plank", 3, "60s", 0]],
  };
  const meals: [string, string][] = [
    ["Breakfast", "3 egg whites + 1 whole egg, 2 multigrain toast, black coffee"],
    ["Lunch", "1 cup brown rice, dal, 150g chicken or paneer, salad"],
    ["Evening snack", "Greek yogurt + handful of almonds"],
    ["Dinner", "2 rotis, sabzi, 150g fish or tofu"],
  ];

  for (const d of demos) {
    const { user, created } = await upsertUser({ role: "client", name: d.name, phone: d.phone, password: "demo123", goal: d.goal });
    if (!created) continue;
    const id = user.id;
    if (d.name.startsWith("Rahul")) await db.update(s.users).set({ trainerNote: "Solid week! Push squats to 60kg on Friday and keep dinner light." }).where(eq(s.users.id, id));

    const pkgStart = addDays(today, -d.start);
    // Older finished package, then the current one (Vikram's has run out).
    await db.insert(s.packages).values({ clientId: id, name: "Starter · 12 sessions", totalSessions: 12, startDate: addDays(pkgStart, -40), endDate: addDays(pkgStart, -1), amount: 9000, paid: 9000 });
    const cur = d.name.startsWith("Vikram")
      ? { start: addDays(today, -40), end: addDays(today, -2), total: 12 }
      : { start: addDays(today, -30), end: addDays(today, d.name.startsWith("Ananya") ? 3 : 30), total: 24 };
    await db.insert(s.packages).values({ clientId: id, name: `${cur.total} sessions · monthly`, totalSessions: cur.total, startDate: cur.start, endDate: cur.end, amount: 18000, paid: Math.round(18000 * d.paid) });

    for (const day of d.days) for (const [i, [exercise, sets, reps, kg]] of workouts[day].entries())
      await db.insert(s.workoutPlan).values(kg
        ? { clientId: id, dayOfWeek: day, exercise, sets, reps, targetKg: kg, position: i }
        : { clientId: id, dayOfWeek: day, exercise, sets, reps: "1", metric: "time", targetSec: parseDuration(reps), position: i });
    const mealIds = [];
    for (const [i, [slot, description]] of meals.entries())
      mealIds.push((await db.insert(s.mealPlan).values({ clientId: id, slot, description, position: i }).returning())[0].id);

    let weight = d.name.startsWith("Rahul") ? 92 : d.name.startsWith("Vikram") ? 84 : 64;
    const quitting = d.name.startsWith("Vikram");
    for (let back = 42; back >= 1; back--) {
      const date = addDays(today, -back);
      const planned = d.days.includes(dayOfWeek(date));
      const recent = back <= 6;
      if (planned && r() < (quitting && recent ? 0 : d.show)) {
        await db.insert(s.attendance).values({ clientId: id, date, markedBy: r() > 0.3 ? "client" : "trainer" }).onConflictDoNothing();
        const progress = (42 - back) / 42;
        for (const [exercise, sets, reps, kg] of workouts[dayOfWeek(date)]) {
          const v = kg
            ? { reps: parseInt(reps), weightKg: Math.round((kg * (0.85 + progress * 0.25)) * 2) / 2 }
            : { reps: 1, durationSec: Math.round(parseDuration(reps)! * (0.7 + progress * 0.45) / 5) * 5 };
          await db.insert(s.workoutLogs).values({ clientId: id, date, exercise, sets, ...v }).onConflictDoNothing();
        }
      } else if (planned && (quitting && recent ? true : r() < 0.5)) {
        const reason = quitting ? "Injury: lower back flare-up" : ["Work", "Travel", "Sick", "Family: cousin's wedding"][Math.floor(r() * 4)];
        await db.insert(s.attendance).values({ clientId: id, date, markedBy: "client", status: "absent", reason }).onConflictDoNothing();
      }
      for (const mealId of mealIds) if (r() < (quitting && recent ? 0.15 : d.diet)) await db.insert(s.mealLogs).values({ clientId: id, mealPlanId: mealId, date }).onConflictDoNothing();
      if (back % 7 === 0) {
        weight = +(weight - (quitting ? 0.1 : 0.6) + r() * 0.4).toFixed(1);
        await db.insert(s.bodyStats).values({ clientId: id, date, weightKg: weight, waistCm: +(weight * 0.98).toFixed(1), chestCm: 98, armCm: 33 });
      }
    }
    console.log(`Demo client ${d.name} · ${d.phone} / demo123`);
  }
}
