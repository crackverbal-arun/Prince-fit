// Nutrient definitions, targets and helpers shared by client and trainer screens.

export type NutrientKey =
  | "kcal" | "protein" | "carbs" | "fat"
  | "fiber" | "calcium" | "iron" | "magnesium" | "potassium" | "sodium" | "zinc"
  | "vitA" | "vitC" | "vitD" | "vitB12";
export type Nutrients = Partial<Record<NutrientKey, number>>;
export type Sex = "male" | "female";

type Def = { key: NutrientKey; label: string; unit: string; kind: "macro" | "micro"; rda?: Record<Sex, number>; limit?: boolean };

// Micronutrient targets: ICMR-NIN 2020 RDAs for adults (sedentary), rounded. Sodium is an upper limit.
export const NUTRIENTS: Def[] = [
  { key: "kcal", label: "Calories", unit: "kcal", kind: "macro" },
  { key: "protein", label: "Protein", unit: "g", kind: "macro" },
  { key: "carbs", label: "Carbs", unit: "g", kind: "macro" },
  { key: "fat", label: "Fat", unit: "g", kind: "macro" },
  { key: "fiber", label: "Fibre", unit: "g", kind: "micro", rda: { male: 30, female: 25 } },
  { key: "calcium", label: "Calcium", unit: "mg", kind: "micro", rda: { male: 1000, female: 1000 } },
  { key: "iron", label: "Iron", unit: "mg", kind: "micro", rda: { male: 19, female: 29 } },
  { key: "magnesium", label: "Magnesium", unit: "mg", kind: "micro", rda: { male: 440, female: 370 } },
  { key: "potassium", label: "Potassium", unit: "mg", kind: "micro", rda: { male: 3500, female: 3500 } },
  { key: "sodium", label: "Sodium", unit: "mg", kind: "micro", rda: { male: 2000, female: 2000 }, limit: true },
  { key: "zinc", label: "Zinc", unit: "mg", kind: "micro", rda: { male: 17, female: 13 } },
  { key: "vitA", label: "Vitamin A", unit: "mcg", kind: "micro", rda: { male: 1000, female: 840 } },
  { key: "vitC", label: "Vitamin C", unit: "mg", kind: "micro", rda: { male: 80, female: 65 } },
  { key: "vitD", label: "Vitamin D", unit: "mcg", kind: "micro", rda: { male: 15, female: 15 } },
  { key: "vitB12", label: "Vitamin B12", unit: "mcg", kind: "micro", rda: { male: 2.5, female: 2.5 } },
];
export const MACROS = NUTRIENTS.filter((n) => n.kind === "macro");
export const MICROS = NUTRIENTS.filter((n) => n.kind === "micro");

export function scale(per100: Nutrients, grams: number): Nutrients {
  const out: Nutrients = {};
  for (const [k, v] of Object.entries(per100)) if (typeof v === "number") out[k as NutrientKey] = +(v * grams / 100).toFixed(2);
  return out;
}

export function sum(list: Nutrients[]): Nutrients {
  const out: Nutrients = {};
  for (const n of list) for (const [k, v] of Object.entries(n)) if (typeof v === "number") out[k as NutrientKey] = (out[k as NutrientKey] ?? 0) + v;
  return out;
}

export function fmtAmount(v: number | undefined, unit: string) {
  if (v === undefined) return "—";
  const n = v >= 100 ? Math.round(v) : v >= 10 ? +v.toFixed(0) : +v.toFixed(1);
  return `${n.toLocaleString("en-IN")}${unit === "kcal" ? "" : " "}${unit === "kcal" ? " kcal" : unit}`;
}

export type Profile = { sex: Sex | null; age: number | null; heightCm: number | null; weightKg: number | null; goals: string[] };
export type Targets = Record<NutrientKey, number> & { waterMl: number };
export type TargetSource = { calculated: boolean; basis: string };

// Mifflin-St Jeor BMR.
export function bmr(p: { sex: Sex; age: number; heightCm: number; weightKg: number }) {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
}

/** Daily targets from the client's latest assessment + weight; Prince's manual values override. */
export function computeTargets(p: Profile, override?: Partial<Record<string, number>> | null): { targets: Targets; source: TargetSource } {
  const sex: Sex = p.sex ?? "male";
  const w = p.weightKg;
  let kcal: number, basis: string;
  if (w && p.heightCm && p.age) {
    const tdee = bmr({ sex, age: p.age, heightCm: p.heightCm, weightKg: w }) * 1.5; // trains 3–5×/week
    const loss = p.goals.includes("Fat loss"), gain = p.goals.includes("Muscle gain");
    kcal = tdee + (loss && gain ? -200 : loss ? -400 : gain ? 250 : 0);
    basis = `BMR × 1.5 activity${loss || gain ? `, adjusted for ${[loss && "fat loss", gain && "muscle gain"].filter(Boolean).join(" + ")}` : ""}`;
  } else if (w) { kcal = w * 30; basis = "30 kcal per kg (add age/height in an assessment for a better estimate)"; }
  else { kcal = sex === "female" ? 1800 : 2200; basis = "general adult default (no weight recorded yet)"; }
  kcal = Math.round(kcal / 50) * 50;

  const strength = p.goals.some((g) => ["Fat loss", "Muscle gain", "Strength"].includes(g));
  const protein = w ? Math.round(w * (strength ? 1.8 : 1.4)) : Math.round(kcal * 0.2 / 4);
  const fat = Math.round(kcal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const waterMl = w ? Math.max(2500, Math.round(w * 35 / 250) * 250) : 3000;

  const t = { kcal, protein, carbs, fat, waterMl } as Targets;
  for (const m of MICROS) t[m.key] = m.rda![sex];
  let calculated = true;
  for (const [k, v] of Object.entries(override ?? {})) if (typeof v === "number" && v > 0) { (t as Record<string, number>)[k] = v; calculated = false; }
  return { targets: t, source: { calculated, basis: calculated ? basis : "set by Prince" } };
}

// Status of an intake against its target, for colouring.
export function intakeTone(key: NutrientKey, eaten: number, target: number): "good" | "warn" | "bad" | "neutral" {
  if (!target) return "neutral";
  const r = eaten / target;
  if (key === "sodium") return r <= 1 ? "good" : r <= 1.3 ? "warn" : "bad";
  if (key === "kcal" || key === "carbs" || key === "fat") return r < 0.8 ? "warn" : r <= 1.1 ? "good" : "bad";
  return r >= 0.9 ? "good" : r >= 0.6 ? "warn" : "bad";
}

export const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"];
