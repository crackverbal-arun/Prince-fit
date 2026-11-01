import Link from "next/link";
import { requireTrainer } from "@/lib/dal";
import { getFoods } from "@/lib/q-client";
import { IconBack } from "@/components/icons";
import { FoodForm, FoodRow } from "./food-form";

export default async function Foods(props: PageProps<"/trainer/foods">) {
  await requireTrainer();
  const q = String((await props.searchParams).q ?? "").toLowerCase();
  const foods = (await getFoods()).filter((f) => !q || f.name.toLowerCase().includes(q));
  return (
    <>
      <Link href="/trainer/more" className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />More</Link>
      <h1 className="text-2xl font-bold tracking-tight">Food database</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Clients pick from this list when logging food. Starter values are approximate: tap any food to correct it to match your recipes.</p>
      <details className="card mb-3"><summary className="cursor-pointer text-sm font-semibold">+ Add a food</summary><div className="mt-3"><FoodForm /></div></details>
      <form className="mb-3"><input name="q" defaultValue={q} placeholder="Search foods" className="input" /></form>
      <div className="card divide-y divide-line p-0">{foods.map((f) => <FoodRow key={f.id} food={{ id: f.id, name: f.name, servingLabel: f.servingLabel, servingG: f.servingG, per100: f.per100 }} />)}</div>
    </>
  );
}
