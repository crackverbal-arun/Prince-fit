"use server";
import { and, eq, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, attendance, notifications, sessions, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { addDays, dayOfWeek, todayISO } from "@/lib/dates";
import { num } from "@/lib/validate";
import { cancelText, fmtTime, isTime, longDate, rescheduleText } from "@/lib/schedule";
import { TEMPLATES, sendTemplate, whatsappConfigured } from "@/lib/whatsapp-api";
import { waLink } from "@/lib/whatsapp";
import { dueReminders, sendReminders } from "@/lib/reminders";

const refresh = () => { revalidatePath("/trainer", "layout"); revalidatePath("/me", "layout"); };
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export type ScheduleResult = { error?: string; ok?: string; notify?: { name: string; link: string; sent?: boolean; error?: string }[] };

/** Add one session, a group class (several clients, same slot) or a weekly repeating series. */
export async function createSessions(_: unknown, formData: FormData): Promise<ScheduleResult> {
  await requireTrainer();
  const clientIds = formData.getAll("clientId").map(String).filter(Boolean);
  const date = String(formData.get("date") ?? ""), time = String(formData.get("time") ?? "");
  const duration = num(formData.get("duration"), 15, 240) ?? 60;
  const title = String(formData.get("title") ?? "").trim().slice(0, 40) || null;
  const weeks = num(formData.get("weeks"), 1, 26) ?? 1;
  const days = formData.getAll("repeatDay").map(Number).filter((d) => d >= 0 && d <= 6);
  if (!clientIds.length) return { error: "Pick at least one client." };
  if (!isDate(date) || !isTime(time)) return { error: "Pick a date and a start time." };
  const valid = await db.select({ id: users.id }).from(users).where(and(inArray(users.id, clientIds), eq(users.role, "client")));
  if (valid.length !== clientIds.length) return { error: "Unknown client." };

  // Dates: the chosen date, plus (if repeating) every selected weekday for N weeks.
  const dates = new Set([date]);
  if (days.length && weeks > 1) {
    for (let d = date; d < addDays(date, weeks * 7); d = addDays(d, 1)) if (days.includes(dayOfWeek(d))) dates.add(d);
  }
  const seriesId = dates.size > 1 ? crypto.randomUUID() : null;
  const rows = [...dates].sort().flatMap((d) => clientIds.map((clientId) => ({ clientId, date: d, startTime: time, durationMin: duration, title, seriesId })));
  await db.insert(sessions).values(rows);
  refresh();
  return { ok: `Scheduled ${rows.length} session${rows.length === 1 ? "" : "s"}` };
}

/** Tell the client about a change: automatically if the WhatsApp API is set up, else hand Prince a ready link. */
async function notify(clientId: string, sessionId: string, kind: "rescheduled" | "cancelled", body: string) {
  const c = await db.query.users.findFirst({ where: eq(users.id, clientId) });
  if (!c) return [];
  const link = waLink(c.phone, body);
  if (whatsappConfigured()) {
    const r = await sendTemplate(c.phone, TEMPLATES.update(), [c.name.split(" ")[0], body.replace(/^Hi [^,]+, /, "")]);
    await db.insert(notifications).values({ clientId, sessionId, kind, channel: "whatsapp_api", status: r.ok ? "sent" : "failed", body, error: r.ok ? null : r.error });
    if (r.ok) return [{ name: c.name, link, sent: true }];
  }
  // Not sent automatically: keep it as a pending notice so the button survives reloads until Prince taps it.
  await db.insert(notifications).values({ clientId, sessionId, kind, channel: "whatsapp_link", status: "pending", body });
  return [{ name: c.name, link }];
}

/** Dismiss a pending change notice without sending (e.g. Prince told the client in person). */
export async function dismissNotice(sessionId: string, noticeId: string) {
  await requireTrainer();
  await db.delete(notifications).where(and(eq(notifications.id, noticeId), eq(notifications.sessionId, sessionId), eq(notifications.status, "pending")));
  refresh();
}

export async function rescheduleSession(sessionId: string, _: unknown, formData: FormData): Promise<ScheduleResult> {
  await requireTrainer();
  const s = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!s) return { error: "Session not found." };
  const date = String(formData.get("date") ?? ""), time = String(formData.get("time") ?? "");
  const duration = num(formData.get("duration"), 15, 240) ?? s.durationMin;
  if (!isDate(date) || !isTime(time)) return { error: "Pick a date and time." };
  const changed = date !== s.date || time !== s.startTime;
  await db.update(sessions).set({ date, startTime: time, durationMin: duration, status: "scheduled", reminderSentAt: changed ? null : s.reminderSentAt }).where(eq(sessions.id, sessionId));
  refresh();
  if (!changed || formData.get("notify") !== "on") return { ok: "Updated" };
  const c = await db.query.users.findFirst({ where: eq(users.id, s.clientId) });
  return { ok: "Rescheduled", notify: await notify(s.clientId, s.id, "rescheduled", rescheduleText(c!.name, s, { ...s, date, startTime: time })) };
}

export async function cancelSession(sessionId: string, _: unknown, formData: FormData): Promise<ScheduleResult> {
  await requireTrainer();
  const s = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!s) return { error: "Session not found." };
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 80) || null;
  const scope = formData.get("scope") === "series" && s.seriesId ? "series" : "one";
  const affected = scope === "series"
    ? await db.select().from(sessions).where(and(eq(sessions.seriesId, s.seriesId!), gte(sessions.date, s.date), eq(sessions.status, "scheduled")))
    : [s];
  await db.update(sessions).set({ status: "cancelled", notes: reason }).where(inArray(sessions.id, affected.map((a) => a.id)));
  refresh();
  if (formData.get("notify") !== "on") return { ok: `Cancelled ${affected.length}` };
  const c = await db.query.users.findFirst({ where: eq(users.id, s.clientId) });
  const body = scope === "series"
    ? `Hi ${c!.name.split(" ")[0]}, your regular ${s.title ?? "training"} sessions at ${fmtTime(s.startTime)} from ${longDate(s.date)} onwards are cancelled${reason ? ` (${reason})` : ""}. Let's talk about a new slot. — Prince`
    : cancelText(c!.name, s, reason);
  return { ok: `Cancelled ${affected.length}`, notify: await notify(s.clientId, s.id, "cancelled", body) };
}

/** Done / no-show feed straight into attendance. */
export async function setSessionStatus(sessionId: string, status: "scheduled" | "completed" | "no_show") {
  await requireTrainer();
  const s = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!s) return;
  await db.update(sessions).set({ status }).where(eq(sessions.id, sessionId));
  if (status !== "scheduled" && s.date <= todayISO()) {
    const v = status === "completed" ? { status: "present" as const, reason: null } : { status: "absent" as const, reason: "No-show" };
    await db.insert(attendance).values({ clientId: s.clientId, date: s.date, markedBy: "trainer", ...v })
      .onConflictDoUpdate({ target: [attendance.clientId, attendance.date], set: { ...v, markedBy: "trainer" } });
  }
  refresh();
}

export async function deleteSession(sessionId: string, scope: "one" | "series") {
  await requireTrainer();
  const s = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!s) return;
  if (scope === "series" && s.seriesId) await db.delete(sessions).where(and(eq(sessions.seriesId, s.seriesId), gte(sessions.date, s.date)));
  else await db.delete(sessions).where(eq(sessions.id, sessionId));
  refresh();
}

/** Prince tapped a WhatsApp link himself: log it (or close the pending notice) and mark reminders done. */
export async function logManualMessage(sessionId: string, kind: "reminder" | "rescheduled" | "cancelled", body: string, noticeId?: string) {
  await requireTrainer();
  const s = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!s) return;
  if (noticeId) await db.update(notifications).set({ status: "sent", channel: "whatsapp_link" }).where(and(eq(notifications.id, noticeId), eq(notifications.sessionId, sessionId)));
  else await db.insert(notifications).values({ clientId: s.clientId, sessionId, kind, channel: "whatsapp_link", status: "sent", body: body.slice(0, 1000) });
  if (kind === "reminder") await db.update(sessions).set({ reminderSentAt: new Date() }).where(eq(sessions.id, sessionId));
  refresh();
}

/** "Send all now" for tomorrow's reminders through the API. */
export async function sendTomorrowReminders(): Promise<ScheduleResult> {
  await requireTrainer();
  if (!whatsappConfigured()) return { error: "Automatic WhatsApp isn't set up yet. Use the green buttons instead." };
  const r = await sendReminders(await dueReminders("tomorrow"), "tomorrow");
  refresh();
  return r.failed ? { error: `${r.sent} sent, ${r.failed} failed: ${r.errors[0]}` } : { ok: `${r.sent} reminder${r.sent === 1 ? "" : "s"} sent` };
}
