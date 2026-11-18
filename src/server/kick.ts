import "server-only";
import { after } from "next/server";
import type { Db } from "./db/types";
import { logError } from "./log";

/**
 * After the response is sent, process a small batch of queued emails so
 * notifications go out promptly without waiting for the cron tick.
 * Safe to call from any route handler after a mutation that enqueued email.
 */
export function kickEmailWorker(db: Db) {
  after(async () => {
    try {
      const { processEmailJobs } = await import("./email/worker");
      await processEmailJobs(db, { limit: 25 });
    } catch (err) {
      logError("email.kick_failed", err);
    }
  });
}
