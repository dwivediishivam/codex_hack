import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { env } from "../config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!env.SUPABASE_DB_URL && (!env.SUPABASE_DB_PASSWORD || !env.SUPABASE_URL)) {
    throw new Error("Missing SUPABASE_DB_URL or the SUPABASE_DB_PASSWORD + SUPABASE_URL pair.");
  }

  const connectionString = env.SUPABASE_DB_URL ?? (() => {
    const projectRef = new URL(env.SUPABASE_URL!).hostname.split(".")[0];
    return `postgresql://postgres:${env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
  })();
  const schema = await readFile(join(__dirname, "schema.sql"), "utf8");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  await client.query(schema);
  await client.end();

  console.log("Supabase schema bootstrap complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
