"use client";
import { useActionState, useState } from "react";
import { deleteClient } from "@/app/actions/trainer";

export function DeleteClient({ clientId, name }: { clientId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteClient.bind(null, clientId), undefined);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn-ghost w-full text-bad">Delete client permanently</button>;
  return (
    <form action={action} className="space-y-2 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
      <p className="text-sm text-bad">This deletes {name} and all their workouts, food logs, measurements, photos, assessments, sessions and payments. It can&apos;t be undone. Pausing keeps everything.</p>
      <input name="confirm" placeholder={`Type ${name} to confirm`} className="input bg-surface" autoComplete="off" />
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 bg-surface">Keep</button>
        <button disabled={pending} className="btn flex-1 bg-bad text-white">Delete</button>
      </div>
    </form>
  );
}
