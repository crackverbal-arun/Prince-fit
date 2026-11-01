import { setTargets } from "@/app/actions/nutrition";
import { getTargets } from "@/lib/q-client";
import { MICROS } from "@/lib/nutrition";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { Submit } from "./submit";

/** Prince's override of a client's daily targets. Blank fields fall back to the calculated value. */
export async function TargetsForm({ clientId }: { clientId: string }) {
  const [{ targets, source, profile }, u] = await Promise.all([getTargets(clientId), db.query.users.findFirst({ where: eq(users.id, clientId), columns: { targets: true } })]);
  const manual = u?.targets ?? {};
  const field = (k: string, l: string, unit: string) => (
    <label key={k}><span className="label">{l}</span>
      <div className="relative"><input name={k} type="number" inputMode="decimal" step="any" defaultValue={manual[k] ?? ""} placeholder={String((targets as Record<string, number>)[k])} className="input pr-12" />
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-muted">{unit}</span></div>
    </label>
  );
  return (
    <details className="card">
      <summary className="cursor-pointer text-sm font-semibold">Daily targets <span className="font-normal text-muted">· {source.calculated ? "calculated" : "custom"}</span></summary>
      <form action={setTargets.bind(null, clientId)} className="mt-3 space-y-3">
        <p className="text-xs text-muted">
          Calculated from {profile.weightKg ? `${profile.weightKg} kg` : "no weight yet"}{profile.heightCm ? `, ${profile.heightCm} cm` : ""}{profile.age ? `, ${profile.age} yrs` : ""}{profile.sex ? `, ${profile.sex}` : ""}{profile.goals.length ? `, goal: ${profile.goals.join(" + ")}` : ""}. Grey numbers are what applies now; type a value to override it, clear it to go back.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {field("kcal", "Calories", "kcal")}{field("protein", "Protein", "g")}{field("carbs", "Carbs", "g")}{field("fat", "Fat", "g")}{field("waterMl", "Water", "ml")}
        </div>
        <details><summary className="cursor-pointer text-xs font-semibold text-muted">Vitamins &amp; minerals</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">{MICROS.map((m) => field(m.key, m.label, m.unit))}</div>
        </details>
        <Submit>Save targets</Submit>
      </form>
    </details>
  );
}
