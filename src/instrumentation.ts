// Runs once per server start: upgrade the database schema if the code has moved ahead of it.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  try {
    const { migrate } = await import("./db/migrate");
    await migrate();
  } catch (e) {
    console.error("Database migration failed", e);
  }
}
