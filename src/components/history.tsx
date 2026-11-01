import Link from "next/link";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, attendance, sessions, workoutLogs } from "@/db";
import { addDays, fmtDate, todayISO } from "@/lib/dates";
import { logSummary } from "@/lib/format";
import { metrics } from "@/lib/workout";
import { Chip, Empty } from "./ui";
import { IconBack, IconChevron } from "./icons";

const monthName = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const shiftMonth = (m: string, n: number) => { const d = new Date(m + "-01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
const weekday = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });

/** Month-by-month record of attendance, scheduled sessions and every workout logged. */
export async function History({ clientId, month, monthHref, editHref }: { clientId: string; month: string; monthHref: (m: string) => string; editHref?: (date: string) => string }) {
  const from = month + "-01", to = addDays(shiftMonth(month, 1) + "-01", -1);
  const [att, logs, sess] = await Promise.all([
    db.select().from(attendance).where(and(eq(attendance.clientId, clientId), gte(attendance.date, from), lte(attendance.date, to))),
    db.select().from(workoutLogs).where(and(eq(workoutLogs.clientId, clientId), gte(workoutLogs.date, from), lte(workoutLogs.date, to))).orderBy(asc(workoutLogs.createdAt)),
    db.select().from(sessions).where(and(eq(sessions.clientId, clientId), gte(sessions.date, from), lte(sessions.date, to))),
  ]);
  const dates = [...new Set([...att.map((a) => a.date), ...logs.map((l) => l.date), ...sess.map((s) => s.date)])].sort().reverse();
  const present = att.filter((a) => a.status === "present").length, absent = att.filter((a) => a.status === "absent").length;
  const volume = logs.reduce((s, l) => s + ((metrics(l).volume as number | undefined) ?? 0), 0);
  const isCurrent = month >= todayISO().slice(0, 7);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Link href={monthHref(shiftMonth(month, -1))} replace scroll={false} className="btn-ghost btn-sm" aria-label="Previous month"><IconBack className="size-4" /></Link>
        <span className="font-semibold">{monthName(month)}</span>
        {isCurrent ? <span className="w-9" /> : <Link href={monthHref(shiftMonth(month, 1))} replace scroll={false} className="btn-ghost btn-sm" aria-label="Next month"><IconChevron className="size-4" /></Link>}
      </div>
      <div className="card grid grid-cols-4 gap-1 text-center text-xs">
        <div><div className="text-lg font-bold">{present}</div><div className="text-muted">present</div></div>
        <div><div className={`text-lg font-bold ${absent ? "text-bad" : ""}`}>{absent}</div><div className="text-muted">absent</div></div>
        <div><div className="text-lg font-bold">{new Set(logs.map((l) => l.date)).size}</div><div className="text-muted">workouts</div></div>
        <div><div className="text-lg font-bold">{Math.round(volume / 1000)}t</div><div className="text-muted">lifted</div></div>
      </div>
      {!dates.length ? <Empty>Nothing recorded in {monthName(month)}.</Empty> : (
        <div className="card divide-y divide-line p-0">
          {dates.map((d) => {
            const a = att.find((x) => x.date === d), dayLogs = logs.filter((l) => l.date === d), daySess = sess.filter((s) => s.date === d);
            return (
              <div key={d} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm font-semibold">{weekday(d)} {fmtDate(d)}</span>
                  <div className="flex flex-1 flex-wrap gap-1">
                    {a?.status === "present" && <Chip tone="good">Present</Chip>}
                    {a?.status === "absent" && <Chip tone="bad">Absent{a.reason ? ` · ${a.reason}` : ""}</Chip>}
                    {!a && d <= todayISO() && <Chip>Not marked</Chip>}
                    {daySess.map((s) => <Chip key={s.id} tone={s.status === "cancelled" ? "neutral" : s.status === "no_show" ? "bad" : "volt"}>{s.startTime} {s.status === "scheduled" ? "session" : s.status.replace("_", "-")}</Chip>)}
                  </div>
                  {editHref && d <= todayISO() && <Link href={editHref(d)} className="text-xs font-semibold text-muted underline underline-offset-2">{dayLogs.length ? "Edit" : "Log"}</Link>}
                </div>
                {dayLogs.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 pl-1 text-sm">
                    {dayLogs.map((l) => <li key={l.id} className="flex justify-between gap-2"><span className="truncate">{l.exercise}</span><span className="shrink-0 text-right text-xs text-muted">{logSummary(l)}</span></li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
