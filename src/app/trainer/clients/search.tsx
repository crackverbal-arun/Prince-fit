"use client";
import { useRouter } from "next/navigation";

export function ClientSearch({ initial }: { initial: string }) {
  const router = useRouter();
  return (
    <input
      type="search"
      defaultValue={initial}
      placeholder="Search by name or number"
      className="input"
      onChange={(e) => router.replace(`/trainer/clients${e.target.value ? `?q=${encodeURIComponent(e.target.value)}` : ""}`)}
    />
  );
}
