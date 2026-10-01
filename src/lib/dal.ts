import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { decrypt } from "./session";

// Every page and action goes through these — the proxy check is only optimistic.
export const getUser = cache(async () => {
  const session = await decrypt((await cookies()).get("session")?.value);
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user || !user.active) return null;
  return user;
});

export async function requireTrainer() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/me");
  return user;
}

export async function requireClient() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "client") redirect("/trainer");
  return user;
}
