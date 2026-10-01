import { getMealPlan } from "@/lib/queries";
import { addMeal, removeMeal } from "@/app/actions/trainer";
import { Submit } from "@/components/submit";
import { Empty } from "@/components/ui";
import { IconTrash } from "@/components/icons";

const SLOTS = ["Early morning", "Breakfast", "Mid-morning", "Lunch", "Pre-workout", "Post-workout", "Evening snack", "Dinner", "Bedtime"];

export async function DietTab({ clientId }: { clientId: string }) {
  const meals = await getMealPlan(clientId);
  return (
    <div className="space-y-3">
      {meals.length ? (
        <div className="card divide-y divide-line p-0">
          {meals.map((m) => (
            <div key={m.id} className="flex items-start gap-2 px-4 py-3">
              <div className="flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{m.slot}</div>
                <div className="text-sm">{m.description}</div>
              </div>
              <form action={removeMeal.bind(null, clientId, m.id)}>
                <button aria-label={`Remove ${m.slot}`} className="grid size-8 place-items-center rounded-lg text-muted hover:text-bad"><IconTrash className="size-4" /></button>
              </form>
            </div>
          ))}
        </div>
      ) : <Empty>No meals yet. The client ticks these off each day.</Empty>}

      <form action={addMeal.bind(null, clientId)} className="card space-y-2">
        <div className="text-sm font-semibold">Add meal</div>
        <input name="slot" list="slots" required placeholder="When, e.g. Breakfast" className="input" />
        <datalist id="slots">{SLOTS.map((s) => <option key={s} value={s} />)}</datalist>
        <textarea name="description" required rows={2} placeholder="e.g. 3 egg whites + 2 multigrain toast + black coffee" className="input h-auto py-2" />
        <Submit>Add meal</Submit>
      </form>
    </div>
  );
}
