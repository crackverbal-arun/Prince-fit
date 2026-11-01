"use client";
import { useActionState, useState, useTransition } from "react";
import { cancelSession, createSessions, deleteSession, dismissNotice, logManualMessage, rescheduleSession, sendTomorrowReminders, setSessionStatus, type ScheduleResult } from "@/app/actions/schedule";
import { DAYS } from "@/lib/dates";
import { endTime, fmtTime } from "@/lib/schedule";
import { IconPlus, IconWhatsApp } from "./icons";

export type SessionView = {
  id: string; clientId: string; name: string; date: string; startTime: string; durationMin: number; title: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show"; notes: string | null; series: boolean;
  changeNotice: { kind: "rescheduled" | "cancelled"; how: string } | null;
  pendingNotice: { id: string; kind: "rescheduled" | "cancelled"; link: string; body: string } | null;
  reminder: { sent: boolean; how?: string; link: string; body: string };
};

const STATUS = { scheduled: ["Scheduled", "bg-bg text-muted ring-line"], completed: ["Done", "bg-green-50 text-good ring-green-200"], cancelled: ["Cancelled", "bg-bg text-muted ring-line line-through"], no_show: ["No-show", "bg-red-50 text-bad ring-red-200"] } as const;

function Notify({ result }: { result: ScheduleResult | undefined }) {
  if (!result) return null;
  return (
    <div className="space-y-1.5">
      {result.error && <p className="text-sm text-bad">{result.error}</p>}
      {result.ok && <p className="text-sm text-good">✓ {result.ok}</p>}
      {result.notify?.map((n) => n.sent ? <p key={n.name} className="text-sm text-good">✓ WhatsApp sent to {n.name}</p> : null)}
    </div>
  );
}

export function SessionCard({ s, showDate = false }: { s: SessionView; showDate?: boolean }) {
  const [panel, setPanel] = useState<null | "reschedule" | "cancel">(null);
  const [pending, start] = useTransition();
  const [rState, reschedule] = useActionState(rescheduleSession.bind(null, s.id), undefined);
  const [cState, cancel] = useActionState(cancelSession.bind(null, s.id), undefined);
  const [label, cls] = STATUS[s.status];
  const live = s.status === "scheduled";
  return (
    <div className={`card p-0 ${s.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="w-16 shrink-0">
          <div className="text-sm font-bold">{fmtTime(s.startTime)}</div>
          <div className="text-[11px] text-muted">to {fmtTime(endTime(s.startTime, s.durationMin))}</div>
        </div>
        <div className="min-w-0 flex-1">
          <a href={`/trainer/clients/${s.clientId}?tab=schedule`} className="block truncate font-semibold">{s.name}</a>
          <div className="truncate text-xs text-muted">{showDate && `${new Date(s.date + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · `}{s.title ?? "Training"}{s.series ? " · repeats weekly" : ""}{s.notes ? ` · ${s.notes}` : ""}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{label}</span>
            {live && (s.reminder.sent ? <span className="text-[11px] text-good">✓ Reminder sent{s.reminder.how ? ` (${s.reminder.how})` : ""}</span> : null)}
            {s.changeNotice && !s.pendingNotice && <span className="text-[11px] text-good">✓ Told about {s.changeNotice.kind === "cancelled" ? "cancellation" : "new time"} ({s.changeNotice.how})</span>}
          </div>
        </div>
        {live && !s.reminder.sent && (
          <a href={s.reminder.link} target="_blank" rel="noreferrer" aria-label={`Send reminder to ${s.name}`} onClick={() => start(() => logManualMessage(s.id, "reminder", s.reminder.body))}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"><IconWhatsApp className="size-5" /></a>
        )}
      </div>
      {s.pendingNotice && (
        <div className="flex items-center gap-2 border-t border-line bg-green-50/60 px-4 py-2">
          <a href={s.pendingNotice.link} target="_blank" rel="noreferrer" onClick={() => start(() => logManualMessage(s.id, s.pendingNotice!.kind, s.pendingNotice!.body, s.pendingNotice!.id))}
            className="btn btn-sm flex-1 bg-[#25D366] text-white"><IconWhatsApp className="size-4" />Tell {s.name.split(" ")[0]} it&apos;s {s.pendingNotice.kind === "cancelled" ? "cancelled" : "moved"}</a>
          <button type="button" disabled={pending} onClick={() => start(() => dismissNotice(s.id, s.pendingNotice!.id))} className="text-xs text-muted underline">Already told</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2">
        {s.status !== "completed" && s.status !== "cancelled" && <button disabled={pending} onClick={() => start(() => setSessionStatus(s.id, "completed"))} className="btn-ghost btn-sm">✓ Done</button>}
        {live && <button disabled={pending} onClick={() => start(() => setSessionStatus(s.id, "no_show"))} className="btn-ghost btn-sm">No-show</button>}
        {s.status !== "scheduled" && s.status !== "cancelled" && <button disabled={pending} onClick={() => start(() => setSessionStatus(s.id, "scheduled"))} className="btn-ghost btn-sm">Undo</button>}
        <button onClick={() => setPanel(panel === "reschedule" ? null : "reschedule")} className="btn-ghost btn-sm">Reschedule</button>
        {live && <button onClick={() => setPanel(panel === "cancel" ? null : "cancel")} className="btn-ghost btn-sm">Cancel</button>}
        <button disabled={pending} onClick={() => {
          const series = s.series && confirm("Delete this and all later sessions in the series? (Cancel = only this one)");
          if (series || confirm("Delete this session permanently?")) start(() => deleteSession(s.id, series ? "series" : "one"));
        }} className="btn-ghost btn-sm text-bad">Delete</button>
      </div>
      {panel === "reschedule" && (
        <form action={reschedule} className="space-y-2 border-t border-line p-4">
          <div className="grid grid-cols-3 gap-2">
            <input name="date" type="date" defaultValue={s.date} className="input col-span-2" aria-label="New date" />
            <input name="time" type="time" defaultValue={s.startTime} className="input" aria-label="New time" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked /> Tell {s.name.split(" ")[0]} on WhatsApp</label>
          <input type="hidden" name="duration" value={s.durationMin} />
          <button className="btn-primary w-full">Save new time</button>
          <Notify result={rState} />
        </form>
      )}
      {panel === "cancel" && (
        <form action={cancel} className="space-y-2 border-t border-line p-4">
          <input name="reason" placeholder="Reason (optional): trainer unwell, holiday…" className="input" />
          {s.series && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="scope" value="series" /> Cancel all later sessions in this series too</label>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked /> Tell {s.name.split(" ")[0]} on WhatsApp</label>
          <button className="btn w-full bg-bad text-white">Cancel session</button>
          <Notify result={cState} />
        </form>
      )}
    </div>
  );
}

export function AddSessionForm({ clients, date, fixedClientId, open: initiallyOpen = false }: { clients: { id: string; name: string }[]; date: string; fixedClientId?: string; open?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [picked, setPicked] = useState<string[]>(fixedClientId ? [fixedClientId] : []);
  const [repeat, setRepeat] = useState(false);
  const [state, action, pending] = useActionState(createSessions, undefined);
  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary w-full"><IconPlus className="size-4" />Add session</button>;
  return (
    <form action={action} className="card space-y-3">
      <div className="flex items-center justify-between"><span className="text-sm font-semibold">New session</span><button type="button" onClick={() => setOpen(false)} className="text-xs text-muted underline">Close</button></div>
      {fixedClientId ? <input type="hidden" name="clientId" value={fixedClientId} /> : (
        <div>
          <span className="label">Client(s): pick several for a group class</span>
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {clients.map((c) => {
              const on = picked.includes(c.id);
              return (
                <label key={c.id} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${on ? "bg-ink text-volt ring-ink" : "bg-bg text-muted ring-line"}`}>
                  <input type="checkbox" name="clientId" value={c.id} checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== c.id) : [...picked, c.id])} className="sr-only" />{c.name}
                </label>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label><span className="label">Date</span><input name="date" type="date" defaultValue={date} required className="input" /></label>
        <label><span className="label">Start time</span><input name="time" type="time" defaultValue="07:00" required className="input" /></label>
        <label><span className="label">Duration</span><select name="duration" defaultValue="60" className="input">{[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
        <label><span className="label">Type (optional)</span><input name="title" list="session-types" placeholder="Strength" className="input" /></label>
        <datalist id="session-types">{["Strength", "Cardio", "HIIT class", "Mobility", "Assessment", "Yoga", "Online session"].map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> Repeat every week</label>
      {repeat && (
        <div className="space-y-2 rounded-xl bg-bg p-3 ring-1 ring-line">
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <label key={d} className="cursor-pointer"><input type="checkbox" name="repeatDay" value={d} className="peer sr-only" />
                <span className="block rounded-lg bg-surface py-2 text-center text-xs font-semibold text-muted ring-1 ring-line peer-checked:bg-ink peer-checked:text-volt">{DAYS[d].slice(0, 2)}</span></label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">for <input name="weeks" type="number" min="2" max="26" defaultValue="4" className="input h-9 w-16 bg-surface px-2 text-center" /> weeks</label>
        </div>
      )}
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      {state?.ok && <p className="text-sm text-good">✓ {state.ok}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Schedule"}</button>
    </form>
  );
}

export function SendAllReminders() {
  const [state, action, pending] = useActionState(async () => sendTomorrowReminders(), undefined);
  return (
    <form action={action}>
      <button disabled={pending} className="btn-primary btn-sm w-full">{pending ? "Sending…" : "Send all now"}</button>
      {state?.error && <p className="mt-1 text-xs text-bad">{state.error}</p>}
      {state?.ok && <p className="mt-1 text-xs text-good">✓ {state.ok}</p>}
    </form>
  );
}
