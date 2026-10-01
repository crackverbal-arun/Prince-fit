import { randomInt } from "node:crypto";
import { requireTrainer } from "@/lib/dal";
import { NewClientForm } from "./form";

export default async function NewClient() {
  await requireTrainer();
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Add client</h1>
      <p className="mb-4 text-sm text-muted">They&apos;ll log in with their mobile number and the password you set.</p>
      <NewClientForm suggested={String(randomInt(100000, 1000000))} />
    </>
  );
}
