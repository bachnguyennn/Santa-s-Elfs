import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup } from "../helpers/fixtures";
import { enqueueEmail } from "@/server/email/queue";
import { processEmailJobs, backoffMinutes } from "@/server/email/worker";
import { emergencyCodeHash, resolveToken } from "@/server/tokens";
import type { Db } from "@/server/db/types";

let db: Awaited<ReturnType<typeof createTestDb>>;

const NAMES = ["Alice Applewood", "Bertram Birch", "Cordelia Cedar", "Dmitri Dogwood"];

/** Drawn group via raw SQL: 0→1→2→3→0, with aliases. */
async function seedDrawn(d: Db, status: "drawn" | "open" = "drawn") {
  const g = await insertGroup(d, { name: "Office Elves" });
  const ids: string[] = [];
  for (const [i, name] of NAMES.entries()) {
    const [r] = await d.query<{ id: string }>(
      `insert into participants (group_id, name, email, status) values ($1, $2, $3, 'approved') returning id`,
      [g.id, name, `p${i}@example.com`],
    );
    ids.push(r.id);
  }
  if (status === "drawn") {
    for (let i = 0; i < ids.length; i++) {
      await d.query(`insert into assignments (group_id, giver_id, recipient_id) values ($1, $2, $3)`, [g.id, ids[i], ids[(i + 1) % ids.length]]);
      await d.query(`update participants set alias = $2 where id = $1`, [ids[i], `Alias ${i}`]);
    }
    await d.query(`update groups set status = 'drawn', drawn_at = now() where id = $1`, [g.id]);
  }
  return { groupId: g.id, ids };
}

const outbox = (d: Db) => d.query<{ to_email: string; subject: string; html: string; text: string }>(`select * from dev_outbox order by created_at`);
const jobs = (d: Db) => d.query<{ id: string; status: string; attempts: number; last_error: string | null; provider_id: string | null; next_attempt_at: Date; payload: unknown }>(`select * from email_jobs order by created_at`);

beforeEach(async () => {
  db = await createTestDb();
  vi.stubEnv("EMAIL_MODE", "simulate");
  vi.stubEnv("APP_URL", "https://santa.test");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await db.close();
});

describe("email worker (simulate mode)", () => {
  it("writes the rendered email to dev_outbox and marks the job sent", async () => {
    const { groupId, ids } = await seedDrawn(db, "open");
    await enqueueEmail(db, "p0@example.com", { template: "participant_welcome", groupId, participantId: ids[0] });
    const res = await processEmailJobs(db);
    expect(res).toEqual({ sent: 1, failed: 0, deferred: 0 });
    const [mail] = await outbox(db);
    expect(mail.to_email).toBe("p0@example.com");
    expect(mail.subject).toContain("Office Elves");
    expect(mail.text).toContain("https://santa.test/a/");
    const [job] = await jobs(db);
    expect(job.status).toBe("sent");
    expect(job.provider_id).toMatch(/^simulated:/);
  });

  it("assignment email has the private link and no participant names", async () => {
    const { groupId, ids } = await seedDrawn(db);
    await enqueueEmail(db, "p0@example.com", { template: "assignment_ready", groupId, participantId: ids[0] }, `assignment_ready:${ids[0]}`);
    await processEmailJobs(db);
    const [mail] = await outbox(db);
    expect(mail.subject).toBe("SantaElf has picked your Secret Santa recipient! 🎁");
    for (const part of [mail.subject, mail.html, mail.text]) {
      for (const name of NAMES) {
        expect(part).not.toContain(name);
        expect(part).not.toContain(name.split(" ")[0]);
      }
      expect(part).not.toContain("Alias");
    }
    expect(mail.html).toContain("Open my Christmas card");
    expect(mail.text).toContain("The elves have finished drawing names!");
    expect(mail.text).toContain("This link opens your private page");
    const token = mail.text.match(/https:\/\/santa\.test\/a\/([A-Za-z0-9_-]+)/)![1];
    expect(await resolveToken(db, token)).toEqual({ kind: "participant", groupId, participantId: ids[0] });
  });

  it("never stores tokens in the queue", async () => {
    const { groupId, ids } = await seedDrawn(db);
    await enqueueEmail(db, "p1@example.com", { template: "assignment_ready", groupId, participantId: ids[1] });
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId });
    await processEmailJobs(db);
    const rows = await db.query<{ payload: unknown; last_error: string | null; provider_id: string | null }>(`select payload, last_error, provider_id from email_jobs`);
    const tokens = await outbox(db).then((m) => m.map((x) => x.text.match(/\/a\/([A-Za-z0-9_-]+)/)![1]));
    const dump = JSON.stringify(rows);
    for (const t of tokens) expect(dump).not.toContain(t);
    expect(dump).not.toMatch(/[A-Za-z0-9_-]{43}/);
  });

  it("dedupe key prevents a duplicate assignment email", async () => {
    const { groupId, ids } = await seedDrawn(db);
    const job = { template: "assignment_ready" as const, groupId, participantId: ids[0] };
    await enqueueEmail(db, "p0@example.com", job, `assignment_ready:${ids[0]}`);
    await enqueueEmail(db, "p0@example.com", job, `assignment_ready:${ids[0]}`);
    await processEmailJobs(db);
    expect(await outbox(db)).toHaveLength(1);
  });

  it("skips stale jobs without sending", async () => {
    const { groupId, ids } = await seedDrawn(db, "open");
    await db.query(`update participants set status = 'removed' where id = $1`, [ids[0]]);
    await enqueueEmail(db, "p0@example.com", { template: "participant_welcome", groupId, participantId: ids[0] });
    await enqueueEmail(db, "p1@example.com", { template: "assignment_ready", groupId, participantId: ids[1] }); // group not drawn
    const [c] = await db.query<{ id: string }>(
      `insert into emergency_challenges (group_id, participant_id, expires_at) values ($1, $2, now() - interval '1 minute') returning id`,
      [groupId, ids[2]],
    );
    await enqueueEmail(db, "olive@example.com", { template: "emergency_code", groupId, challengeId: c.id });
    const res = await processEmailJobs(db);
    expect(res.failed).toBe(3);
    expect(await outbox(db)).toHaveLength(0);
    for (const j of await jobs(db)) expect([j.status, j.last_error]).toEqual(["failed", "stale"]);
    expect((await db.query(`select 1 from access_tokens`)).length).toBe(0);
  });

  it("emergency_code stores a hash that verifies the emailed code", async () => {
    const { groupId, ids } = await seedDrawn(db);
    const [c] = await db.query<{ id: string }>(
      `insert into emergency_challenges (group_id, participant_id, expires_at) values ($1, $2, now() + interval '10 minutes') returning id`,
      [groupId, ids[2]],
    );
    await enqueueEmail(db, "olive@example.com", { template: "emergency_code", groupId, challengeId: c.id });
    await processEmailJobs(db);
    const [mail] = await outbox(db);
    expect(mail.to_email).toBe("olive@example.com");
    expect(mail.text).toContain("10 minutes");
    for (const name of NAMES) expect(mail.text).not.toContain(name);
    const code = mail.text.match(/\b(\d{6})\b/)![1];
    const [row] = await db.query<{ code_hash: string }>(`select code_hash from emergency_challenges where id = $1`, [c.id]);
    expect(row.code_hash).toBe(emergencyCodeHash(c.id, code));
  });

  it("new_message alert is generic", async () => {
    const { groupId, ids } = await seedDrawn(db);
    await db.query(`insert into messages (group_id, giver_id, sender_role, body) values ($1, $2, 'santa', 'SECRET BODY TEXT')`, [groupId, ids[0]]);
    await enqueueEmail(db, "p1@example.com", { template: "new_message", groupId, participantId: ids[1], thread: "santa" });
    await processEmailJobs(db);
    const [mail] = await outbox(db);
    expect(mail.subject).toContain("You have a new message from your Secret Santa");
    for (const part of [mail.subject, mail.html, mail.text]) {
      expect(part).not.toContain("SECRET BODY TEXT");
      expect(part).not.toContain(NAMES[0]);
      expect(part).not.toContain("Alias 0");
    }
  });

  it("join_request_received tells the organizer the requester's name", async () => {
    const g = await insertGroup(db, { requiresApproval: true, name: "Fam <b>Jam</b>" });
    const [p] = await db.query<{ id: string }>(
      `insert into participants (group_id, name, email, status) values ($1, 'Zed Zebra', 'z@example.com', 'pending') returning id`,
      [g.id],
    );
    await enqueueEmail(db, "olive@example.com", { template: "join_request_received", groupId: g.id, participantId: p.id });
    await processEmailJobs(db);
    const [mail] = await outbox(db);
    expect(mail.to_email).toBe("olive@example.com");
    expect(mail.text).toContain("Zed Zebra");
    expect(mail.html).not.toContain("<b>Jam</b>"); // group name is escaped
  });

  it("defers once the daily cap is reached", async () => {
    vi.stubEnv("EMAIL_DAILY_LIMIT", "1");
    const { groupId } = await seedDrawn(db, "open");
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId });
    await enqueueEmail(db, "olive@example.com", { template: "organizer_recovery", groupId });
    expect((await processEmailJobs(db)).sent).toBe(1);
    expect(await processEmailJobs(db)).toEqual({ sent: 0, failed: 0, deferred: 1 });
    const statuses = (await jobs(db)).map((j) => j.status).sort();
    expect(statuses).toEqual(["pending", "sent"]);
  });
});

describe("email worker (resend mode)", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_MODE", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_fake_key");
  });

  it("retries with backoff after a provider failure, using the job id as Idempotency-Key", async () => {
    const fetchMock = vi.fn(async () => Response.json({ name: "internal_server_error", message: "boom" }, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const { groupId } = await seedDrawn(db, "open");
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId });

    expect(await processEmailJobs(db)).toEqual({ sent: 0, failed: 0, deferred: 1 });
    let [job] = await jobs(db);
    expect(job.status).toBe("pending");
    expect(job.attempts).toBe(1);
    expect(job.last_error).toBe("http_500:internal_server_error");
    expect(new Date(job.next_attempt_at).getTime()).toBeGreaterThan(Date.now() + 50_000);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = init.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe(job.id);
    expect(headers.Authorization).toBe("Bearer re_fake_key");
    const body = JSON.parse(init.body as string);
    expect(body.reply_to).toBeUndefined();
    expect(body.text).toBeTruthy();

    // Not due yet: nothing happens.
    expect(await processEmailJobs(db)).toEqual({ sent: 0, failed: 0, deferred: 0 });

    fetchMock.mockImplementation(async () => Response.json({ id: "re_123" }));
    await db.query(`update email_jobs set next_attempt_at = now()`);
    expect((await processEmailJobs(db)).sent).toBe(1);
    [job] = await jobs(db);
    expect([job.status, job.attempts, job.provider_id, job.last_error]).toEqual(["sent", 2, "re_123", null]);
    const keys = fetchMock.mock.calls.map((c) => ((c as unknown as [string, RequestInit])[1].headers as Record<string, string>)["Idempotency-Key"]);
    expect(new Set(keys)).toEqual(new Set([job.id]));
  });

  it("marks the job failed after the maximum attempts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed to someone@example.com"); }));
    const { groupId } = await seedDrawn(db, "open");
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId });
    for (let i = 0; i < 5; i++) {
      await db.query(`update email_jobs set next_attempt_at = now() where status = 'pending'`);
      await processEmailJobs(db);
    }
    const [job] = await jobs(db);
    expect([job.status, job.attempts, job.last_error]).toEqual(["failed", 5, "network:TypeError"]);
    expect(backoffMinutes(1)).toBe(1);
    expect(backoffMinutes(4)).toBe(64);
  });

  it("treats an idempotency conflict as already sent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ name: "invalid_idempotent_request" }, { status: 409 })));
    const { groupId } = await seedDrawn(db, "open");
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId });
    expect((await processEmailJobs(db)).sent).toBe(1);
  });

  it("recovers jobs stuck in 'sending'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: "re_9" })));
    const { groupId } = await seedDrawn(db, "open");
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId });
    await db.query(`update email_jobs set status = 'sending', attempts = 1, next_attempt_at = now() - interval '11 minutes'`);
    expect((await processEmailJobs(db)).sent).toBe(1);
  });
});
