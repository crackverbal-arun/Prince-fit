import { bmr, type Sex } from "./nutrition";

export type BmiInput = { sex: Sex; age: number; heightCm: number; weightKg: number };

// WHO adult categories, plus the lower Asian-Indian cut-offs (WHO Expert Consultation 2004 / Indian consensus 2009),
// which are more realistic for Indian clients.
const WHO = [[18.5, "Underweight"], [25, "Normal"], [30, "Overweight"], [35, "Obese (class I)"], [40, "Obese (class II)"], [Infinity, "Obese (class III)"]] as const;
const ASIAN = [[18.5, "Underweight"], [23, "Normal"], [25, "Overweight"], [Infinity, "Obese"]] as const;

const cat = (b: number, table: readonly (readonly [number, string])[]) => table.find(([max]) => b < max)![1];

export function bmiReport({ sex, age, heightCm, weightKg }: BmiInput) {
  const h = heightCm / 100;
  const bmi = +(weightKg / (h * h)).toFixed(1);
  const adult = age >= 18;
  // Deurenberg et al. (1991): body fat % from BMI, age and sex — a rough estimate only.
  const bodyFat = adult ? +(1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4).toFixed(1) : null;
  return {
    bmi,
    adult,
    who: cat(bmi, WHO),
    asian: cat(bmi, ASIAN),
    healthyRange: { asian: [+(18.5 * h * h).toFixed(1), +(22.9 * h * h).toFixed(1)], who: [+(18.5 * h * h).toFixed(1), +(24.9 * h * h).toFixed(1)] },
    bodyFat,
    bmr: Math.round(bmr({ sex, age, heightCm, weightKg })),
  };
}

export function bmiTone(category: string) {
  return category === "Normal" ? "good" : category === "Underweight" || category === "Overweight" ? "warn" : "bad";
}
