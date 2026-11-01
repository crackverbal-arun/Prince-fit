"use client";
import { useTransition, type ReactNode } from "react";

/** A button that asks "are you sure?" before running a server action. */
export function ConfirmButton({ action, message, className, children, label }: { action: () => Promise<unknown>; message: string; className?: string; children: ReactNode; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" aria-label={label} disabled={pending} className={className} onClick={() => { if (confirm(message)) start(async () => { await action(); }); }}>
      {pending ? "…" : children}
    </button>
  );
}
