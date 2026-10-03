import Link from "next/link";
import type { Assessment } from "@/db";
import { SECTIONS, REVIEW_EVERY_DAYS, bmi, comparable, fmtValue, healthFlags, type Field } from "@/lib/assessment";
import { addDays, daysBetween, fmtDate, todayISO } from "@/lib/dates";
import { Chip, Empty } from "./ui";

function Change({ f, from, to }: { f: Field; from: Assessment["data"][string] | undefined; to: Assessment["data"][string] | undefined }) {
  const a = comparable(f, from), b = comparable(f, to);
  if (a === null || b === null || a === b) return <span className="text-muted">{a !== null && a === b ? "same" : ""}</span>;
  const up = b > a;
  const tone = !f.better ? "text-muted" : (up === (f.better === "up")) ? "text-good" : "text-bad";
  const label = f.type === "choice" ? (up ? "▲" : "▼")
    : f.type === "duration" || f.type === "height" ? `${up ? "+" : "−"}${fmtValue(f, Math.abs(b - a))}`
    : `${up ? "+" : "−"}${+Math.abs(b - a).toFixed(2)}`;
  return <span className={`font-semibold ${tone}`}>{label}</span>;
}

/** Selected assessment vs baseline, health flags, trainer report, and the history list. */
export function AssessmentReport({ list, selectedId, clientId, editable }: { list: Assessment[]; selectedId?: string; clientId: string; editable: boolean }) {
  const newHref = `/trainer/clients/${clientId}/assess`;
  if (!list.length) {
    return editable ? (
      <div className="card space-y-3 text-center">
        <div className="text-sm text-muted">No assessment yet. The baseline is the starting point every 3-month review is compared against.</div>
        <Link href={newHref} className="btn-primary w-full">Start baseline assessment</Link>
      </div>
    ) : <Empty>Prince will do your baseline assessment soon.</Empty>;
  }

  const baseline = list.find((a) => a.kind === "baseline") ?? list[0];
  const latest = list.at(-1)!;
  const shown = list.find((a) => a.id === selectedId) ?? latest;
  const compareTo = shown.id === baseline.id ? null : baseline;
  const due = addDays(latest.date, REVIEW_EVERY_DAYS);
  const dueIn = daysBetween(todayISO(), due);
  const flags = healthFlags(shown.data);
  const textSections = SECTIONS.map((s) => ({ ...s, fields: s.fields.filter((f) => comparable(f, shown.data[f.key]) === null && shown.data[f.key] !== undefined) }))
    .filter((s) => s.fields.length);

  return (
    <div className="space-y-3">
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
            <Link key={a.id} href={`?tab=assessment&a=${a.id}`} replace scroll={false}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${a.id === shown.id ? "bg-ink text-white ring-ink" : "bg-surface text-muted ring-line"}`}>
              {fmtDate(a.date)} · {a.kind === "baseline" ? "Baseline" : "Review"}
            </Link>
          ))}
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
          <span className="text-right">{compareTo ? "Start" : ""}</span><span className="text-right">Now</span><span className="text-right">{compareTo ? "Change" : ""}</span>
        </div>
        {SECTIONS.map((s) => {
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

      {textSections.map((s) => (
        <div key={s.id} className="card">
          <div className="mb-2 text-sm font-semibold">{s.title}</div>
          <dl className="space-y-1.5 text-sm">
            {s.fields.map((f) => (
              <div key={f.key}><dt className="text-xs text-muted">{f.label}</dt><dd className="whitespace-pre-line">{fmtValue(f, shown.data[f.key])}</dd></div>
            ))}
          </dl>
        </div>
      ))}

      {editable && (
        <Link href={`${newHref}?edit=${shown.id}`} className="btn-ghost w-full">Edit this assessment</Link>
      )}
    </div>
  );
}
