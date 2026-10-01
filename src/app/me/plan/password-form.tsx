"use client";
import { useActionState, useState } from "react";
import { changePassword } from "@/app/actions/auth";
import { Submit } from "@/components/submit";

export function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(changePassword, undefined);
  if (!open) return <button onClick={() => setOpen(true)} className="btn-ghost w-full">Change password</button>;
  return (
    <form action={action} className="space-y-2">
      <input name="current" type="password" placeholder="Current password" autoComplete="current-password" className="input" required />
      <input name="next" type="password" placeholder="New password (min 6)" autoComplete="new-password" className="input" required />
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      {state?.ok && <p className="text-sm text-good">{state.ok}</p>}
      <Submit>Update password</Submit>
    </form>
  );
}
