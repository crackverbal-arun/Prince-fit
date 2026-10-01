"use client";
import Link from "next/link";
import { useActionState } from "react";
import { createClient } from "@/app/actions/trainer";
import { Submit } from "@/components/submit";
import { waLink } from "@/lib/whatsapp";
import { IconWhatsApp } from "@/components/icons";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function NewClientForm({ suggested }: { suggested: string }) {
  const [state, action] = useActionState(createClient, undefined);
  const start = new Date();
  const end = new Date(); end.setMonth(end.getMonth() + 1);

  if (state?.created) {
    const { id, name, phone, password } = state.created;
    const msg = `Hi ${name.split(" ")[0]}! Welcome aboard 💪\n\nTrack your workouts, meals and progress here:\n${location.origin}\n\nLogin: ${phone}\nPassword: ${password}\n\nChange the password after you log in. — Prince`;
    return (
      <div className="card space-y-4 text-center">
        <div className="text-4xl">🎉</div>
        <div>
          <div className="text-lg font-bold">{name} is added</div>
          <div className="mt-1 text-sm text-muted">Login {phone} · Password <span className="font-mono font-semibold text-ink">{password}</span></div>
        </div>
        <a href={waLink(phone, msg)} target="_blank" rel="noreferrer" className="btn w-full bg-[#25D366] text-white"><IconWhatsApp className="size-5" />Send login on WhatsApp</a>
        <Link href={`/trainer/clients/${id}?tab=workout`} className="btn-primary w-full">Set their workout plan</Link>
        <a href="/trainer/new" className="btn-ghost w-full">Add another</a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="card space-y-3">
        <label className="block"><span className="label">Full name</span><input name="name" required className="input" autoComplete="off" /></label>
        <label className="block"><span className="label">Mobile number</span><input name="phone" type="tel" inputMode="numeric" required className="input" placeholder="10 digits" /></label>
        <label className="block"><span className="label">Goal</span><input name="goal" className="input" placeholder="e.g. Lose 8kg, build strength" /></label>
        <label className="block"><span className="label">Starting password</span><input name="password" defaultValue={suggested} required className="input font-mono" /></label>
      </div>

      <details className="card group" open>
        <summary className="cursor-pointer list-none text-sm font-semibold">Package <span className="font-normal text-muted">(optional)</span></summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="col-span-2"><span className="label">Name</span><input name="pkgName" className="input" placeholder="e.g. 12 sessions / month" /></label>
          <label><span className="label">Sessions</span><input name="sessions" type="number" inputMode="numeric" defaultValue={12} className="input" /></label>
          <label><span className="label">Price (₹)</span><input name="amount" type="number" inputMode="numeric" className="input" /></label>
          <label><span className="label">Starts</span><input name="start" type="date" defaultValue={iso(start)} className="input" /></label>
          <label><span className="label">Ends</span><input name="end" type="date" defaultValue={iso(end)} className="input" /></label>
          <label className="col-span-2"><span className="label">Paid so far (₹)</span><input name="paid" type="number" inputMode="numeric" defaultValue={0} className="input" /></label>
        </div>
      </details>

      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-bad">{state.error}</p>}
      <Submit className="btn-primary h-12 w-full text-base">Create client</Submit>
    </form>
  );
}
