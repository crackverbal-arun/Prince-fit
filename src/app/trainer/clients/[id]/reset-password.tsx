"use client";
import { useActionState, useState } from "react";
import { resetPassword } from "@/app/actions/trainer";
import { Submit } from "@/components/submit";

export function ResetPassword({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(resetPassword.bind(null, clientId), undefined);
  if (!open) return <button onClick={() => setOpen(true)} className="btn-ghost w-full">Reset password</button>;
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input name="password" placeholder="New password" className="input min-w-0 flex-1 font-mono" required minLength={6} />
      <Submit className="btn-primary shrink-0">Set</Submit>
      {state && <p className={`basis-full text-sm ${state.error ? "text-bad" : "text-good"}`}>{state.error ?? state.ok}</p>}
    </form>
  );
}
