import "server-only";
import { eq } from "drizzle-orm";
import { db, settings, users } from "@/db";
import { SECTIONS, validateSections, type Section } from "./assessment";

export async function getDefaultTemplate(): Promise<{ sections: Section[]; custom: boolean }> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "assessment_template") });
  const v = validateSections(row?.value);
  return v ? { sections: v, custom: true } : { sections: SECTIONS, custom: false };
}

/** The form to use for this client's next assessment: their own copy if Prince customised it, else the default. */
export async function getTemplate(clientId: string): Promise<{ sections: Section[]; source: "client" | "default" | "built-in" }> {
  const u = await db.query.users.findFirst({ where: eq(users.id, clientId), columns: { assessmentTemplate: true } });
  const own = validateSections(u?.assessmentTemplate);
  if (own) return { sections: own, source: "client" };
  const d = await getDefaultTemplate();
  return { sections: d.sections, source: d.custom ? "default" : "built-in" };
}
