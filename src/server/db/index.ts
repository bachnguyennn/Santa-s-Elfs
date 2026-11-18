import "server-only";
import path from "node:path";
import type { Db } from "./types";

export type { Db } from "./types";

const g = globalThis as unknown as { __santaelfDb?: Promise<Db> };

/**
 * The process-wide database. Uses Postgres when DATABASE_URL is set,
 * otherwise a persistent local PGlite database (PGLITE_DIR, default .data/pglite).
 */
export function getDb(): Promise<Db> {
  if (!g.__santaelfDb) {
    const url = process.env.DATABASE_URL;
    if (!url && process.env.VERCEL) {
      // Serverless filesystems are ephemeral: an embedded database would silently lose data.
      return Promise.reject(new Error("DATABASE_URL must be set when deployed (see README: Deploying)."));
    }
    g.__santaelfDb = url
      ? import("./postgres").then((m) => m.createPostgresDb(url))
      : import("./pglite").then((m) => m.createPgliteDb(path.resolve(process.cwd(), process.env.PGLITE_DIR ?? ".data/pglite")));
    g.__santaelfDb.catch(() => {
      g.__santaelfDb = undefined;
    });
  }
  return g.__santaelfDb;
}
