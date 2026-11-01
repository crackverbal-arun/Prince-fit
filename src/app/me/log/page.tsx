import Link from "next/link";
import { requireClient } from "@/lib/dal";
import { getLoggerItems } from "@/lib/q-workout";
import { addDays, DAYS, dayOfWeek, fmtDate, todayISO } from "@/lib/dates";
import { WorkoutLogger } from "@/components/workout-logger";
import { IconBack, IconChevron } from "@/components/icons";

export default async function MyLog(props: PageProps<"/me/log">) {
  const me = await requireClient();
  const today = todayISO();
  const raw = String((await props.searchParams).date ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const items = await getLoggerItems(me.id, date);
  return (
    <>
      <Link href="/me/progress?view=history" className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />History</Link>
      <h1 className="text-2xl font-bold tracking-tight">Workout log</h1>
      <div className="mb-4 mt-2 flex items-center justify-between">
        <Link href={`?date=${addDays(date, -1)}`} replace className="btn-ghost btn-sm" aria-label="Previous day"><IconBack className="size-4" /></Link>
        <span className="font-semibold">{date === today ? "Today" : fmtDate(date)} · {DAYS[dayOfWeek(date)]}</span>
        {date < today ? <Link href={`?date=${addDays(date, 1)}`} replace className="btn-ghost btn-sm" aria-label="Next day"><IconChevron className="size-4" /></Link> : <span className="w-9" />}
      </div>
      <WorkoutLogger clientId={me.id} date={date} items={items} />
    </>
  );
}
