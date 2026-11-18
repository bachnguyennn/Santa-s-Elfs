import { createHash, timingSafeEqual } from "node:crypto";
import type { Db } from "./db/types";
import { processDueDraws } from "./draw/draw";
import { processEmailJobs } from "./email/worker";
import { logError } from "./log";
import { pruneRateLimits } from "./rateLimit";
import { purgeExpiredData } from "./retention";

/**
 * Cron authorization: `Authorization: Bearer <CRON_SECRET>` (constant-time compare).
 * Without a configured secret, allowed only outside production (local demo).
 */
export function checkCronAuth(authorization: string | null, secret: string, isProduction: boolean): 200 | 401 | 503 {
  if (!secret) return isProduction ? 503 : 200;
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(authorization ?? ""), digest(`Bearer ${secret}`)) ? 200 : 401;
}

async function step<T>(name: string, fn: () => Promise<T>): Promise<T | { error: true }> {
  try {
    return await fn();
  } catch (err) {
    logError(`cron.${name}_failed`, err);
    return { error: true };
  }
}

/** One cron tick. Each step is isolated so a failure never blocks the others. */
export async function runCronTick(db: Db) {
  const draws = await step("draws", () => processDueDraws(db));
  const emails = await step("emails", () => processEmailJobs(db, { limit: 50 }));
  const purged = await step("purge", () => purgeExpiredData(db));
  const rateLimits = await step("rate_limits", async () => {
    await pruneRateLimits(db);
    return { ok: true };
  });
  return { draws, emails, purged, rateLimits };
}
