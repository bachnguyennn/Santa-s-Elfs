import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Apply SQL files from supabase/migrations in order, tracking them in schema_migrations. */
export async function migrate(exec: (sql: string) => Promise<unknown>, query: (sql: string) => Promise<{ name: string }[]>) {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  await exec("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const applied = new Set((await query("select name from schema_migrations")).map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    await exec(`begin;\n${sql}\ninsert into schema_migrations (name) values ('${file.replace(/'/g, "''")}');\ncommit;`);
  }
}
