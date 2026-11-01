"use client";
import { useState, useTransition } from "react";
import { deletePackage, updatePackage } from "@/app/actions/trainer";

export function PackageEdit({ clientId, pkg }: { clientId: string; pkg: { id: string; name: string; totalSessions: number; startDate: string; endDate: string; amount: number; paid: number } }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (!open) return (
    <div className="mt-3 flex gap-2 border-t border-line pt-3">
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost btn-sm flex-1">Edit package</button>
      <button type="button" disabled={pending} onClick={() => confirm(`Delete "${pkg.name}"? Payment records for it go too.`) && start(() => deletePackage(clientId, pkg.id))} className="btn-ghost btn-sm text-bad">Delete</button>
    </div>
  );
  return (
    <form action={(fd) => start(async () => { await updatePackage(clientId, pkg.id, fd); setOpen(false); })} className="mt-3 space-y-2 border-t border-line pt-3">
      <input name="name" defaultValue={pkg.name} className="input" aria-label="Package name" />
      <div className="grid grid-cols-2 gap-2">
        <label><span className="label">Sessions</span><input name="sessions" type="number" defaultValue={pkg.totalSessions} className="input" /></label>
        <label><span className="label">Price (₹)</span><input name="amount" type="number" defaultValue={pkg.amount} className="input" /></label>
        <label><span className="label">Starts</span><input name="start" type="date" defaultValue={pkg.startDate} className="input" /></label>
        <label><span className="label">Ends</span><input name="end" type="date" defaultValue={pkg.endDate} className="input" /></label>
        <label className="col-span-2"><span className="label">Paid so far (₹)</span><input name="paid" type="number" defaultValue={pkg.paid} className="input" /></label>
      </div>
      <div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button><button disabled={pending} className="btn-primary flex-[2]">Save</button></div>
    </form>
  );
}
