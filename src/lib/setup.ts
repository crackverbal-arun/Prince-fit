import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Set up = the users table exists and has a trainer in it.
export async function isSetUp() {
  const t = await db.all<{ n: number }>(sql`select count(*) as n from sqlite_master where type = 'table' and name = 'users'`);
  if (!t[0]?.n) return false;
  const r = await db.all<{ n: number }>(sql`select count(*) as n from users where role = 'trainer'`);
  return (r[0]?.n ?? 0) > 0;
}

export function missingEnv() {
  return ["DATABASE_URL", "SESSION_SECRET", "SETUP_KEY"].filter((k) => !process.env[k]);
}
