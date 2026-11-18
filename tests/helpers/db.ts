import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { createPgliteDb } from "@/server/db/pglite";
import { migrate } from "@/server/db/migrate";
import type { Db } from "@/server/db/types";

/**
 * Fresh, fully migrated database for one test.
 * Default: in-memory PGlite. With TEST_DATABASE_URL set (CI), an isolated
 * schema on real Postgres — which also exercises real row-level locking.
 */
export async function createTestDb(): Promise<Db & { close(): Promise<void> }> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    const db = await createPgliteDb();
    return Object.assign(db, { close: async () => {} });
  }
  const schema = `t_${randomBytes(6).toString("hex")}`;
  const admin = postgres(url, { max: 1, onnotice: () => {} });
  await admin.unsafe(`create schema ${schema}`);
  await admin.end();
  const sql = postgres(url, { max: 10, prepare: false, onnotice: () => {}, connection: { search_path: schema } });
  await migrate((t) => sql.unsafe(t), (t) => sql.unsafe(t) as unknown as Promise<{ name: string }[]>);
  const wrap = (s: postgres.Sql | postgres.TransactionSql, inTx: boolean): Db => ({
    async query<T>(text: string, params: unknown[] = []) {
      return (await s.unsafe(text, params as never[])) as unknown as T[];
    },
    tx<T>(fn: (db: Db) => Promise<T>) {
      if (inTx) return fn(wrap(s, true));
      return (s as postgres.Sql).begin((t) => fn(wrap(t, true))) as Promise<T>;
    },
  });
  return Object.assign(wrap(sql, false), {
    close: async () => {
      await sql.unsafe(`drop schema ${schema} cascade`);
      await sql.end();
    },
  });
}
