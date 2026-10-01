import { getWorkoutPlan } from "@/lib/queries";
import { DAYS } from "@/lib/dates";
import { addExercise, copyDay, removeExercise } from "@/app/actions/trainer";
import { Submit } from "@/components/submit";
import { IconTrash } from "@/components/icons";
import { CopyDay } from "./copy-day";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const COMMON = ["Back Squat", "Bench Press", "Deadlift", "Overhead Press", "Barbell Row", "Lat Pulldown", "Leg Press", "Romanian Deadlift", "Incline DB Press", "Seated Cable Row", "Bicep Curl", "Tricep Pushdown", "Lunges", "Plank", "Treadmill"];

export async function WorkoutTab({ clientId }: { clientId: string }) {
  const plan = await getWorkoutPlan(clientId);
  return (
    <div className="space-y-3">
      <form action={addExercise.bind(null, clientId)} className="card space-y-2">
        <div className="text-sm font-semibold">Add exercise</div>
        <div className="grid grid-cols-7 gap-1">
          {ORDER.map((d) => (
            <label key={d} className="cursor-pointer">
              <input type="radio" name="day" value={d} defaultChecked={d === 1} className="peer sr-only" />
              <span className="block rounded-lg bg-bg py-2 text-center text-xs font-semibold text-muted ring-1 ring-line peer-checked:bg-ink peer-checked:text-volt">{DAYS[d].slice(0, 2)}</span>
            </label>
          ))}
        </div>
        <input name="exercise" list="exercises" required placeholder="Exercise" className="input" />
        <datalist id="exercises">{COMMON.map((e) => <option key={e} value={e} />)}</datalist>
        <div className="grid grid-cols-3 gap-2">
          <input name="sets" type="number" inputMode="numeric" placeholder="Sets" defaultValue={3} required className="input" />
          <input name="reps" placeholder="Reps e.g. 8-10" defaultValue="10" required className="input" />
          <input name="kg" type="number" inputMode="decimal" step="0.5" placeholder="Kg" className="input" />
        </div>
        <Submit>Add to plan</Submit>
      </form>

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
                    <span className="text-sm text-muted">{p.sets}×{p.reps}{p.targetKg ? ` · ${p.targetKg}kg` : ""}</span>
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
