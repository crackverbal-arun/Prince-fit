import Link from "next/link";
import type { Assessment } from "@/db";
import { REVIEW_EVERY_DAYS, bmi, comparable, fmtValue, healthFlags, sectionsOf, type Field, type Section } from "@/lib/assessment";
import { deleteAssessment } from "@/app/actions/assessment";
import { addDays, daysBetween, fmtDate, todayISO } from "@/lib/dates";
import { Chip, Empty } from "./ui";
import { ConfirmButton } from "./confirm-button";

type Data = Assessment["data"];

function delta(f: Field, from: Data[string] | undefined, to: Data[string] | undefined): "better" | "worse" | "same" | "changed" | null {
  const a = comparable(f, from), b = comparable(f, to);
  if (a === null || b === null) return null;
  if (a === b) return "same";
  if (!f.better) return "changed";
  return (b > a) === (f.better === "up") ? "better" : "worse";
}

function Change({ f, from, to }: { f: Field; from: Data[string] | undefined; to: Data[string] | undefined }) {
  const a = comparable(f, from), b = comparable(f, to);
  if (a === null || b === null) return null;
  if (a === b) return <span className="text-muted">same</span>;
  const up = b > a, d = delta(f, from, to);
  const tone = d === "better" ? "text-good" : d === "worse" ? "text-bad" : "text-muted";
  const label = f.type === "choice" ? (up ? "▲" : "▼")
    : f.type === "duration" || f.type === "height" ? `${up ? "+" : "−"}${fmtValue(f, Math.abs(b - a))}`
    : `${up ? "+" : "−"}${+Math.abs(b - a).toFixed(2)}`;
  return <span className={`font-semibold ${tone}`}>{label}</span>;
}

/** Selected assessment vs baseline or previous, health flags, results summary, trainer report and history. */
export function AssessmentReport({ list, selectedId, vs = "baseline", clientId, editable, justSaved = false, linkBase = "?tab=assessment" }: {
  list: Assessment[]; selectedId?: string; vs?: string; clientId: string; editable: boolean; justSaved?: boolean; linkBase?: string;
}) {
  const newHref = `/trainer/clients/${clientId}/assess`;
  if (!list.length) {
    return editable ? (
      <div className="card space-y-3 text-center">
        <div className="text-sm text-muted">No assessment yet. The baseline is the starting point every 3-month review is compared against.</div>
        <Link href={newHref} className="btn-primary w-full">Start baseline assessment</Link>
        <Link href={`/trainer/assessment-template?client=${clientId}`} className="block text-sm font-semibold underline underline-offset-2">Customise the tests for this client first</Link>
      </div>
    ) : <Empty>Prince will do your baseline assessment soon.</Empty>;
  }

  const baseline = list.find((a) => a.kind === "baseline") ?? list[0];
  const latest = list.at(-1)!;
  const shown = list.find((a) => a.id === selectedId) ?? latest;
  const idx = list.indexOf(shown);
  const previous = idx > 0 ? list[idx - 1] : null;
  const compareTo = vs === "previous" ? previous : shown.id === baseline.id ? null : baseline;
  const sections: Section[] = sectionsOf(shown);
  const fields = sections.flatMap((s) => s.fields);
  const due = addDays(latest.date, REVIEW_EVERY_DAYS);
  const dueIn = daysBetween(todayISO(), due);
  const flags = healthFlags(shown.data, sections);
  const href = (p: { a?: string; vs?: string }) => `${linkBase}&a=${p.a ?? shown.id}&vs=${p.vs ?? vs}`;

  // Results summary: what got better / worse since the comparison point.
  const ref = compareTo ?? previous;
  const changes = ref ? fields.map((f) => ({ f, d: delta(f, ref.data[f.key], shown.data[f.key]) })).filter((x) => x.d) : [];
  const better = changes.filter((c) => c.d === "better"), worse = changes.filter((c) => c.d === "worse");
  const textSections = sections.map((s) => ({ ...s, fields: s.fields.filter((f) => comparable(f, shown.data[f.key]) === null && shown.data[f.key] !== undefined) })).filter((s) => s.fields.length);
  const notTested = fields.filter((f) => shown.data[f.key] === undefined).length;

  return (
    <div className="space-y-3">
      {justSaved && (
        <div className="rounded-2xl bg-volt/50 p-4 ring-1 ring-lime-300">
          <div className="font-bold">✓ Assessment saved: here are the results</div>
          <div className="text-sm">{ref ? `Compared with ${fmtDate(ref.date)}.` : "This is the baseline: future reviews will be compared against it."}</div>
        </div>
      )}

      <div className="card flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-muted">Next assessment</div>
          <div className="font-semibold">{fmtDate(due)}{" "}
            {dueIn <= 0 ? <Chip tone="bad">Due now</Chip> : dueIn <= 7 ? <Chip tone="warn">In {dueIn}d</Chip> : <span className="text-sm font-normal text-muted">· in {dueIn} days</span>}
          </div>
        </div>
        {editable && <Link href={newHref} className="btn-primary btn-sm">New assessment</Link>}
      </div>

      {list.length > 1 && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
          {list.map((a) => (
            <Link key={a.id} href={href({ a: a.id })} replace scroll={false}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${a.id === shown.id ? "bg-ink text-white ring-ink" : "bg-surface text-muted ring-line"}`}>
              {fmtDate(a.date)} · {a.kind === "baseline" ? "Baseline" : "Review"}
            </Link>
          ))}
        </div>
      )}

      {ref && (
        <div className="card">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Results vs {ref.id === baseline.id ? "baseline" : "previous"} ({fmtDate(ref.date)})</span>
            {previous && previous.id !== baseline.id && (
              <Link href={href({ vs: vs === "previous" ? "baseline" : "previous" })} replace scroll={false} className="text-xs font-semibold underline underline-offset-2">vs {vs === "previous" ? "baseline" : "previous"}</Link>
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div><div className="text-2xl font-bold text-good">{better.length}</div><div className="text-muted">improved</div></div>
            <div><div className={`text-2xl font-bold ${worse.length ? "text-bad" : ""}`}>{worse.length}</div><div className="text-muted">declined</div></div>
            <div><div className="text-2xl font-bold">{changes.length - better.length - worse.length}</div><div className="text-muted">same / neutral</div></div>
          </div>
          {better.length > 0 && <p className="mt-2 text-xs"><b className="text-good">Wins:</b> {better.slice(0, 6).map((c) => c.f.label).join(", ")}</p>}
          {worse.length > 0 && <p className="mt-1 text-xs"><b className="text-bad">Watch:</b> {worse.map((c) => c.f.label).join(", ")}</p>}
        </div>
      )}

      {flags.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-warn">Check before training hard</div>
          <ul className="list-disc space-y-1 pl-4 text-sm">{flags.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      )}

      <div className="card p-0">
        <div className="grid grid-cols-[1fr_auto_auto_3.5rem] gap-x-3 border-b border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>{shown.kind === "baseline" ? "Baseline" : "Review"} · {fmtDate(shown.date)}</span>
          <span className="text-right">{compareTo ? fmtDate(compareTo.date) : ""}</span><span className="text-right">Now</span><span className="text-right">{compareTo ? "Change" : ""}</span>
        </div>
        {sections.map((s) => {
          const rows = s.fields.filter((f) => comparable(f, shown.data[f.key]) !== null || (compareTo && comparable(f, compareTo.data[f.key]) !== null));
          const extra = s.id === "body" && bmi(shown.data) ? [{ label: "BMI", now: bmi(shown.data)!, then: compareTo ? bmi(compareTo.data) : null }] : [];
          if (!rows.length && !extra.length) return null;
          return (
            <div key={s.id} className="border-b border-line px-4 py-2 last:border-0">
              <div className="py-1 text-xs font-semibold text-muted">{s.title}</div>
              {rows.map((f) => (
                <div key={f.key} className="grid grid-cols-[1fr_auto_auto_3.5rem] items-baseline gap-x-3 py-1 text-sm">
                  <span className="min-w-0 truncate">{f.label}</span>
                  <span className="text-right text-muted">{compareTo ? fmtValue(f, compareTo.data[f.key]) : ""}</span>
                  <span className="text-right font-semibold">{fmtValue(f, shown.data[f.key])}</span>
                  <span className="text-right text-xs">{compareTo && <Change f={f} from={compareTo.data[f.key]} to={shown.data[f.key]} />}</span>
                </div>
              ))}
              {extra.map((x) => (
                <div key={x.label} className="grid grid-cols-[1fr_auto_auto_3.5rem] gap-x-3 py-1 text-sm">
                  <span>{x.label}</span><span className="text-right text-muted">{x.then ?? ""}</span><span className="text-right font-semibold">{x.now}</span><span />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {notTested > 0 && <p className="px-1 text-[11px] text-muted">{notTested} test{notTested === 1 ? "" : "s"} not done in this assessment.</p>}

      {textSections.map((s) => (
        <div key={s.id} className="card">
          <div className="mb-2 text-sm font-semibold">{s.title}</div>
          <dl className="space-y-1.5 text-sm">
            {s.fields.map((f) => <div key={f.key}><dt className="text-xs text-muted">{f.label}</dt><dd className="whitespace-pre-line">{fmtValue(f, shown.data[f.key])}</dd></div>)}
          </dl>
        </div>
      ))}

      {editable && (
        <div className="grid grid-cols-2 gap-2">
          <Link href={`${newHref}?edit=${shown.id}`} className="btn-ghost">Edit</Link>
          <ConfirmButton action={deleteAssessment.bind(null, clientId, shown.id)} message={`Delete the ${fmtDate(shown.date)} assessment? This can't be undone.`} className="btn-ghost text-bad">Delete</ConfirmButton>
          <Link href={`/trainer/assessment-template?client=${clientId}`} className="col-span-2 text-center text-sm font-semibold underline underline-offset-2">Customise tests for this client</Link>
        </div>
      )}
    </div>
  );
}
