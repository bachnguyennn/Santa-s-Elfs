import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { purgeExpiredData } from "@/server/retention";
import { issueToken } from "@/server/tokens";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

const exists = async (table: string, id: string) => (await db.query(`select 1 from ${table} where id = $1`, [id])).length === 1;

describe("purgeExpiredData", () => {
  it("purges only groups past their retention window", async () => {
    const now = new Date("2027-03-01T12:00:00Z");
    const expiredByDate = await insertGroup(db);
    const keptByDate = await insertGroup(db);
    const expiredNoDate = await insertGroup(db);
    const keptNoDate = await insertGroup(db);
    await db.query(`update groups set exchange_date = '2026-12-25' where id = $1`, [expiredByDate.id]); // +60d = 2027-02-23
    await db.query(`update groups set exchange_date = '2027-01-10' where id = $1`, [keptByDate.id]); // +60d = 2027-03-11
    await db.query(`update groups set created_at = '2026-08-01' where id = $1`, [expiredNoDate.id]);
    await db.query(`update groups set created_at = '2026-12-01' where id = $1`, [keptNoDate.id]);
    const [pid] = await insertParticipants(db, expiredByDate.id, 1);

    const res = await purgeExpiredData(db, now);
    expect(res.groups).toBe(2);
    expect(await exists("groups", expiredByDate.id)).toBe(false);
    expect(await exists("groups", expiredNoDate.id)).toBe(false);
    expect(await exists("groups", keptByDate.id)).toBe(true);
    expect(await exists("groups", keptNoDate.id)).toBe(true);
    expect(await exists("participants", pid)).toBe(false); // cascade
  });

  it("cleans up old outbox, jobs, challenges and tokens", async () => {
    const g = await insertGroup(db);
    const [pid] = await insertParticipants(db, g.id, 1);
    await db.query(`insert into dev_outbox (to_email, subject, html, text, created_at) values ('a@x.com','s','h','t', now() - interval '8 days'), ('b@x.com','s','h','t', now())`);
    await db.query(
      `insert into email_jobs (group_id, to_email, template, status, created_at) values
         ($1, 'a@x.com', 'organizer_welcome', 'sent', now() - interval '31 days'),
         ($1, 'a@x.com', 'organizer_welcome', 'pending', now() - interval '31 days'),
         ($1, 'a@x.com', 'organizer_welcome', 'failed', now() - interval '1 day')`,
      [g.id],
    );
    await db.query(
      `insert into emergency_challenges (group_id, participant_id, expires_at) values ($1, $2, now() - interval '2 days'), ($1, $2, now() + interval '5 minutes')`,
      [g.id, pid],
    );
    await issueToken(db, { kind: "organizer", groupId: g.id });
    await issueToken(db, { kind: "organizer", groupId: g.id, ttlDays: -31 });
    const res = await purgeExpiredData(db);
    expect(res).toEqual({ groups: 0, outbox: 1, emailJobs: 1, challenges: 1, tokens: 1 });
  });
});
