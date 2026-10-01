import { requireClient } from "@/lib/dal";
import { getAttendance, getMealLogs, getMealPlan, getWorkoutLogs, getWorkoutPlan } from "@/lib/queries";
import { addDays, dayOfWeek, DAYS, todayISO } from "@/lib/dates";
import { checkIn } from "@/app/actions/client";
import { Submit } from "@/components/submit";
import { Empty } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { ExerciseRow } from "./exercise-row";
import { MealRow } from "./meal-row";

export default async function Today() {
  const me = await requireClient();
  const today = todayISO();
  const dow = dayOfWeek(today);
  const [att, plan, logs, meals, mealLogs] = await Promise.all([
    getAttendance(me.id, addDays(today, -30)),
    getWorkoutPlan(me.id),
    getWorkoutLogs(me.id),
    getMealPlan(me.id),
    getMealLogs(me.id, today),
  ]);

  const todays = plan.filter((p) => p.dayOfWeek === dow);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const mealsDone = mealLogs.length;
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p>
        <h1 className="text-2xl font-bold tracking-tight">{greet}, {me.name.split(" ")[0]}</h1>
      </header>

      <section className="card bg-ink text-white ring-0">
        {att.has(today) ? (
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-volt text-volt-ink"><IconCheck className="size-6" /></div>
            <div>
              <div className="font-semibold">You&apos;re checked in</div>
              <div className="text-sm text-white/60">{att.size} sessions in the last 30 days</div>
            </div>
          </div>
        ) : (
          <form action={checkIn}>
            <div className="mb-3 text-sm text-white/70">At the gym? Let Prince know you showed up.</div>
            <Submit className="btn-volt h-12 w-full text-base">Check in for today</Submit>
          </form>
        )}
        <div className="mt-4 flex justify-between border-t border-white/10 pt-3">
          {week.map((d) => (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-white/50">{DAYS[dayOfWeek(d)][0]}</span>
              <span className={`size-2.5 rounded-full ${att.has(d) ? "bg-volt" : "bg-white/15"} ${d === today ? "ring-2 ring-white/40 ring-offset-2 ring-offset-ink" : ""}`} />
            </div>
          ))}
        </div>
      </section>

      {me.trainerNote && (
        <section className="mt-3 rounded-2xl bg-volt/40 p-4 ring-1 ring-lime-300">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-volt-ink/70">Note from Prince</div>
          <p className="mt-1 whitespace-pre-line text-sm">{me.trainerNote}</p>
        </section>
      )}

      <h2 className="h-section">Today&apos;s workout · {DAYS[dow]}</h2>
      {todays.length ? (
        <div className="space-y-2">
          {todays.map((p) => {
            const todayLog = logs.find((l) => l.date === today && l.exercise === p.exercise);
            const last = logs.find((l) => l.date < today && l.exercise === p.exercise);
            const prevBest = Math.max(0, ...logs.filter((l) => l.date < today && l.exercise === p.exercise).map((l) => l.weightKg));
            return (
              <ExerciseRow
                key={p.id}
                exercise={p.exercise}
                target={`${p.sets} × ${p.reps}${p.targetKg ? ` @ ${p.targetKg}kg` : ""}`}
                defaults={{ sets: todayLog?.sets ?? p.sets, reps: todayLog?.reps ?? (parseInt(p.reps) || 10), weight: todayLog?.weightKg ?? last?.weightKg ?? p.targetKg ?? 0 }}
                last={last ? `${last.sets}×${last.reps} @ ${last.weightKg}kg` : null}
                logged={!!todayLog}
                isPR={!!todayLog && todayLog.weightKg > 0 && todayLog.weightKg > prevBest && prevBest > 0}
              />
            );
          })}
        </div>
      ) : <Empty>Rest day. Recover well. 🧘</Empty>}

      <h2 className="h-section flex justify-between">
        <span>Meals</span>
        {meals.length > 0 && <span className="normal-case tracking-normal">{mealsDone}/{meals.length} done</span>}
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
