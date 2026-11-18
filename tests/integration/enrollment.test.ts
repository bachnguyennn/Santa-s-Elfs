import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { emailJobs, insertDrawnGroup } from "../helpers/services";
import { decideParticipant, joinGroup, resendParticipantLink } from "@/server/services/enrollment";
import { resolveToken } from "@/server/tokens";
import { AppError } from "@/server/errors";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

const tokenCount = async () => (await db.query<{ n: number }>(`select count(*)::int as n from access_tokens`))[0].n;

describe("joinGroup", () => {
  it("open enrollment approves immediately and issues a participant token", async () => {
    const g = await insertGroup(db);
    const res = await joinGroup(db, g.inviteCode, { name: " Ann ", email: "Ann@Example.com" });
    expect(res.status).toBe("approved");
    expect(await resolveToken(db, res.token)).toEqual({ kind: "participant", groupId: g.id, participantId: res.participantId });
    const [p] = await db.query<{ name: string; email: string }>(`select name, email from participants where id = $1`, [res.participantId]);
    expect(p).toEqual({ name: "Ann", email: "ann@example.com" });
    expect((await emailJobs(db, g.id)).map((j) => j.template)).toEqual(["participant_welcome"]);
    const [a] = await db.query<{ event_type: string; metadata: { status: string } }>(
      `select event_type, metadata from audit_events where subject_participant_id = $1`,
      [res.participantId],
    );
    expect(a).toEqual({ event_type: "participant.joined", metadata: { status: "approved" } });
  });

  it("approval enrollment goes pending, notifies the organizer, then approve / reject", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    const a = await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    const b = await joinGroup(db, g.inviteCode, { name: "Bob", email: "bob@example.com" });
    expect(a.status).toBe("pending");
    const jobs = await emailJobs(db, g.id);
    expect(jobs.filter((j) => j.template === "join_request_received").map((j) => j.to_email)).toEqual([
      "olive@example.com",
      "olive@example.com",
    ]);

    const approved = await decideParticipant(db, { groupId: g.id }, a.participantId, { action: "approve" });
    expect(approved).toMatchObject({ id: a.participantId, status: "approved", email: "ann@example.com" });
    const rejected = await decideParticipant(db, { groupId: g.id }, b.participantId, { action: "reject" });
    expect(rejected.status).toBe("rejected");
    const templates = (await emailJobs(db, g.id)).map((j) => j.template);
    expect(templates).toContain("join_approved");
    expect(templates).toContain("join_rejected");
    // pending -> removed isn't a valid transition; rejected -> removed neither
    await expect(decideParticipant(db, { groupId: g.id }, b.participantId, { action: "remove" })).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  it("removing revokes tokens", async () => {
    const g = await insertGroup(db);
    const a = await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    await decideParticipant(db, { groupId: g.id }, a.participantId, { action: "remove" });
    expect(await resolveToken(db, a.token)).toBeNull();
  });

  it("decisions are scoped to the organizer's group", async () => {
    const g1 = await insertGroup(db, { requiresApproval: true });
    const g2 = await insertGroup(db, { requiresApproval: true });
    const a = await joinGroup(db, g2.inviteCode, { name: "Ann", email: "ann@example.com" });
    await expect(decideParticipant(db, { groupId: g1.id }, a.participantId, { action: "approve" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(decideParticipant(db, { groupId: g1.id }, "not-a-uuid", { action: "approve" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(resendParticipantLink(db, { groupId: g1.id }, a.participantId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects the 21st join with GROUP_FULL", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 20);
    await expect(joinGroup(db, g.inviteCode, { name: "Late", email: "late@example.com" })).rejects.toMatchObject({ code: "GROUP_FULL" });
  });

  it("approval at capacity fails gracefully", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    const a = await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    await insertParticipants(db, g.id, 20);
    const err = await decideParticipant(db, { groupId: g.id }, a.participantId, { action: "approve" }).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("GROUP_FULL");
    const [p] = await db.query<{ status: string }>(`select status from participants where id = $1`, [a.participantId]);
    expect(p.status).toBe("pending");
    expect((await emailJobs(db, g.id)).some((j) => j.template === "join_approved")).toBe(false);
  });

  it("simultaneous joins never exceed capacity", async () => {
    const g = await insertGroup(db);
    const results = await Promise.allSettled(
      Array.from({ length: 25 }, (_, i) => joinGroup(db, g.inviteCode, { name: `P${i}`, email: `p${i}@example.com` })),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(ok).toHaveLength(20);
    expect(failed).toHaveLength(5);
    expect(failed.every((r) => (r.reason as AppError).code === "GROUP_FULL")).toBe(true);
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from participants where group_id = $1 and status = 'approved'`, [g.id]);
    expect(n).toBe(20);
    expect(await tokenCount()).toBe(20);
  });

  it("enforces the signup deadline", async () => {
    const g = await insertGroup(db);
    await db.query(`update groups set signup_deadline = now() - interval '1 minute' where id = $1`, [g.id]);
    await expect(joinGroup(db, g.inviteCode, { name: "Late", email: "late@example.com" })).rejects.toMatchObject({ code: "SIGNUPS_CLOSED" });
  });

  it("duplicate email (case-insensitive) -> DUPLICATE_EMAIL without a new token", async () => {
    const g = await insertGroup(db);
    await joinGroup(db, g.inviteCode, { name: "Ann", email: "ann@example.com" });
    const before = await tokenCount();
    const err = await joinGroup(db, g.inviteCode, { name: "Imposter", email: "  ANN@example.COM " }).catch((e) => e);
    expect(err).toMatchObject({ code: "DUPLICATE_EMAIL" });
    expect(err.message).toContain("Email me my link");
    expect(await tokenCount()).toBe(before);
  });

  it("locks membership after the drawing", async () => {
    const g = await insertDrawnGroup(db);
    await expect(joinGroup(db, g.inviteCode, { name: "Late", email: "late@example.com" })).rejects.toMatchObject({ code: "GROUP_LOCKED" });
    await expect(decideParticipant(db, { groupId: g.id }, g.participants[0], { action: "remove" })).rejects.toMatchObject({
      code: "GROUP_LOCKED",
    });
  });

  it("unknown invite code -> NOT_FOUND; honeypot -> validation error", async () => {
    await expect(joinGroup(db, "unknown-code-123456", { name: "A", email: "a@example.com" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const g = await insertGroup(db);
    await expect(joinGroup(db, g.inviteCode, { name: "Bot", email: "bot@example.com", website: "spam" })).rejects.toThrow();
  });
});

describe("resendParticipantLink", () => {
  it("queues a recovery email to the participant and is rate limited", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1);
    for (let i = 0; i < 3; i++) await resendParticipantLink(db, { groupId: g.id }, p);
    await expect(resendParticipantLink(db, { groupId: g.id }, p)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    const jobs = (await emailJobs(db, g.id)).filter((j) => j.template === "participant_recovery");
    expect(jobs).toHaveLength(3);
    expect(jobs[0].participant_id).toBe(p);
  });
});
