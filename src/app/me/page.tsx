import { requireClient } from "@/lib/dal";
import Link from "next/link";
import { getAttendance, getMealLogs, getMealPlan } from "@/lib/queries";
import { getDailyNutrition, getNextSession, getTargets, getWater } from "@/lib/q-client";
import { getLoggerItems } from "@/lib/q-workout";
import { fmtTime, longDate } from "@/lib/schedule";
import { WorkoutLogger } from "@/components/workout-logger";
import { WaterWidget } from "@/components/water-widget";
import { addDays, dayOfWeek, DAYS, todayISO } from "@/lib/dates";
import { checkIn } from "@/app/actions/client";
import { Submit } from "@/components/submit";
import { Empty } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { MealRow } from "./meal-row";
import { AbsentForm } from "./absent-form";

export default async function Today() {
  const me = await requireClient();
  const today = todayISO();
  const dow = dayOfWeek(today);
  const [att, items, meals, mealLogs, next, { targets }, [nut], water] = await Promise.all([
    getAttendance(me.id, addDays(today, -30)),
    getLoggerItems(me.id, today),
    getMealPlan(me.id),
    getMealLogs(me.id, today),
    getNextSession(me.id),
    getTargets(me.id),
    getDailyNutrition(me.id, today, today),
    getWater(me.id, today),
  ]);

  const todayMark = att.get(today);
  const visits = [...att.values()].filter((a) => a.status === "present").length;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p>
        <h1 className="text-2xl font-bold tracking-tight">{greet}, {me.name.split(" ")[0]}</h1>
      </header>

      <section className="card bg-ink text-white ring-0">
        {todayMark?.status === "present" ? (
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-volt text-volt-ink"><IconCheck className="size-6" /></div>
            <div>
              <div className="font-semibold">You&apos;re checked in</div>
              <div className="text-sm text-white/60">{visits} sessions in the last 30 days</div>
            </div>
          </div>
        ) : todayMark?.status === "absent" ? (
          <form action={checkIn}>
            <div className="text-sm text-white/60">Marked absent today</div>
            <div className="mb-3 font-semibold">{todayMark.reason ?? "No reason given"}</div>
            <Submit className="btn-volt w-full">Made it after all? Check in</Submit>
          </form>
        ) : (
          <>
            <form action={checkIn}>
              <div className="mb-3 text-sm text-white/70">At the gym? Let Prince know you showed up.</div>
              <Submit className="btn-volt h-12 w-full text-base">Check in for today</Submit>
            </form>
            <AbsentForm />
          </>
        )}
        <div className="mt-4 flex justify-between border-t border-white/10 pt-3">
          {week.map((d) => {
            const s = att.get(d)?.status;
            return (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-white/50">{DAYS[dayOfWeek(d)][0]}</span>
                <span className={`size-2.5 rounded-full ${s === "present" ? "bg-volt" : s === "absent" ? "bg-red-400" : "bg-white/15"} ${d === today ? "ring-2 ring-white/40 ring-offset-2 ring-offset-ink" : ""}`} />
              </div>
            );
          })}
        </div>
      </section>

      {me.trainerNote && (
        <section className="mt-3 rounded-2xl bg-volt/40 p-4 ring-1 ring-lime-300">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-volt-ink/70">Note from Prince</div>
          <p className="mt-1 whitespace-pre-line text-sm">{me.trainerNote}</p>
        </section>
      )}

      {next && (
        <div className="card mt-3 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-volt text-xs font-bold leading-tight text-volt-ink">{next.s.date === today ? "TODAY" : next.s.date === addDays(today, 1) ? "TMRW" : longDate(next.s.date).split(" ")[1]}</div>
          <div><div className="text-xs text-muted">Next session</div><div className="font-semibold">{longDate(next.s.date)} · {fmtTime(next.s.startTime)}</div><div className="text-xs text-muted">{next.s.title ?? "Training"} with Prince · {next.s.durationMin} min</div></div>
        </div>
      )}

      <div className="mt-3"><WaterWidget clientId={me.id} date={today} entries={water.map((w) => ({ id: w.id, ml: w.ml }))} targetMl={targets.waterMl} compact /></div>

      <Link href="/me/food" className="card mt-3 block">
        <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">Food today</span><span className="text-xs text-muted">Log food ›</span></div>
        <div className="mt-1 text-sm"><b className="text-lg">{Math.round(nut.totals.kcal ?? 0)}</b><span className="text-muted"> / {targets.kcal} kcal</span> · <b>{Math.round(nut.totals.protein ?? 0)}</b><span className="text-muted"> / {targets.protein} g protein</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg ring-1 ring-line"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, ((nut.totals.kcal ?? 0) / targets.kcal) * 100)}%` }} /></div>
      </Link>

      <h2 className="h-section">Today&apos;s workout · {DAYS[dow]}</h2>
      {!items.length && <p className="mb-2 px-1 text-sm text-muted">Rest day on your plan. Did some training anyway? Add it below.</p>}
      <WorkoutLogger clientId={me.id} date={today} items={items} />

      <h2 className="h-section flex justify-between">
        <span>Diet plan from Prince</span>
        {meals.length > 0 && <span className="normal-case tracking-normal">{mealLogs.length}/{meals.length} done</span>}
      </h2>
      {meals.length ? (
        <div className="card divide-y divide-line p-0">
          {meals.map((m) => {
            const log = mealLogs.find((l) => l.mealPlanId === m.id);
            return <MealRow key={m.id} id={m.id} slot={m.slot} description={m.description} done={!!log} photo={log?.photo ?? null} />;
          })}
        </div>
      ) : <Empty>Prince hasn&apos;t added your meal plan yet.</Empty>}
    </>
  );
}
