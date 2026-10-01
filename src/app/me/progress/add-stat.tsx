"use client";
import { useActionState, useState } from "react";
import { addBodyStat } from "@/app/actions/client";
import { compressImage } from "@/components/photo";
import { Submit } from "@/components/submit";
import { IconCamera, IconPlus } from "@/components/icons";

export function AddStatForm() {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState("");
  const [state, action] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await addBodyStat(prev, fd);
    if (res.ok) { setPhoto(""); setOpen(false); }
    return res;
  }, undefined);

  if (!open) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="btn-primary w-full"><IconPlus className="size-4" />Log today&apos;s measurements</button>
        {state?.ok && <p className="mt-2 text-center text-sm font-medium text-good">{state.ok}</p>}
      </>
    );
  }
  return (
    <form action={action} className="card space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {([["weight", "Weight (kg)"], ["waist", "Waist (cm)"], ["chest", "Chest (cm)"], ["arm", "Arm (cm)"]] as const).map(([n, l]) => (
          <label key={n}>
            <span className="label">{l}</span>
            <input name={n} type="number" inputMode="decimal" step="0.1" className="input" />
          </label>
        ))}
      </div>
      <input type="hidden" name="photo" value={photo} />
      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-bg p-3 ring-1 ring-line">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Progress preview" className="size-12 rounded-lg object-cover" />
        ) : <IconCamera className="size-6 text-muted" />}
        <span className="text-sm">{photo ? "Photo added. Tap to change" : "Add a progress photo (optional)"}</span>
        <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await compressImage(f, 1000)); }} />
      </label>
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button>
        <div className="flex-[2]"><Submit>Save</Submit></div>
      </div>
    </form>
  );
}
