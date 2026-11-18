import postgres from "postgres";
import { migrate } from "./migrate";
import type { Db } from "./types";

type Sql = postgres.Sql | postgres.TransactionSql;

function wrap(sql: Sql, inTx: boolean): Db {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const rows = await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[]);
      return rows as unknown as T[];
    },
    tx<T>(fn: (db: Db) => Promise<T>) {
      if (inTx) return fn(wrap(sql, true));
      return (sql as postgres.Sql).begin((t) => fn(wrap(t, true))) as Promise<T>;
    },
  };
}

/** Connect to Postgres (Supabase). `prepare: false` keeps us compatible with the transaction pooler. */
export function createPostgresDb(url: string, opts: { max?: number } = {}): Db & { end(): Promise<void> } {
  const sql = postgres(url, { prepare: false, max: opts.max ?? 5, idle_timeout: 20, onnotice: () => {} });
  return Object.assign(wrap(sql, false), { end: () => sql.end() });
}

export async function migratePostgres(url: string) {
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await migrate((text) => sql.unsafe(text), (text) => sql.unsafe(text) as unknown as Promise<{ name: string }[]>);
  } finally {
    await sql.end();
  }
}
