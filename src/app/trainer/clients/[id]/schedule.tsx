import { asc, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { addDays, todayISO } from "@/lib/dates";
import { sessionViews } from "@/lib/q-schedule";
import { AddSessionForm, SessionCard } from "@/components/schedule-ui";
import { Empty } from "@/components/ui";

export async function ScheduleTab({ clientId }: { clientId: string }) {
  const today = todayISO();
  const [upcoming, past, clients] = await Promise.all([
    sessionViews({ from: today, to: addDays(today, 120), clientId }),
    sessionViews({ from: addDays(today, -60), to: addDays(today, -1), clientId }),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "client")).orderBy(asc(users.name)),
  ]);
  const done = past.filter((s) => s.status === "completed").length, noShow = past.filter((s) => s.status === "no_show").length;
  return (
    <div className="space-y-3">
      <AddSessionForm clients={clients} date={today} fixedClientId={clientId} />
      <h2 className="h-section">Upcoming</h2>
      {upcoming.length ? <div className="space-y-2">{upcoming.slice(0, 20).map((s) => <SessionCard key={s.id} s={s} showDate />)}</div> : <Empty>No upcoming sessions.</Empty>}
      {upcoming.length > 20 && <p className="px-1 text-xs text-muted">+{upcoming.length - 20} more later.</p>}
      <h2 className="h-section">Last 60 days · {done} done{noShow ? ` · ${noShow} no-show` : ""}</h2>
      {past.length ? <div className="space-y-2">{[...past].reverse().slice(0, 15).map((s) => <SessionCard key={s.id} s={s} showDate />)}</div> : <Empty>No past sessions.</Empty>}
    </div>
  );
}
