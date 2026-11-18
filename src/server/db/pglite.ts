import { PGlite, type Transaction } from "@electric-sql/pglite";
import { migrate } from "./migrate";
import type { Db } from "./types";

type Queryable = PGlite | Transaction;

function wrap(conn: Queryable, root: PGlite): Db {
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const res = await conn.query<T>(sql, params);
      return res.rows;
    },
    tx<T>(fn: (db: Db) => Promise<T>) {
      // PGlite has one connection; nested calls reuse the open transaction.
      if (conn !== root) return fn(wrap(conn, root));
      return root.transaction((t) => fn(wrap(t, root)));
    },
  };
}

/** Create a migrated PGlite database. `dataDir` undefined = in-memory (tests). */
export async function createPgliteDb(dataDir?: string): Promise<Db> {
  const pg = await PGlite.create(dataDir);
  await migrate(
    (sql) => pg.exec(sql),
    async (sql) => (await pg.query<{ name: string }>(sql)).rows,
  );
  return wrap(pg, pg);
}
