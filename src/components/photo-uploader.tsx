"use client";
import { useRef, useState, useTransition } from "react";
import { addPhoto, deletePhoto } from "@/app/actions/body";
import { compressImage } from "./photo";
import { IconCamera, IconTrash } from "./icons";

export function PhotoUploader({ clientId, today }: { clientId: string; today: string }) {
  const [pose, setPose] = useState("front");
  const [date, setDate] = useState(today);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="card space-y-2">
      <div className="text-sm font-semibold">Add progress photo</div>
      <div className="flex gap-1.5">
        {["front", "side", "back"].map((p) => <button key={p} type="button" onClick={() => setPose(p)} className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize ring-1 ${pose === p ? "bg-ink text-volt ring-ink" : "bg-bg text-muted ring-line"}`}>{p}</button>)}
      </div>
      <div className="flex gap-2">
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="input flex-1" aria-label="Photo date" />
        <button type="button" disabled={pending} onClick={() => file.current?.click()} className="btn-primary"><IconCamera className="size-4" />{pending ? "Uploading…" : "Choose photo"}</button>
      </div>
      <p className="text-[11px] text-muted">Same spot, same light, same time of day makes before/after comparisons honest.</p>
      {msg && <p className="text-sm text-bad">{msg}</p>}
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => {
        const f = e.target.files?.[0]; e.target.value = "";
        if (!f) return;
        start(async () => { const r = await addPhoto(clientId, date, pose, await compressImage(f, 1000)); setMsg(r?.error ?? null); });
      }} />
    </div>
  );
}

export function PhotoDelete({ clientId, id, legacy }: { clientId: string; id: string; legacy: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" aria-label="Delete photo" disabled={pending} onClick={() => confirm("Delete this photo?") && start(() => deletePhoto(clientId, id, legacy))}
      className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 text-bad shadow"><IconTrash className="size-3.5" /></button>
  );
}
