import { getWorkoutPlan } from "@/lib/queries";
import { DAYS } from "@/lib/dates";
import Link from "next/link";
import { addExercise, copyDay } from "@/app/actions/trainer";
import { PlanItemRow } from "./plan-item";
import { todayISO } from "@/lib/dates";
import { CopyDay } from "./copy-day";
import { AddExerciseForm } from "./add-exercise";
import { planTarget } from "@/lib/format";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export async function WorkoutTab({ clientId }: { clientId: string }) {
  const plan = await getWorkoutPlan(clientId);
  return (
    <div className="space-y-3">
      <div className="card space-y-2">
        <div className="text-sm font-semibold">Track a session</div>
        <p className="text-xs text-muted">Record sets, reps, weights and cardio as you train. Logging also marks attendance.</p>
        <Link href={`/trainer/clients/${clientId}/log`} className="btn-primary w-full">Log today&apos;s session</Link>
        <form action={`/trainer/clients/${clientId}/log`} className="flex gap-2"><input name="date" type="date" max={todayISO()} defaultValue={todayISO()} className="input flex-1" aria-label="Session date" /><button className="btn-ghost">Log past day</button></form>
      </div>
      <h2 className="h-section">Weekly plan</h2>
      <AddExerciseForm action={addExercise.bind(null, clientId)} />

      {ORDER.map((d) => {
        const items = plan.filter((p) => p.dayOfWeek === d);
        return (
          <section key={d} className="card p-0">
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-sm font-semibold">{DAYS[d]}</span>
              {items.length > 0 && <CopyDay from={d} action={copyDay.bind(null, clientId, d)} />}
            </div>
            {items.length ? (
              <div className="divide-y divide-line">
                {items.map((p) => <PlanItemRow key={p.id} clientId={clientId} item={p} target={planTarget(p)} />)}
              </div>
            ) : <p className="px-4 pb-3 pt-1 text-sm text-muted">Rest day</p>}
          </section>
        );
      })}
    </div>
  );
}
