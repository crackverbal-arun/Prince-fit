import { getWorkoutPlan } from "@/lib/queries";
import { DAYS } from "@/lib/dates";
import { addExercise, copyDay, removeExercise } from "@/app/actions/trainer";
import { IconTrash } from "@/components/icons";
import { CopyDay } from "./copy-day";
import { AddExerciseForm } from "./add-exercise";
import { planTarget } from "@/lib/format";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export async function WorkoutTab({ clientId }: { clientId: string }) {
  const plan = await getWorkoutPlan(clientId);
  return (
    <div className="space-y-3">
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
                {items.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="flex-1 text-sm">{p.exercise}</span>
                    <span className="text-sm text-muted">{planTarget(p)}</span>
                    <form action={removeExercise.bind(null, clientId, p.id)}>
                      <button aria-label={`Remove ${p.exercise}`} className="grid size-8 place-items-center rounded-lg text-muted hover:text-bad"><IconTrash className="size-4" /></button>
                    </form>
                  </div>
                ))}
              </div>
            ) : <p className="px-4 pb-3 pt-1 text-sm text-muted">Rest day</p>}
          </section>
        );
      })}
    </div>
  );
}
