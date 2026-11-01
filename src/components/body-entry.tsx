"use client";
import { useState, useTransition } from "react";
import { deleteBodyStat } from "@/app/actions/body";
import { MEASURES } from "@/lib/body";
import { BodyForm } from "./body-form";
import { IconTrash } from "./icons";

export function BodyEntry({ clientId, entry, today, dateLabel }: { clientId: string; entry: Record<string, string | number | null> & { id: string }; today: string; dateLabel: string }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const parts = MEASURES.filter(([k]) => entry[k] != null).map(([k, l, u]) => `${l} ${entry[k]}${u === "%" ? "%" : u === "kg" ? " kg" : ""}`);
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setEdit(!edit)} className="min-w-0 flex-1 text-left">
          <div className="text-sm font-semibold">{dateLabel}</div>
          <div className="text-xs text-muted">{parts.join(" · ") || "Photo only"}</div>
          {entry.notes && <div className="text-xs italic text-muted">{String(entry.notes)}</div>}
        </button>
        <button type="button" aria-label={`Delete entry ${dateLabel}`} disabled={pending} onClick={() => confirm(`Delete measurements from ${dateLabel}?`) && start(() => deleteBodyStat(clientId, entry.id))} className="grid size-8 place-items-center text-muted"><IconTrash className="size-4" /></button>
      </div>
      {edit && <div className="mt-2"><BodyForm clientId={clientId} statId={entry.id} values={entry} today={today} onDone={() => setEdit(false)} /></div>}
    </div>
  );
}
