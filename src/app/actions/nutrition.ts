"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, foods, foodLogs, users, waterLogs } from "@/db";
import { requireActor, requireTrainer } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { num } from "@/lib/validate";
import { MEALS, NUTRIENTS, scale, type Nutrients } from "@/lib/nutrition";

const refresh = () => { revalidatePath("/me", "layout"); revalidatePath("/trainer", "layout"); };
const okDate = (d: unknown) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= todayISO() ? d : null);
const meal = (m: unknown) => (MEALS.includes(String(m)) ? String(m) : "Snacks");

export type Result = { error?: string; ok?: string };

/** Log a food from the database. Amount is servings (e.g. 2 rotis) or grams. */
export async function logFood(clientId: string, formData: FormData): Promise<Result> {
  const { by } = await requireActor(clientId);
  const date = okDate(formData.get("date"));
  if (!date) return { error: "Pick today or an earlier date." };
  const food = await db.query.foods.findFirst({ where: eq(foods.id, String(formData.get("foodId") ?? "")) });
  if (!food) return { error: "Choose a food from the list." };
  const servings = num(formData.get("servings"), 0.1, 50);
  const gramsIn = num(formData.get("grams"), 1, 5000);
  const grams = gramsIn ?? (servings ? servings * food.servingG : null);
  if (!grams) return { error: "Enter how much." };
  await db.insert(foodLogs).values({
    clientId, date, meal: meal(formData.get("meal")), foodId: food.id, name: food.name,
    grams: Math.round(grams), servings: gramsIn ? +(gramsIn / food.servingG).toFixed(2) : servings,
    nutrients: scale(food.per100, grams), loggedBy: by,
  });
  refresh();
  return { ok: `Added ${food.name}` };
}

/** Quick entry for food that isn't in the database (restaurant meal, packet with a label). */
export async function logCustomFood(clientId: string, formData: FormData): Promise<Result> {
  const { by } = await requireActor(clientId);
  const date = okDate(formData.get("date"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!date || !name) return { error: "Name and date are needed." };
  const nutrients: Nutrients = {};
  for (const n of NUTRIENTS) { const v = num(formData.get(n.key), 0, 100000); if (v !== null) nutrients[n.key] = v; }
  if (nutrients.kcal === undefined) return { error: "Enter at least the calories." };
  await db.insert(foodLogs).values({ clientId, date, meal: meal(formData.get("meal")), name, nutrients, loggedBy: by });
  // Optionally remember it in the food database for next time (per serving → per 100 g needs grams).
  const g = num(formData.get("servingG"), 1, 5000);
  if (formData.get("save") === "on" && g) {
    await db.insert(foods).values({ name, servingLabel: "1 serving", servingG: g, per100: scale(nutrients, (100 / g) * 100) });
  }
  refresh();
  return { ok: `Added ${name}` };
}

export async function updateFoodLog(clientId: string, logId: string, formData: FormData) {
  await requireActor(clientId);
  const row = await db.query.foodLogs.findFirst({ where: and(eq(foodLogs.id, logId), eq(foodLogs.clientId, clientId)) });
  if (!row) return;
  const grams = num(formData.get("grams"), 1, 5000);
  const food = row.foodId ? await db.query.foods.findFirst({ where: eq(foods.id, row.foodId) }) : null;
  const set: Partial<typeof foodLogs.$inferInsert> = { meal: meal(formData.get("meal")) };
  if (grams && row.grams) {
    // Rescale what was logged so edits stay consistent even if the food was changed since.
    set.nutrients = food ? scale(food.per100, grams) : scale(row.nutrients, (grams / row.grams) * 100);
    set.grams = grams;
    if (food) set.servings = +(grams / food.servingG).toFixed(2);
  }
  await db.update(foodLogs).set(set).where(eq(foodLogs.id, logId));
  refresh();
}

export async function deleteFoodLog(clientId: string, logId: string) {
  await requireActor(clientId);
  await db.delete(foodLogs).where(and(eq(foodLogs.id, logId), eq(foodLogs.clientId, clientId)));
  refresh();
}

export async function addWater(clientId: string, date: string, ml: number) {
  await requireActor(clientId);
  const d = okDate(date);
  if (!d || !Number.isFinite(ml) || ml < 50 || ml > 3000) return;
  await db.insert(waterLogs).values({ clientId, date: d, ml: Math.round(ml) });
  refresh();
}

export async function deleteWater(clientId: string, id: string) {
  await requireActor(clientId);
  await db.delete(waterLogs).where(and(eq(waterLogs.id, id), eq(waterLogs.clientId, clientId)));
  refresh();
}

/** Prince overrides the calculated targets. Blank = go back to the calculated value. */
export async function setTargets(clientId: string, formData: FormData) {
  await requireTrainer();
  const t: Record<string, number> = {};
  for (const k of ["kcal", "protein", "carbs", "fat", "waterMl", ...NUTRIENTS.filter((n) => n.kind === "micro").map((n) => n.key)]) {
    const v = num(formData.get(k), 0, 100000); if (v) t[k] = v;
  }
  await db.update(users).set({ targets: Object.keys(t).length ? t : null }).where(and(eq(users.id, clientId), eq(users.role, "client")));
  refresh();
}

// ---- Food database (Prince) ----
function readFood(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const servingLabel = String(formData.get("servingLabel") ?? "").trim().slice(0, 40) || "1 serving";
  const servingG = num(formData.get("servingG"), 1, 5000);
  const basis = formData.get("basis") === "serving" ? "serving" : "100g";
  if (!name || !servingG) return null;
  const raw: Nutrients = {};
  for (const n of NUTRIENTS) { const v = num(formData.get(n.key), 0, 100000); if (v !== null) raw[n.key] = v; }
  return { name, servingLabel, servingG, per100: basis === "serving" ? scale(raw, 10000 / servingG) : raw };
}

export async function saveFood(foodId: string | null, _: unknown, formData: FormData): Promise<Result> {
  await requireTrainer();
  const f = readFood(formData);
  if (!f) return { error: "Name and serving size (g) are required." };
  if (foodId) await db.update(foods).set(f).where(eq(foods.id, foodId));
  else await db.insert(foods).values(f);
  revalidatePath("/trainer/foods");
  return { ok: foodId ? "Saved" : `Added ${f.name}` };
}

export async function deleteFood(foodId: string) {
  await requireTrainer();
  await db.delete(foods).where(eq(foods.id, foodId)); // past logs keep their own copy of the nutrients
  revalidatePath("/trainer/foods");
}
