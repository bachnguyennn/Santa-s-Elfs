import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { emailJobs } from "../helpers/services";
import { authenticateOrganizer, authenticateParticipant, issueToken, revokeParticipantTokens } from "@/server/tokens";
import { joinGroup, recoverLinks } from "@/server/services/enrollment";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

const UNAUTH = { code: "UNAUTHORIZED" };

describe("capability tokens", () => {
  it("participant token for A can't authenticate as B", async () => {
    const g = await insertGroup(db);
    const [a, b] = await insertParticipants(db, g.id, 2);
    const ta = await issueToken(db, { kind: "participant", groupId: g.id, participantId: a });
    await expect(authenticateParticipant(db, ta, a)).resolves.toEqual({ participantId: a, groupId: g.id });
    await expect(authenticateParticipant(db, ta, b)).rejects.toMatchObject(UNAUTH);
  });

  it("organizer token for group 1 can't access group 2; participant token isn't an organizer token", async () => {
    const g1 = await insertGroup(db);
    const g2 = await insertGroup(db);
    const [p] = await insertParticipants(db, g1.id, 1);
    const o1 = await issueToken(db, { kind: "organizer", groupId: g1.id });
    const pt = await issueToken(db, { kind: "participant", groupId: g1.id, participantId: p });
    await expect(authenticateOrganizer(db, o1, g1.id)).resolves.toEqual({ groupId: g1.id });
    await expect(authenticateOrganizer(db, o1, g2.id)).rejects.toMatchObject(UNAUTH);
    await expect(authenticateOrganizer(db, pt, g1.id)).rejects.toMatchObject(UNAUTH);
    await expect(authenticateParticipant(db, o1, p)).rejects.toMatchObject(UNAUTH);
  });

  it("expired and revoked tokens fail", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1);
    const expired = await issueToken(db, { kind: "participant", groupId: g.id, participantId: p, ttlDays: -1 });
    await expect(authenticateParticipant(db, expired, p)).rejects.toMatchObject(UNAUTH);
    const t = await issueToken(db, { kind: "participant", groupId: g.id, participantId: p });
    await revokeParticipantTokens(db, p);
    await expect(authenticateParticipant(db, t, p)).rejects.toMatchObject(UNAUTH);
  });

  it("an invite code isn't a token", async () => {
    const g = await insertGroup(db);
    await expect(authenticateOrganizer(db, g.inviteCode, g.id)).rejects.toMatchObject(UNAUTH);
    const res = await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    await expect(authenticateParticipant(db, g.inviteCode, res.participantId)).rejects.toMatchObject(UNAUTH);
  });

  it("tokens are stored hashed only", async () => {
    const g = await insertGroup(db);
    const raw = await issueToken(db, { kind: "organizer", groupId: g.id });
    const rows = await db.query<{ token_hash: string }>(`select token_hash from access_tokens`);
    expect(rows[0].token_hash).not.toBe(raw);
    expect(JSON.stringify(await db.query(`select * from email_jobs`))).not.toContain(raw);
  });
});

describe("recoverLinks", () => {
  it("unknown email resolves and queues nothing", async () => {
    await insertGroup(db);
    await expect(recoverLinks(db, { email: "nobody@example.com" })).resolves.toBeUndefined();
    expect(await emailJobs(db)).toHaveLength(0);
  });

  it("queues links only to the registered address (participant + organizer)", async () => {
    const g = await insertGroup(db);
    const other = await insertGroup(db);
    const ann = await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    await joinGroup(db, other.inviteCode, { name: "Ann", email: "ann@example.com" });
    await db.query(`delete from email_jobs`);

    await recoverLinks(db, { email: " ANN@example.com ", inviteCode: g.inviteCode });
    let jobs = await emailJobs(db);
    expect(jobs).toEqual([expect.objectContaining({ template: "participant_recovery", to_email: "ann@example.com", participant_id: ann.participantId })]);

    await db.query(`delete from email_jobs`);
    await recoverLinks(db, { email: "olive@example.com" });
    jobs = await emailJobs(db);
    expect(jobs.map((j) => j.template)).toEqual(["organizer_recovery", "organizer_recovery"]);
    expect(jobs.every((j) => j.to_email === "olive@example.com")).toBe(true);

    await db.query(`delete from email_jobs`);
    await recoverLinks(db, { email: "ann@example.com" });
    expect((await emailJobs(db)).filter((j) => j.template === "participant_recovery")).toHaveLength(2);
  });

  it("does not recover removed / rejected participants and silently rate limits", async () => {
    const g = await insertGroup(db);
    const ann = await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    await db.query(`update participants set status = 'removed' where id = $1`, [ann.participantId]);
    await db.query(`delete from email_jobs`);
    await recoverLinks(db, { email: "ann@example.com" });
    expect(await emailJobs(db)).toHaveLength(0);

    for (let i = 0; i < 2; i++) await recoverLinks(db, { email: "olive@example.com" });
    await expect(recoverLinks(db, { email: "olive@example.com" })).resolves.toBeUndefined(); // 3rd: still allowed
    await expect(recoverLinks(db, { email: "olive@example.com" })).resolves.toBeUndefined(); // 4th: limited, same response
    expect(await emailJobs(db)).toHaveLength(3);
  });
});
