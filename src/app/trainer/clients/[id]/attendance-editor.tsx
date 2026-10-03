"use client";
import { useState, useTransition } from "react";
import { setAttendance } from "@/app/actions/trainer";
import { AttendanceCalendar, type Marks } from "@/components/attendance-calendar";
import { ABSENCE_REASONS, fmtDate } from "@/lib/dates";

export function AttendanceEditor({ clientId, marks }: { clientId: string; marks: Marks }) {
  const [date, setDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const current = date ? marks[date] : undefined;

  const save = (status: "present" | "absent" | null) => {
    if (!date) return;
    const full = status === "absent" ? [reason, note.trim()].filter(Boolean).join(": ") : undefined;
    start(async () => { await setAttendance(clientId, date, status, full); setDate(null); });
  };
  const open = (d: string) => {
    const r = marks[d]?.reason ?? "";
    const known = ABSENCE_REASONS.find((x) => r === x || r.startsWith(x + ":"));
    setReason(known ?? (r ? "Other" : ""));
    setNote(known ? r.slice(known.length).replace(/^:\s*/, "") : r);
    setDate(d);
  };

  return (
    <>
      <AttendanceCalendar
        marks={marks}
        renderCell={(d, cell) => <button type="button" onClick={() => open(d)} className="w-full" aria-label={`Mark ${d}`}>{cell}</button>}
      />
      {date && (
        <div className="fixed inset-0 z-30 flex items-end bg-ink/40" onClick={() => setDate(null)}>
          <div className="mx-auto w-full max-w-md space-y-3 rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold">{fmtDate(date)}</h3>
              <span className="text-xs text-muted">{current ? (current.status === "present" ? "Marked present" : "Marked absent") : "Not marked"}</span>
            </div>
            <button disabled={pending} onClick={() => save("present")} className="btn-primary w-full">✓ Present</button>
            <div className="rounded-2xl bg-bg p-3 ring-1 ring-line">
              <div className="mb-2 text-xs font-semibold text-muted">Absent: why?</div>
              <div className="flex flex-wrap gap-1.5">
                {ABSENCE_REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => setReason(r)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${reason === r ? "bg-bad text-white ring-bad" : "bg-surface text-ink ring-line"}`}>{r}</button>
                ))}
              </div>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. viral fever" className="input mt-2 bg-surface" />
              <button disabled={pending || !reason} onClick={() => save("absent")} className="btn mt-2 w-full bg-bad text-white">Mark absent</button>
            </div>
            {current && <button disabled={pending} onClick={() => save(null)} className="btn-ghost w-full">Clear this day</button>}
          </div>
        </div>
      )}
    </>
  );
}
