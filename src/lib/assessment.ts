// The assessment form, defined once and used for the form, the report and the comparison.
// To add a field: add it here. Data is stored as JSON, so no database change is needed.
import { fmtDuration } from "./dates";

export type Better = "up" | "down";
export type Field = { key: string; label: string; better?: Better } & (
  | { type: "number"; unit?: string; step?: number }
  | { type: "duration" }
  | { type: "scale"; min: number; max: number }
  | { type: "choice"; options: string[] } // ordered worst → best when better = "up"
  | { type: "multi"; options: string[] }
  | { type: "text"; placeholder?: string }
  | { type: "textarea"; placeholder?: string }
  | { type: "height" } // entered as ft + in, stored as cm
);
export type Section = { id: string; title: string; fields: Field[] };
export type AssessmentData = Record<string, number | string | string[]>;

const RATING = ["Poor", "Fair", "Good", "Very good"];
const pain = (key: string, label: string): Field => ({ key, label, type: "scale", min: 0, max: 10, better: "down" });

export const SECTIONS: Section[] = [
  { id: "personal", title: "Personal information", fields: [
    { key: "age", label: "Age", type: "number", unit: "yrs" },
    { key: "gender", label: "Gender", type: "choice", options: ["Male", "Female", "Other"] },
    { key: "occupation", label: "Occupation", type: "text", placeholder: "e.g. IT job, mostly sitting" },
    { key: "emergencyContact", label: "Emergency contact", type: "text", placeholder: "Name and number" },
  ] },
  { id: "pain", title: "Pain (0 = none, 10 = worst)", fields: [
    pain("painBack", "Lower back"), pain("painShoulder", "Shoulder"), pain("painHip", "Hip"), pain("painKnee", "Knee"), pain("painAnkle", "Ankle"),
    { key: "painNotes", label: "Pain notes", type: "text", placeholder: "Which side, when it hurts" },
  ] },
  { id: "body", title: "Body composition", fields: [
    { key: "weight", label: "Weight", type: "number", unit: "kg", step: 0.1 },
    { key: "height", label: "Height", type: "height" },
    { key: "waist", label: "Waist", type: "number", unit: "cm", step: 0.5 },
    { key: "bodyFat", label: "Body fat (if measured)", type: "number", unit: "%", step: 0.1, better: "down" },
  ] },
  { id: "posture", title: "Posture (front view)", fields: [
    { key: "postureHead", label: "Head position", type: "text", placeholder: "e.g. forward head" },
    { key: "postureShoulder", label: "Shoulder alignment", type: "text", placeholder: "e.g. right shoulder high" },
    { key: "postureHip", label: "Hip alignment", type: "text" },
    { key: "postureKnee", label: "Knee position", type: "text", placeholder: "e.g. right knee caves in" },
  ] },
  { id: "mobility", title: "Mobility", fields: [
    { key: "overheadSquat", label: "Overhead squat", type: "choice", options: RATING, better: "up" },
    { key: "shoulderMobility", label: "Shoulder mobility", type: "choice", options: RATING, better: "up" },
    { key: "hipMobility", label: "Hip mobility", type: "choice", options: RATING, better: "up" },
    { key: "thoracicMobility", label: "Thoracic mobility", type: "choice", options: RATING, better: "up" },
    { key: "mobilityNotes", label: "Mobility notes", type: "text", placeholder: "e.g. upper back pain on rotation" },
  ] },
  { id: "flexibility", title: "Flexibility", fields: [
    { key: "sitReach", label: "Sit and reach", type: "choice", options: RATING, better: "up" },
    { key: "mountainPose", label: "Mountain pose", type: "choice", options: RATING, better: "up" },
    { key: "cobraStretch", label: "Cobra stretch", type: "choice", options: RATING, better: "up" },
  ] },
  { id: "strength", title: "Strength", fields: [
    { key: "pushups30s", label: "Push-ups in 30 sec", type: "number", unit: "reps", better: "up" },
    { key: "pullups", label: "Pull-ups / assisted", type: "number", unit: "reps", better: "up" },
    { key: "latPulldownKg", label: "Lat pulldown weight", type: "number", unit: "kg", step: 0.5, better: "up" },
    { key: "latPulldownReps", label: "Lat pulldown reps", type: "number", unit: "reps", better: "up" },
    { key: "squats1min", label: "Bodyweight squats in 1 min", type: "number", unit: "reps", better: "up" },
    { key: "plank", label: "Plank hold", type: "duration", better: "up" },
  ] },
  { id: "cardio", title: "Cardiovascular", fields: [
    { key: "restingHr", label: "Resting heart rate", type: "number", unit: "bpm", better: "down" },
    { key: "bloodPressure", label: "Blood pressure", type: "text", placeholder: "e.g. 120/80" },
    { key: "hr3min", label: "HR after 3 min cardio", type: "number", unit: "bpm", better: "down" },
    { key: "hr11min", label: "HR after 11 min cardio", type: "number", unit: "bpm", better: "down" },
    { key: "hrFinish", label: "Finish HR", type: "number", unit: "bpm", better: "down" },
    { key: "cooperTime", label: "Cooper test time", type: "duration" },
    { key: "cooperSpeed", label: "Cooper speed", type: "number", unit: "km/h", step: 0.1, better: "up" },
    { key: "cooperDistance", label: "Cooper distance", type: "number", unit: "km", step: 0.01, better: "up" },
  ] },
  { id: "balance", title: "Balance", fields: [
    { key: "balanceRight", label: "Single-leg hold, right", type: "duration", better: "up" },
    { key: "balanceLeft", label: "Single-leg hold, left", type: "duration", better: "up" },
  ] },
  { id: "lifestyle", title: "Lifestyle", fields: [
    { key: "sleepHours", label: "Sleep per night", type: "number", unit: "hrs", step: 0.5, better: "up" },
    { key: "sleepQuality", label: "Sleep quality (1–10)", type: "scale", min: 1, max: 10, better: "up" },
    { key: "stress", label: "Stress (1–10)", type: "scale", min: 1, max: 10, better: "down" },
    { key: "water", label: "Water per day", type: "number", unit: "L", step: 0.25, better: "up" },
    { key: "steps", label: "Daily steps", type: "number", unit: "steps", step: 500, better: "up" },
    { key: "jobType", label: "Job type", type: "multi", options: ["Sitting", "Standing", "Physical"] },
  ] },
  { id: "nutrition", title: "Nutrition", fields: [
    { key: "mealsPerDay", label: "Meals per day", type: "number" },
    { key: "protein", label: "Protein per day", type: "number", unit: "g", step: 5, better: "up" },
    { key: "dietType", label: "Diet", type: "choice", options: ["Vegetarian", "Eggetarian", "Non-veg", "Vegan"] },
  ] },
  { id: "goals", title: "Goals", fields: [
    { key: "goals", label: "Primary goals", type: "multi", options: ["Fat loss", "Muscle gain", "Strength", "Sports performance", "Rehabilitation"] },
    { key: "targetWeight", label: "Target weight", type: "number", unit: "kg", step: 0.5 },
    { key: "targetWaist", label: "Target waist", type: "number", unit: "cm", step: 0.5 },
    { key: "targetDate", label: "Target date", type: "text", placeholder: "e.g. Jan 2027" },
  ] },
  { id: "report", title: "Trainer report", fields: [
    { key: "postureIssues", label: "Posture issues", type: "textarea" },
    { key: "mobilityRestrictions", label: "Mobility restrictions", type: "textarea" },
    { key: "weakMuscles", label: "Weak muscle groups", type: "textarea" },
    { key: "tightMuscles", label: "Tight muscle groups", type: "textarea" },
    { key: "injuryRisks", label: "Injury risks", type: "textarea" },
    { key: "priority1", label: "Training priority 1", type: "text" },
    { key: "priority2", label: "Training priority 2", type: "text" },
    { key: "priority3", label: "Training priority 3", type: "text" },
    { key: "priority4", label: "Training priority 4", type: "text" },
    { key: "program", label: "Recommended program", type: "multi", options: ["Corrective exercises", "Strength training", "Cardio", "Mobility work", "Nutrition guidance"] },
    { key: "programNotes", label: "Program notes", type: "textarea" },
  ] },
];

export const FIELDS = SECTIONS.flatMap((s) => s.fields);

// Carried forward into a new review (they rarely change); everything else is re-measured.
export const CARRY_FORWARD = ["gender", "occupation", "emergencyContact", "jobType", "dietType", "goals", "targetWeight", "targetWaist", "targetDate"];

export const REVIEW_EVERY_DAYS = 90;

export function cmToFtIn(cm: number) {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 };
}

export function fmtValue(f: Field, v: AssessmentData[string] | undefined): string {
  if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (f.type === "duration") return fmtDuration(Number(v));
  if (f.type === "height") { const h = cmToFtIn(Number(v)); return `${h.ft}'${h.in}" · ${v} cm`; }
  if (f.type === "scale") return `${v}/${f.max}`;
  if (f.type === "number") return `${Number(v).toLocaleString("en-IN")}${f.unit ? ` ${f.unit}` : ""}`;
  return String(v);
}

// Numeric position used for comparisons (ratings become 0..n).
export function comparable(f: Field, v: AssessmentData[string] | undefined): number | null {
  if (v === undefined || v === "" || Array.isArray(v)) return null;
  if (f.type === "choice") { const i = f.options.indexOf(String(v)); return i < 0 ? null : i; }
  if (f.type === "number" || f.type === "duration" || f.type === "scale" || f.type === "height") return Number(v);
  return null;
}

export function bmi(d: AssessmentData) {
  const w = Number(d.weight), h = Number(d.height) / 100;
  return w && h ? +(w / (h * h)).toFixed(1) : null;
}

// Plain warnings Prince should not miss before programming intense work.
export function healthFlags(d: AssessmentData): string[] {
  const out: string[] = [];
  const age = Number(d.age) || null;
  const rhr = Number(d.restingHr);
  if (rhr > 100) out.push(`Resting heart rate ${rhr} bpm is above the normal 60–100 range. Re-check it seated after 5 min rest; if it stays high, get a doctor's clearance before hard cardio.`);
  const bp = String(d.bloodPressure ?? "").match(/(\d{2,3})(?:\s*\/\s*(\d{2,3}))?/);
  if (bp && (Number(bp[1]) >= 140 || Number(bp[2] ?? 0) >= 90)) out.push(`Blood pressure ${d.bloodPressure} is in the high range. Get medical clearance before heavy lifting or intense cardio.`);
  const peak = Math.max(Number(d.hrFinish) || 0, Number(d.hr11min) || 0);
  if (age && peak > 220 - age) out.push(`Peak heart rate ${peak} bpm is above the age-estimated max (${220 - age}). Keep cardio at a talk-test pace for now.`);
  for (const f of SECTIONS.find((s) => s.id === "pain")!.fields) {
    if (f.type === "scale" && Number(d[f.key]) >= 6) out.push(`${f.label} pain ${d[f.key]}/10. Avoid loading it and consider a physio review.`);
  }
  return out;
}
