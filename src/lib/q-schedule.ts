import "server-only";
import { addDays, todayISO } from "./dates";
import { getNotifications, getSessions } from "./q-client";
import { reminderText } from "./schedule";
import { waLink } from "./whatsapp";
import type { SessionView } from "@/components/schedule-ui";

export async function sessionViews(opts: { from: string; to: string; clientId?: string }): Promise<SessionView[]> {
  const rows = await getSessions(opts);
  const notes = await getNotifications(rows.map((r) => r.s.id));
  const today = todayISO();
  return rows.map(({ s, name, phone }) => {
    const rel = s.date === today ? "today" : s.date === addDays(today, 1) ? "tomorrow" : "coming up";
    const body = reminderText(name, s, rel);
    const sentNote = notes.find((n) => n.sessionId === s.id && n.kind === "reminder" && n.status === "sent");
    const pending = notes.find((n) => n.sessionId === s.id && n.status === "pending");
    const lastChange = notes.find((n) => n.sessionId === s.id && n.kind !== "reminder" && n.status === "sent"); // newest first
    return {
      id: s.id, clientId: s.clientId, name, date: s.date, startTime: s.startTime, durationMin: s.durationMin, title: s.title,
      status: s.status, notes: s.notes, series: !!s.seriesId,
      changeNotice: lastChange ? { kind: lastChange.kind as "rescheduled" | "cancelled", how: lastChange.channel === "whatsapp_api" ? "auto" : "by you" } : null,
      pendingNotice: pending ? { id: pending.id, kind: pending.kind as "rescheduled" | "cancelled", link: waLink(phone, pending.body), body: pending.body } : null,
      reminder: { sent: !!s.reminderSentAt, how: sentNote ? (sentNote.channel === "whatsapp_api" ? "auto" : "by you") : undefined, link: waLink(phone, body), body },
    };
  });
}
