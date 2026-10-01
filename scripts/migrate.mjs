import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = neon(process.env.DATABASE_URL);
const source = readFileSync(
  new URL("../database/001_tracker.sql", import.meta.url),
  "utf8",
);
try {
  const roles = await sql`select 1 from pg_roles where rolname='pocket_app'`;
  if (!roles.length)
    await sql.query("create role pocket_app nologin nobypassrls");
  await sql.transaction(
    source
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((statement) => sql.query(statement)),
  );
  console.log("Pocket database migration applied.");
} catch {
  console.error(
    "Migration failed. Check the database connection and schema permissions.",
  );
  process.exitCode = 1;
}
