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
  createdAt: createdAt(),
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
  metric: text("metric", { enum: ["weight", "time"] }).notNull().default("weight"),
  targetKg: real("target_kg"),
  targetSec: integer("target_sec"), // timed exercises: plank, treadmill
  position: integer("position").notNull().default(0),
}, (t) => [index("workout_plan_client_idx").on(t.clientId, t.dayOfWeek)]);

// What the client actually lifted (one row per exercise per day)
export const workoutLogs = sqliteTable("workout_logs", {
  id: id(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  exercise: text("exercise").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull().default(0),
  durationSec: integer("duration_sec"), // set for timed exercises
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
  photo: text("photo"),
  createdAt: createdAt(),
}, (t) => [index("body_stats_client_idx").on(t.clientId, t.date)]);

export type User = typeof users.$inferSelect;
export type Package = typeof packages.$inferSelect;
