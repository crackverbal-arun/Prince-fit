import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireTrainer } from "@/lib/dal";
import { getDefaultTemplate, getTemplate } from "@/lib/q-assessment";
import { IconBack } from "@/components/icons";
import { TemplateEditor } from "./editor";

export default async function TemplatePage(props: PageProps<"/trainer/assessment-template">) {
  await requireTrainer();
  const clientId = String((await props.searchParams).client ?? "") || null;
  const client = clientId ? await db.query.users.findFirst({ where: and(eq(users.id, clientId), eq(users.role, "client")) }) : null;
  const t = client ? await getTemplate(client.id) : null;
  const d = client ? null : await getDefaultTemplate();
  const first = client?.name.split(" ")[0];

  return (
    <>
      <Link href={client ? `/trainer/clients/${client.id}?tab=assessment` : "/trainer/more"} className="-ml-1 mb-3 inline-flex items-center text-sm text-muted"><IconBack className="size-4" />{client ? client.name : "More"}</Link>
      <h1 className="text-2xl font-bold tracking-tight">{client ? `${first}'s assessment tests` : "Default assessment tests"}</h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        {client
          ? t!.source === "client" ? `${first} has a custom set of tests. Changes apply to ${first}'s next assessment only.` : `${first} uses the default tests. Saving here gives ${first} their own copy; nobody else is affected.`
          : "Every client without custom tests uses this form. Past assessments keep the tests they were taken with."}
        {client && <> <Link href="/trainer/assessment-template" className="font-semibold underline">Edit the default instead</Link></>}
      </p>
      <TemplateEditor key={client?.id ?? "default"} initial={client ? t!.sections : d!.sections} clientId={client?.id ?? null} isCustom={client ? t!.source === "client" : d!.custom}
        scopeLabel={client ? `for ${first}` : "default for all clients"} />
    </>
  );
}
