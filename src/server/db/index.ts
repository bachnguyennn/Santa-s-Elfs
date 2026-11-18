import "server-only";
import path from "node:path";
import type { Db } from "./types";

export type { Db } from "./types";

const g = globalThis as unknown as { __santaelfDb?: Promise<Db> };

/**
 * The process-wide database. Uses Postgres when DATABASE_URL is set,
 * otherwise a persistent local PGlite database in .data/pglite (demo mode).
 */
export function getDb(): Promise<Db> {
  if (!g.__santaelfDb) {
    const url = process.env.DATABASE_URL;
    g.__santaelfDb = url
      ? import("./postgres").then((m) => m.createPostgresDb(url))
      : import("./pglite").then((m) => m.createPgliteDb(path.join(process.cwd(), ".data", "pglite")));
    g.__santaelfDb.catch(() => {
      g.__santaelfDb = undefined;
    });
  }
  return g.__santaelfDb;
}
