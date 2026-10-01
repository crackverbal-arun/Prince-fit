"use client";
import { useRef, useTransition, useState } from "react";
import { mealPhoto, toggleMeal } from "@/app/actions/client";
import { compressImage } from "@/components/photo";
import { IconCamera, IconCheck } from "@/components/icons";

export function MealRow({ id, slot, description, done, photo }: { id: string; slot: string; description: string; done: boolean; photo: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        aria-label={done ? `Untick ${slot}` : `Tick ${slot}`}
        disabled={pending}
        onClick={() => start(() => toggleMeal(id))}
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition ${done ? "bg-good text-white" : "bg-bg ring-1 ring-line"} ${pending ? "opacity-50" : ""}`}
      >
        {done && <IconCheck className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{slot}</div>
        <div className={`text-sm ${done ? "text-muted line-through decoration-muted/40" : ""}`}>{description}</div>
        {error && <div className="mt-1 text-xs text-bad">{error}</div>}
      </div>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={`${slot} photo`} onClick={() => file.current?.click()} className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-line" />
      ) : (
        <button type="button" aria-label={`Add photo of ${slot}`} onClick={() => file.current?.click()} disabled={pending} className="grid size-12 shrink-0 place-items-center rounded-lg bg-bg text-muted ring-1 ring-line">
          <IconCamera className="size-5" />
        </button>
      )}
      <input
        ref={file}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setError(null);
          start(async () => {
            const res = await mealPhoto(id, await compressImage(f));
            if (res?.error) setError(res.error);
          });
        }}
      />
    </div>
  );
}
