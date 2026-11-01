import { getMealPlan } from "@/lib/queries";
import { addMeal } from "@/app/actions/trainer";
import { MealItemRow } from "./meal-item";
import { Submit } from "@/components/submit";
import { Empty } from "@/components/ui";

const SLOTS = ["Early morning", "Breakfast", "Mid-morning", "Lunch", "Pre-workout", "Post-workout", "Evening snack", "Dinner", "Bedtime"];

export async function DietTab({ clientId }: { clientId: string }) {
  const meals = await getMealPlan(clientId);
  return (
    <div className="space-y-3">
      {meals.length ? (
        <div className="card divide-y divide-line p-0">
          {meals.map((m) => <MealItemRow key={m.id} clientId={clientId} item={m} />)}
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
