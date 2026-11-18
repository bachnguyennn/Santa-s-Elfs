import type { Db } from "./db/types";

export interface PurgeCounts {
  groups: number;
  outbox: number;
  emailJobs: number;
  challenges: number;
  tokens: number;
}

async function count(db: Db, deleteSql: string, now: Date): Promise<number> {
  const [row] = await db.query<{ n: number }>(`with d as (${deleteSql} returning 1) select count(*)::int as n from d`, [now.toISOString()]);
  return row?.n ?? 0;
}

/**
 * Data retention (run from the cron tick). Deleting a group cascades to all of
 * its participants, assignments, messages, tokens, jobs and audit events.
 */
export async function purgeExpiredData(db: Db, now: Date = new Date()): Promise<PurgeCounts> {
  return {
    groups: await count(
      db,
      `delete from groups
        where (exchange_date is not null and exchange_date + interval '60 days' < $1::timestamptz)
           or (exchange_date is null and created_at + interval '180 days' < $1::timestamptz)`,
      now,
    ),
    outbox: await count(db, `delete from dev_outbox where created_at < $1::timestamptz - interval '7 days'`, now),
    emailJobs: await count(
      db,
      `delete from email_jobs where status in ('sent', 'failed') and created_at < $1::timestamptz - interval '30 days'`,
      now,
    ),
    challenges: await count(
      db,
      `delete from emergency_challenges
        where expires_at < $1::timestamptz - interval '1 day' or consumed_at < $1::timestamptz - interval '1 day'`,
      now,
    ),
    tokens: await count(
      db,
      `delete from access_tokens
        where expires_at < $1::timestamptz - interval '30 days' or revoked_at < $1::timestamptz - interval '30 days'`,
      now,
    ),
  };
}
