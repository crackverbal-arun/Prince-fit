import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own
try { process.loadEnvFile(".env.local"); } catch {}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: process.env.DATABASE_AUTH_TOKEN ? "turso" : "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
