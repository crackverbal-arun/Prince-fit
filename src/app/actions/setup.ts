"use server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { createSchema } from "@/db/migrate";
import { createSession } from "@/lib/session";
import { normalizePhone } from "@/lib/validate";
import { isSetUp } from "@/lib/setup";

function keyMatches(given: string) {
  const want = Buffer.from(process.env.SETUP_KEY ?? "");
  const got = Buffer.from(given);
  return want.length >= 8 && want.length === got.length && timingSafeEqual(want, got);
}

export async function runSetup(_: unknown, formData: FormData): Promise<{ error?: string } | undefined> {
  if (await isSetUp()) redirect("/login");
  if (!keyMatches(String(formData.get("key") ?? ""))) return { error: "Setup key doesn't match the SETUP_KEY you set in Vercel." };
  const name = String(formData.get("name") ?? "").trim() || "Prince";
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (phone.length !== 10) return { error: "Enter a 10-digit mobile number." };
  if (password.length < 6) return { error: "Password needs at least 6 characters." };

  await createSchema();
  const [trainer] = await db.insert(users).values({ role: "trainer", name, phone, passwordHash: await bcrypt.hash(password, 10) }).returning();
  await createSession({ userId: trainer.id, role: "trainer" });
  redirect("/trainer");
}
