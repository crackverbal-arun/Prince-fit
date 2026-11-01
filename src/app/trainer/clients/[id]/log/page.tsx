import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { getLoggerItems } from "@/lib/q-workout";
import { addDays, DAYS, dayOfWeek, fmtDate, todayISO } from "@/lib/dates";
import { WorkoutLogger } from "@/components/workout-logger";
import { IconBack, IconChevron } from "@/components/icons";

export default async function TrainerLog(props: PageProps<"/trainer/clients/[id]/log">) {
  await requireTrainer();
  const { id } = await props.params;
  const today = todayISO();
  const raw = String((await props.searchParams).date ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const client = await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.role, "client")) });
  if (!client) notFound();
  const items = await getLoggerItems(id, date);
  return (
    <>
      <Link href={`/trainer/clients/${id}?tab=history`} className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />{client.name}</Link>
      <h1 className="text-2xl font-bold tracking-tight">Log session</h1>
      <div className="mb-4 mt-2 flex items-center justify-between">
        <Link href={`?date=${addDays(date, -1)}`} replace className="btn-ghost btn-sm" aria-label="Previous day"><IconBack className="size-4" /></Link>
        <span className="font-semibold">{date === today ? "Today" : fmtDate(date)} · {DAYS[dayOfWeek(date)]}</span>
        {date < today ? <Link href={`?date=${addDays(date, 1)}`} replace className="btn-ghost btn-sm" aria-label="Next day"><IconChevron className="size-4" /></Link> : <span className="w-9" />}
      </div>
      {!items.length && <p className="mb-2 text-sm text-muted">Nothing planned for {DAYS[dayOfWeek(date)]}. Add any exercise below.</p>}
      <WorkoutLogger clientId={id} date={date} items={items} />
    </>
  );
}
