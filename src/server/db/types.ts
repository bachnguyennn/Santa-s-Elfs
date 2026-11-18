/**
 * Minimal database interface shared by the PGlite (local/test) and
 * postgres.js (Supabase/production) drivers. Use $1, $2... placeholders.
 */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Run `fn` in a transaction. Nested calls reuse the outer transaction. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
}
