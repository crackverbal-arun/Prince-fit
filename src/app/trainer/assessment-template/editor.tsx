"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetTemplate, saveTemplate } from "@/app/actions/assessment";
import type { Field, Section } from "@/lib/assessment";
import { IconPlus, IconTrash } from "@/components/icons";

const TYPES: { v: Field["type"]; l: string }[] = [
  { v: "number", l: "Number (reps, kg, cm…)" }, { v: "duration", l: "Time (m:ss)" }, { v: "scale", l: "Scale 0–10" },
  { v: "choice", l: "Rating (Poor → Very good)" }, { v: "text", l: "Short note" }, { v: "textarea", l: "Long note" },
];
const RATING = ["Poor", "Fair", "Good", "Very good"];
const newKey = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const typeLabel = (t: Field["type"]) => TYPES.find((x) => x.v === t)?.l.split(" (")[0] ?? t;

function makeField(label: string, type: Field["type"], unit: string, better: "" | "up" | "down"): Field {
  const base = { key: newKey(), label, better: better || undefined };
  if (type === "number") return { ...base, type, unit: unit || undefined };
  if (type === "scale") return { ...base, type, min: 0, max: 10 };
  if (type === "choice") return { ...base, type, options: RATING, better: better || "up" };
  if (type === "duration") return { ...base, type };
  return { ...base, type: type as "text" | "textarea" };
}

function FieldForm({ initial, submitLabel, onSubmit, onCancel, lockType }: { initial?: Partial<Field> & { unit?: string }; submitLabel: string; onSubmit: (label: string, type: Field["type"], unit: string, better: "" | "up" | "down") => void; onCancel: () => void; lockType?: boolean }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<Field["type"]>(initial?.type ?? "number");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [better, setBetter] = useState<"" | "up" | "down">(initial?.better ?? "");
  return (
    <div className="space-y-2 rounded-xl bg-bg p-3 ring-1 ring-line">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Test name, e.g. Knee push-ups in 30 sec" className="input bg-surface" autoFocus />
      {!lockType && <select value={type} onChange={(e) => setType(e.target.value as Field["type"])} className="input bg-surface" aria-label="Type">{TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>}
      <div className="grid grid-cols-2 gap-2">
        {type === "number" && <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit: reps, kg, cm" className="input bg-surface" aria-label="Unit" />}
        {!["text", "textarea"].includes(type) && (
          <select value={better} onChange={(e) => setBetter(e.target.value as "" | "up" | "down")} className="input bg-surface" aria-label="Which way is better">
            <option value="">Neither direction is better</option><option value="up">Higher is better</option><option value="down">Lower is better</option>
          </select>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 bg-surface">Cancel</button>
        <button type="button" disabled={!label.trim()} onClick={() => onSubmit(label.trim(), type, unit.trim(), better)} className="btn-primary flex-[2]">{submitLabel}</button>
      </div>
    </div>
  );
}

export function TemplateEditor({ initial, clientId, isCustom, scopeLabel }: { initial: Section[]; clientId: string | null; isCustom: boolean; scopeLabel: string }) {
  const [sections, setSections] = useState<Section[]>(initial);
  const [editing, setEditing] = useState<{ s: number; f: number; mode: "edit" | "replace" } | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const mutate = (fn: (draft: Section[]) => void) => { const d = structuredClone(sections); fn(d); setSections(d); setDirty(true); setMsg(null); };
  const move = (s: number, f: number, dir: -1 | 1) => mutate((d) => { const a = d[s].fields; const j = f + dir; if (j < 0 || j >= a.length) return; [a[f], a[j]] = [a[j], a[f]]; });

  return (
    <div className="space-y-3 pb-24">
      {sections.map((sec, si) => (
        <div key={sec.id + si} className="card p-0">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2">
            <input value={sec.title} onChange={(e) => mutate((d) => { d[si].title = e.target.value; })} className="min-w-0 flex-1 bg-transparent font-semibold outline-none" aria-label="Section title" />
            <button type="button" aria-label={`Delete section ${sec.title}`} onClick={() => confirm(`Remove the whole "${sec.title}" section?`) && mutate((d) => { d.splice(si, 1); })} className="text-muted"><IconTrash className="size-4" /></button>
          </div>
          <div className="divide-y divide-line">
            {sec.fields.map((f, fi) => {
              const isEdit = editing?.s === si && editing.f === fi;
              return (
                <div key={f.key} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{f.label}</div>
                      <div className="text-[11px] text-muted">{typeLabel(f.type)}{f.type === "number" && f.unit ? ` · ${f.unit}` : ""}{f.better ? ` · ${f.better === "up" ? "higher" : "lower"} is better` : ""}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 text-xs">
                      <button type="button" aria-label="Move up" onClick={() => move(si, fi, -1)} className="px-1.5 text-muted">↑</button>
                      <button type="button" aria-label="Move down" onClick={() => move(si, fi, 1)} className="px-1.5 text-muted">↓</button>
                      <button type="button" onClick={() => setEditing(isEdit && editing.mode === "edit" ? null : { s: si, f: fi, mode: "edit" })} className="rounded-md px-2 py-1 font-semibold ring-1 ring-line">Edit</button>
                      <button type="button" onClick={() => setEditing(isEdit && editing.mode === "replace" ? null : { s: si, f: fi, mode: "replace" })} className="rounded-md px-2 py-1 font-semibold ring-1 ring-line">Replace</button>
                      <button type="button" aria-label={`Remove ${f.label}`} onClick={() => mutate((d) => { d[si].fields.splice(fi, 1); })} className="px-1.5 text-bad"><IconTrash className="size-4" /></button>
                    </div>
                  </div>
                  {isEdit && editing.mode === "edit" && (
                    <div className="mt-2">
                      <FieldForm initial={f as Partial<Field> & { unit?: string }} lockType submitLabel="Save" onCancel={() => setEditing(null)}
                        onSubmit={(label, _t, unit, better) => { mutate((d) => { const x = d[si].fields[fi] as Field & { unit?: string }; x.label = label; if (x.type === "number") x.unit = unit || undefined; x.better = better || undefined; }); setEditing(null); }} />
                      <p className="mt-1 text-[11px] text-muted">Editing keeps past results comparable. To swap in a different test, use Replace.</p>
                    </div>
                  )}
                  {isEdit && editing.mode === "replace" && (
                    <div className="mt-2">
                      <p className="mb-1 text-[11px] text-muted">Replacing &ldquo;{f.label}&rdquo;: past results stay in old reports, and the new test starts its own history.</p>
                      <FieldForm initial={{ type: f.type, better: f.better }} submitLabel="Replace" onCancel={() => setEditing(null)}
                        onSubmit={(label, type, unit, better) => { mutate((d) => { d[si].fields[fi] = makeField(label, type, unit, better); }); setEditing(null); }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3">
            {adding === si
              ? <FieldForm submitLabel="Add test" onCancel={() => setAdding(null)} onSubmit={(label, type, unit, better) => { mutate((d) => { d[si].fields.push(makeField(label, type, unit, better)); }); setAdding(null); }} />
              : <button type="button" onClick={() => setAdding(si)} className="btn-ghost btn-sm w-full"><IconPlus className="size-4" />Add test to {sec.title}</button>}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => mutate((d) => { d.push({ id: `s${Date.now().toString(36)}`, title: "New section", fields: [] }); })} className="btn-ghost w-full"><IconPlus className="size-4" />Add section</button>

      {clientId && isCustom && (
        <button type="button" disabled={pending} onClick={() => confirm("Throw away this client's custom tests and use the default form again?") && start(async () => { await resetTemplate(clientId); router.refresh(); })} className="btn-ghost w-full text-bad">Reset to default tests</button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-md space-y-1">
          {msg && <p className={`text-center text-sm ${msg.error ? "text-bad" : "text-good"}`}>{msg.error ?? `✓ ${msg.ok}`}</p>}
          <button type="button" disabled={pending || (!dirty && !!msg?.ok)} onClick={() => start(async () => {
            const r = await saveTemplate(clientId, JSON.stringify(sections.filter((s) => s.fields.length)));
            setMsg(r); if (r.ok) { setDirty(false); router.refresh(); }
          })} className="btn-primary h-12 w-full text-base">{pending ? "Saving…" : `Save ${scopeLabel}`}</button>
        </div>
      </div>
    </div>
  );
}
