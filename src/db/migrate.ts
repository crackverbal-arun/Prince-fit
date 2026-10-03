import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { MIGRATIONS } from "./migrations";

// A column/table that already exists means another server instance (or drizzle-kit push) got there first.
const alreadyDone = (e: unknown) => /duplicate column|already exists/i.test(String((e as Error)?.message ?? e) + String((e as { cause?: unknown })?.cause ?? ""));

async function tableExists(name: string) {
  const r = await db.all<{ n: number }>(sql`select count(*) as n from sqlite_master where type = 'table' and name = ${name}`);
  return (r[0]?.n ?? 0) > 0;
}

async function apply(from: number) {
  for (let v = from; v < MIGRATIONS.length; v++) {
    for (const stmt of MIGRATIONS[v]) {
      try { await db.run(sql.raw(stmt)); } catch (e) { if (!alreadyDone(e)) throw e; }
    }
    await db.run(sql`insert into app_meta (key, value) values ('schema_version', ${String(v + 1)})
      on conflict(key) do update set value = excluded.value`);
  }
}

/** Brings an existing database up to date. Does nothing on an empty database — /setup handles that. */
export async function migrate() {
  if (!(await tableExists("users"))) return;
  await db.run(sql`create table if not exists app_meta (key text primary key, value text not null)`);
  const row = await db.all<{ value: string }>(sql`select value from app_meta where key = 'schema_version'`);
  // Databases created before versioning existed already had the first migration.
  await apply(row[0] ? Number(row[0].value) : 1);
}

/** Creates every table on an empty database. */
export async function createSchema() {
  await db.run(sql`create table if not exists app_meta (key text primary key, value text not null)`);
  await apply(0);
}
