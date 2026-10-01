"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function Submit({ children, className = "btn-primary w-full" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  );
}
