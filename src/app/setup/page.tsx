import { redirect } from "next/navigation";
import { isSetUp, missingEnv } from "@/lib/setup";
import { SetupForm } from "./form";

export const dynamic = "force-dynamic";

export default async function Setup() {
  const missing = missingEnv();
  if (!missing.length && (await isSetUp())) redirect("/login");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">One-time setup</h1>
      <p className="mb-6 mt-2 text-muted">Creates the database tables and Prince&apos;s login. This page switches itself off once it&apos;s done.</p>
      {missing.length ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-bad ring-1 ring-red-200">
          Add these in Vercel → Settings → Environment Variables, then redeploy: <b>{missing.join(", ")}</b>
        </div>
      ) : <SetupForm />}
    </main>
  );
}
