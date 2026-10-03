"use client";
import { useState, useTransition } from "react";
import { markAbsentToday } from "@/app/actions/client";
import { ABSENCE_REASONS } from "@/lib/dates";

export function AbsentForm() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full text-center text-sm text-white/60 underline underline-offset-4">Can&apos;t make it today?</button>;
  return (
    <div className="mt-3 rounded-xl bg-white/5 p-3">
      <div className="mb-2 text-sm text-white/70">Let Prince know why:</div>
      <div className="flex flex-wrap gap-1.5">
        {ABSENCE_REASONS.map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${reason === r ? "bg-volt text-volt-ink" : "bg-white/10 text-white"}`}>{r}</button>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" className="input mt-2 bg-white/10 text-white ring-white/10 placeholder:text-white/40 focus:ring-volt" />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn flex-1 bg-white/10 text-white">Cancel</button>
        <button type="button" disabled={!reason || pending} onClick={() => start(() => markAbsentToday(reason, note))} className="btn flex-[2] bg-white text-ink">Mark absent</button>
      </div>
    </div>
  );
}
