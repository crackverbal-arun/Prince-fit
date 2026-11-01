import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { addDays, dayOfWeek, DAYS, fmtDate, todayISO } from "@/lib/dates";
import { sessionViews } from "@/lib/q-schedule";
import { whatsappConfigured } from "@/lib/whatsapp-api";
import { fmtTime } from "@/lib/schedule";
import { AddSessionForm, SendAllReminders, SessionCard } from "@/components/schedule-ui";
import { Empty } from "@/components/ui";
import { IconBack, IconChevron } from "@/components/icons";

export default async function SchedulePage(props: PageProps<"/trainer/schedule">) {
  await requireTrainer();
  const sp = await props.searchParams;
  const today = todayISO();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(sp.date ?? "")) ? String(sp.date) : today;
  const monday = addDays(date, -((dayOfWeek(date) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const [all, clients] = await Promise.all([
    sessionViews({ from: monday, to: addDays(monday, 6) }),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "client")).orderBy(asc(users.name)),
  ]);
  const tomorrow = addDays(today, 1);
  const tomorrowList = (await sessionViews({ from: tomorrow, to: tomorrow })).filter((s) => s.status === "scheduled");
  const pendingReminders = tomorrowList.filter((s) => !s.reminder.sent);
  const day = all.filter((s) => s.date === date);
  const slots = Map.groupBy(day, (s) => s.startTime);
  const auto = whatsappConfigured();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        {date !== today && <Link href="/trainer/schedule" className="btn-ghost btn-sm">Today</Link>}
      </div>

      <div className="mb-3 flex items-center gap-1">
        <Link href={`?date=${addDays(monday, -7)}`} replace aria-label="Previous week" className="grid size-9 shrink-0 place-items-center text-muted"><IconBack className="size-4" /></Link>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {week.map((d) => {
            const n = all.filter((s) => s.date === d && s.status !== "cancelled").length;
            return (
              <Link key={d} href={`?date=${d}`} replace scroll={false} className={`rounded-xl py-2 text-center ring-1 ${d === date ? "bg-ink text-white ring-ink" : d === today ? "bg-volt/40 ring-lime-300" : "bg-surface ring-line"}`}>
                <div className="text-[10px] opacity-70">{DAYS[dayOfWeek(d)].slice(0, 2)}</div>
                <div className="text-sm font-bold">{Number(d.slice(8))}</div>
                <div className={`mx-auto mt-0.5 h-1.5 w-1.5 rounded-full ${n ? (d === date ? "bg-volt" : "bg-ink") : "bg-transparent"}`} />
              </Link>
            );
          })}
        </div>
        <Link href={`?date=${addDays(monday, 7)}`} replace aria-label="Next week" className="grid size-9 shrink-0 place-items-center text-muted"><IconChevron className="size-4" /></Link>
      </div>

      {(pendingReminders.length > 0 || tomorrowList.length > 0) && date <= tomorrow && (
        <div className="card mb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Tomorrow: {tomorrowList.length} session{tomorrowList.length === 1 ? "" : "s"}</div>
              <div className="text-xs text-muted">
                {pendingReminders.length ? `${pendingReminders.length} reminder${pendingReminders.length === 1 ? "" : "s"} not sent yet. ` : "All reminders sent ✓ "}
                {auto ? "Auto-sends at 7 PM." : "Tap the green buttons to send."}
              </div>
            </div>
            {auto && pendingReminders.length > 0 && <div className="w-28 shrink-0"><SendAllReminders /></div>}
          </div>
          {date !== tomorrow && <Link href={`?date=${tomorrow}`} className="mt-2 block text-xs font-semibold underline underline-offset-2">See tomorrow →</Link>}
        </div>
      )}

      <h2 className="h-section !mt-2">{date === today ? "Today" : date === tomorrow ? "Tomorrow" : fmtDate(date)} · {day.filter((s) => s.status !== "cancelled").length} session{day.length === 1 ? "" : "s"}</h2>
      {day.length ? (
        <div className="space-y-3">
          {[...slots].map(([time, list]) => (
            <div key={time} className="space-y-2">
              {list.length > 1 && <div className="px-1 text-xs font-semibold text-muted">{fmtTime(time)} · group of {list.length}</div>}
              {list.map((s) => <SessionCard key={s.id} s={s} />)}
            </div>
          ))}
        </div>
      ) : <Empty>No sessions on this day.</Empty>}

      <div className="mt-4"><AddSessionForm clients={clients} date={date} /></div>
    </>
  );
}
