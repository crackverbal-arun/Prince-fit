import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const users = sqliteTable("users", {
  id: id(),
  role: text("role", { enum: ["trainer", "client"] }).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  goal: text("goal"),
  trainerNote: text("trainer_note"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // Daily nutrition/water targets Prince set by hand; null = calculated from assessment + weight
  targets: text("targets", { mode: "json" }).$type<Partial<Record<string, number>>>(),
  // Per-client assessment form (sections + fields); null = the default template
  assessmentTemplate: text("assessment_template", { mode: "json" }).$type<unknown>(),
  createdAt: createdAt(),
});

// App-wide settings, e.g. the default assessment template.
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
});

// A paid block of sessions, e.g. "24 sessions / 3 months"
export const packages = sqliteTable("packages", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalSessions: integer("total_sessions").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),
  amount: integer("amount").notNull(), // rupees
  paid: integer("paid").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("packages_client_idx").on(t.clientId)]);

export const attendance = sqliteTable("attendance", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  markedBy: text("marked_by", { enum: ["client", "trainer"] }).notNull(),
  status: text("status", { enum: ["present", "absent"] }).notNull().default("present"),
  reason: text("reason"), // why they were absent
  createdAt: createdAt(),
}, (t) => [uniqueIndex("attendance_client_date").on(t.clientId, t.date)]);

// Weekly template Prince assigns: dayOfWeek 0=Sun..6=Sat
export const workoutPlan = sqliteTable("workout_plan", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  exercise: text("exercise").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(), // "8-10", "12" (unused for timed exercises)
  metric: text("metric", { enum: ["weight", "time", "cardio"] }).notNull().default("weight"),
  targetKg: real("target_kg"),
  targetSec: integer("target_sec"), // timed (plank) or cardio duration
  targetKm: real("target_km"), // cardio distance
  position: integer("position").notNull().default(0),
}, (t) => [index("workout_plan_client_idx").on(t.clientId, t.dayOfWeek)]);

export type SetEntry = { reps?: number; kg?: number; sec?: number };

// What was actually done: one row per exercise per day. Per-set detail lives in `setsDetail`;
// sets/reps/weightKg/durationSec hold the top set so older screens keep working.
export const workoutLogs = sqliteTable("workout_logs", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  exercise: text("exercise").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull().default(0),
  durationSec: integer("duration_sec"), // timed exercises and cardio
  kind: text("kind", { enum: ["weight", "time", "cardio"] }),
  setsDetail: text("sets_detail", { mode: "json" }).$type<SetEntry[]>(),
  distanceKm: real("distance_km"),
  calories: integer("calories"),
  avgHr: integer("avg_hr"),
  notes: text("notes"),
  loggedBy: text("logged_by", { enum: ["client", "trainer"] }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("workout_logs_unique").on(t.clientId, t.date, t.exercise)]);

export const mealPlan = sqliteTable("meal_plan", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slot: text("slot").notNull(), // Breakfast, Lunch...
  description: text("description").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [index("meal_plan_client_idx").on(t.clientId)]);

export const mealLogs = sqliteTable("meal_logs", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealPlanId: text("meal_plan_id").notNull().references(() => mealPlan.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  photo: text("photo"), // compressed JPEG data URL
  createdAt: createdAt(),
}, (t) => [uniqueIndex("meal_logs_unique").on(t.clientId, t.mealPlanId, t.date)]);

export const bodyStats = sqliteTable("body_stats", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  weightKg: real("weight_kg"),
  waistCm: real("waist_cm"),
  chestCm: real("chest_cm"),
  armCm: real("arm_cm"),
  hipsCm: real("hips_cm"),
  thighCm: real("thigh_cm"),
  calfCm: real("calf_cm"),
  neckCm: real("neck_cm"),
  bodyFat: real("body_fat"),
  notes: text("notes"),
  photo: text("photo"), // legacy single photo; new photos go to progress_photos
  createdAt: createdAt(),
}, (t) => [index("body_stats_client_idx").on(t.clientId, t.date)]);

// Baseline + 3-monthly reviews. Field definitions live in src/lib/assessment.ts.
export const assessments = sqliteTable("assessments", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  kind: text("kind", { enum: ["baseline", "review"] }).notNull(),
  data: text("data", { mode: "json" }).$type<Record<string, number | string | string[]>>().notNull(),
  // The form as it was when this assessment was taken, so later template edits don't rewrite history.
  fields: text("fields", { mode: "json" }).$type<unknown>(),
  createdAt: createdAt(),
}, (t) => [index("assessments_client_idx").on(t.clientId, t.date)]);

export const progressPhotos = sqliteTable("progress_photos", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  pose: text("pose").notNull().default("front"), // front | side | back | other
  photo: text("photo").notNull(),
  createdAt: createdAt(),
}, (t) => [index("progress_photos_client_idx").on(t.clientId, t.date)]);

export const waterLogs = sqliteTable("water_logs", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  ml: integer("ml").notNull(),
  createdAt: createdAt(),
}, (t) => [index("water_logs_client_idx").on(t.clientId, t.date)]);

export type Nutrients = Partial<Record<string, number>>;

// Food database. Nutrients are per 100 g (or per 100 ml).
export const foods = sqliteTable("foods", {
  id: id(),
  name: text("name").notNull(),
  servingLabel: text("serving_label").notNull(), // "1 katori", "1 roti"
  servingG: real("serving_g").notNull(),
  per100: text("per100", { mode: "json" }).$type<Nutrients>().notNull(),
  builtIn: integer("built_in", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

// What a client ate. Nutrients are stored as eaten (already scaled), so editing the food later
// doesn't change past days.
export const foodLogs = sqliteTable("food_logs", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  meal: text("meal").notNull(), // Breakfast, Lunch, Snacks, Dinner
  foodId: text("food_id").references(() => foods.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  grams: real("grams"),
  servings: real("servings"),
  nutrients: text("nutrients", { mode: "json" }).$type<Nutrients>().notNull(),
  loggedBy: text("logged_by", { enum: ["client", "trainer"] }).notNull().default("client"),
  createdAt: createdAt(),
}, (t) => [index("food_logs_client_idx").on(t.clientId, t.date)]);

// Scheduled training sessions / classes. A group class = several rows at the same time.
export const sessions = sqliteTable("sessions", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(), // "07:30" IST
  durationMin: integer("duration_min").notNull().default(60),
  title: text("title"), // e.g. "Strength", "HIIT class"
  status: text("status", { enum: ["scheduled", "completed", "cancelled", "no_show"] }).notNull().default("scheduled"),
  notes: text("notes"),
  seriesId: text("series_id"),
  reminderSentAt: integer("reminder_sent_at", { mode: "timestamp" }),
  createdAt: createdAt(),
}, (t) => [index("sessions_date_idx").on(t.date, t.startTime), index("sessions_client_idx").on(t.clientId, t.date)]);

// Every reminder / change notice, whether sent by the WhatsApp API or by Prince tapping a link.
export const notifications = sqliteTable("notifications", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => sessions.id, { onDelete: "set null" }),
  kind: text("kind", { enum: ["reminder", "rescheduled", "cancelled", "other"] }).notNull(),
  channel: text("channel", { enum: ["whatsapp_api", "whatsapp_link"] }).notNull(),
  status: text("status", { enum: ["sent", "failed", "pending"] }).notNull(), // pending = waiting for Prince to tap the WhatsApp link
  body: text("body").notNull(),
  error: text("error"),
  createdAt: createdAt(),
}, (t) => [index("notifications_session_idx").on(t.sessionId)]);

export type Session = typeof sessions.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type BodyStat = typeof bodyStats.$inferSelect;

export type Assessment = typeof assessments.$inferSelect;
export type User = typeof users.$inferSelect;
export type Package = typeof packages.$inferSelect;
