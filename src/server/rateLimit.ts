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

/**
 * The one request header that carries the client IP and that clients cannot forge.
 * Only a header your hosting platform overwrites is trustworthy: `TRUSTED_IP_HEADER`
 * if set ("none" disables), else `x-real-ip` on Vercel (which overwrites it), else none.
 */
export function trustedIpHeader(): string | null {
  const configured = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (configured) return configured === "none" ? null : configured;
  return process.env.VERCEL ? "x-real-ip" : null;
}

/**
 * Client identifier for rate limiting. Without a trusted header every client
 * shares one bucket: no per-IP separation, but limits can't be bypassed by
 * spoofing X-Forwarded-For. For list-valued headers the last entry (added by
 * the nearest proxy) is used, never a client-supplied first entry.
 */
export function clientKey(req: Request): string {
  const header = trustedIpHeader();
  if (!header) return "shared";
  const value = req.headers.get(header)?.split(",").pop()?.trim();
  return value ? `${header}:${value}` : "unknown";
}

/** Delete expired windows (called from the cron tick). */
export async function pruneRateLimits(db: Db) {
  await db.query(`delete from rate_limits where window_start < now() - interval '2 days'`);
}
