// OWNER: email/messaging agent. Contract — keep signatures stable.
import type { Db } from "../db/types";

/** Claim due jobs (FOR UPDATE SKIP LOCKED), render, send, retry with backoff. Respects provider limits. */
export async function processEmailJobs(db: Db, opts?: { limit?: number }): Promise<{ sent: number; failed: number; deferred: number }> {
  void db; void opts;
  throw new Error("not implemented");
}
