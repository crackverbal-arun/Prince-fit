"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { createSession, deleteSession } from "@/lib/session";
import { getUser } from "@/lib/dal";
import { normalizePhone } from "@/lib/validate";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const user = await db.query.users.findFirst({ where: eq(users.phone, phone) });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Wrong phone number or password." };
  }
  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "trainer" ? "/trainer" : "/me");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 6) return { error: "New password needs at least 6 characters." };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is wrong." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(users.id, user.id));
  return { ok: "Password updated." };
}
