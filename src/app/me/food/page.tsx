import { requireClient } from "@/lib/dal";
import { todayISO } from "@/lib/dates";
import { NutritionView } from "@/components/nutrition-view";

export default async function Food(props: PageProps<"/me/food">) {
  const me = await requireClient();
  const sp = await props.searchParams;
  const today = todayISO();
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date <= today ? sp.date : today;
  const range = (["day", "week", "month"] as const).find((r) => r === sp.range) ?? "day";
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Food &amp; water</h1>
      <NutritionView clientId={me.id} date={date} range={range} href={(p) => `?date=${p.date ?? date}&range=${p.range ?? range}`} />
    </>
  );
}
