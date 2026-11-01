import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, notifications, sessions, users, type Session } from "@/db";
import { addDays, todayISO } from "./dates";
import { fmtTime, longDate, reminderText } from "./schedule";
import { TEMPLATES, sendTemplate, whatsappConfigured } from "./whatsapp-api";

type Target = { s: Session; name: string; phone: string };

export async function dueReminders(day: "tomorrow" | "today"): Promise<Target[]> {
  const date = day === "today" ? todayISO() : addDays(todayISO(), 1);
  return db.select({ s: sessions, name: users.name, phone: users.phone }).from(sessions).innerJoin(users, eq(users.id, sessions.clientId))
    .where(and(eq(sessions.date, date), eq(sessions.status, "scheduled"), isNull(sessions.reminderSentAt), eq(users.active, true)));
}

/** Send reminders through the WhatsApp API and log each one. Safe to run repeatedly: sent sessions are skipped. */
export async function sendReminders(targets: Target[], relative: string) {
  const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };
  if (!whatsappConfigured()) { results.skipped = targets.length; return results; }
  for (const t of targets) {
    const body = reminderText(t.name, t.s, relative);
    const r = await sendTemplate(t.phone, TEMPLATES.reminder(), [t.name.split(" ")[0], `${relative} (${longDate(t.s.date)})`, fmtTime(t.s.startTime)]);
    await db.insert(notifications).values({ clientId: t.s.clientId, sessionId: t.s.id, kind: "reminder", channel: "whatsapp_api", status: r.ok ? "sent" : "failed", body, error: r.ok ? null : r.error });
    if (r.ok) { results.sent++; await db.update(sessions).set({ reminderSentAt: new Date() }).where(eq(sessions.id, t.s.id)); }
    else { results.failed++; results.errors.push(`${t.name}: ${r.error}`); }
  }
  return results;
}
