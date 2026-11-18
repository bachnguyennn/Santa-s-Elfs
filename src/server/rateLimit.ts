import type { Db } from "./db/types";
import { AppError } from "./errors";
import { sha256 } from "./tokens";

/**
 * Fixed-window rate limit backed by Postgres (no Redis needed at this scale).
 * `key` is hashed before storage so raw IPs / emails never land in the table.
 */
export async function rateLimit(db: Db, key: string, limit: number, windowSeconds: number): Promise<void> {
  const rows = await db.query<{ count: number }>(
    `insert into rate_limits (key, window_start, count)
     values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     on conflict (key, window_start) do update set count = rate_limits.count + 1
     returning count`,
    [sha256(key), windowSeconds],
  );
  if ((rows[0]?.count ?? 0) > limit) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please wait a little and try again.");
  }
}

/** Best-effort client identifier for rate limiting. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/** Delete expired windows (called from the cron tick). */
export async function pruneRateLimits(db: Db) {
  await db.query(`delete from rate_limits where window_start < now() - interval '2 days'`);
}
