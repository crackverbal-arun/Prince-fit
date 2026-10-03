import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { getAssessments } from "@/lib/queries";
import { CARRY_FORWARD, SECTIONS, type AssessmentData } from "@/lib/assessment";
import { fmtDate, todayISO } from "@/lib/dates";
import { saveAssessment } from "@/app/actions/assessment";
import { AssessmentField } from "@/components/assessment-field";
import { Submit } from "@/components/submit";
import { IconBack } from "@/components/icons";

export default async function AssessPage(props: PageProps<"/trainer/clients/[id]/assess">) {
  await requireTrainer();
  const { id } = await props.params;
  const editId = String((await props.searchParams).edit ?? "") || null;
  const client = await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.role, "client")) });
  if (!client) notFound();
  const all = await getAssessments(id);
  const editing = editId ? all.find((a) => a.id === editId) : undefined;
  if (editId && !editing) notFound();

  const previous = editing ? all.filter((a) => a.date < editing.date || (a.date === editing.date && a.createdAt < editing.createdAt)).at(-1) : all.at(-1);
  const values: AssessmentData = editing?.data
    ?? Object.fromEntries(CARRY_FORWARD.filter((k) => previous?.data[k] !== undefined).map((k) => [k, previous!.data[k]]));
  if (!editing && previous && typeof previous.data.age === "number") values.age = previous.data.age;
  const kind = editing?.kind ?? (all.length ? "review" : "baseline");

  return (
    <form action={saveAssessment.bind(null, id, editing?.id ?? null)} className="pb-24">
      <Link href={`/trainer/clients/${id}?tab=assessment`} className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />{client.name}</Link>
      <h1 className="text-2xl font-bold tracking-tight">{editing ? "Edit assessment" : kind === "baseline" ? "Baseline assessment" : "3-month assessment"}</h1>
      <p className="mt-1 text-sm text-muted">
        {previous ? <>Grey &ldquo;last&rdquo; values are from {fmtDate(previous.date)}. </> : null}Skip anything you didn&apos;t test. Takes 60–90 min with the client.
      </p>

      <section className="card mt-4 grid grid-cols-2 gap-2">
        <label><span className="label">Date</span><input name="date" type="date" defaultValue={editing?.date ?? todayISO()} max={todayISO()} required className="input" /></label>
        <fieldset>
          <legend className="label">Type</legend>
          <div className="grid grid-cols-2 gap-1">
            {(["baseline", "review"] as const).map((k) => (
              <label key={k} className="cursor-pointer">
                <input type="radio" name="kind" value={k} defaultChecked={kind === k} className="peer sr-only" />
                <span className="block rounded-lg bg-bg py-3 text-center text-xs font-semibold text-muted ring-1 ring-line peer-checked:bg-ink peer-checked:text-volt">{k === "baseline" ? "Baseline" : "Review"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {SECTIONS.map((s, i) => (
        <details key={s.id} open className="card group mt-3 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            <span><span className="mr-2 text-muted">{i + 1}.</span>{s.title}</span>
            <span className="text-muted transition group-open:rotate-90">›</span>
          </summary>
          <div className="mt-3 space-y-3">
            {s.fields.map((f) => <AssessmentField key={f.key} f={f} value={values[f.key]} previous={editing ? undefined : previous?.data[f.key]} />)}
          </div>
        </details>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-md"><Submit className="btn-primary h-12 w-full text-base">Save assessment</Submit></div>
      </div>
    </form>
  );
}
