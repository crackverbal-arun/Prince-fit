"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, bodyStats, progressPhotos } from "@/db";
import { requireActor } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { checkPhoto, num } from "@/lib/validate";
import { MEASURES } from "@/lib/body";

const refresh = () => { revalidatePath("/me", "layout"); revalidatePath("/trainer", "layout"); };


export async function saveBodyStat(clientId: string, statId: string | null, _: unknown, formData: FormData) {
  await requireActor(clientId);
  const date = String(formData.get("date") ?? todayISO());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayISO()) return { error: "Pick today or an earlier date." };
  const row: Record<string, number | null> = {};
  for (const [k, , , lo, hi] of MEASURES) row[k] = num(formData.get(k), lo, hi);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 300) || null;
  if (Object.values(row).every((v) => v === null)) return { error: "Enter at least one measurement." };
  if (statId) await db.update(bodyStats).set({ date, ...row, notes }).where(and(eq(bodyStats.id, statId), eq(bodyStats.clientId, clientId)));
  else await db.insert(bodyStats).values({ clientId, date, ...row, notes });
  refresh();
  return { ok: statId ? "Updated" : "Saved. Keep going! 💪" };
}

export async function deleteBodyStat(clientId: string, statId: string) {
  await requireActor(clientId);
  await db.delete(bodyStats).where(and(eq(bodyStats.id, statId), eq(bodyStats.clientId, clientId)));
  refresh();
}

export async function addPhoto(clientId: string, date: string, pose: string, photo: string) {
  await requireActor(clientId);
  if (!checkPhoto(photo)) return { error: "Photo too large or not a JPEG." };
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= todayISO() ? date : todayISO();
  await db.insert(progressPhotos).values({ clientId, date: d, pose: ["front", "side", "back"].includes(pose) ? pose : "other", photo });
  refresh();
  return {};
}

export async function deletePhoto(clientId: string, id: string, legacy: boolean) {
  await requireActor(clientId);
  if (legacy) await db.update(bodyStats).set({ photo: null }).where(and(eq(bodyStats.id, id), eq(bodyStats.clientId, clientId)));
  else await db.delete(progressPhotos).where(and(eq(progressPhotos.id, id), eq(progressPhotos.clientId, clientId)));
  refresh();
}
