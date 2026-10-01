"use client";
import { useActionState } from "react";
import { runSetup } from "@/app/actions/setup";
import { Submit } from "@/components/submit";

export function SetupForm() {
  const [state, action] = useActionState(runSetup, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block"><span className="label">Setup key (the SETUP_KEY from Vercel)</span><input name="key" type="password" required className="input" /></label>
      <label className="block"><span className="label">Trainer name</span><input name="name" defaultValue="Prince" required className="input" /></label>
      <label className="block"><span className="label">Prince&apos;s mobile number</span><input name="phone" type="tel" inputMode="numeric" required className="input" /></label>
      <label className="block"><span className="label">Prince&apos;s password</span><input name="password" type="password" minLength={6} required className="input" /></label>
      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-bad">{state.error}</p>}
      <Submit className="btn-primary h-12 w-full text-base">Set up the app</Submit>
    </form>
  );
}
