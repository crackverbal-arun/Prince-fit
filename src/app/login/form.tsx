"use client";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Submit } from "@/components/submit";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="phone">Mobile number</label>
        <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="98765 43210" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-bad">{state.error}</p>}
      <Submit className="btn-primary h-12 w-full text-base">Log in</Submit>
    </form>
  );
}
