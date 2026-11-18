import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup } from "../helpers/fixtures";
import { getThread, reportMessage, sendMessage, setSantaMuted } from "@/server/services/messaging";
import type { Db } from "@/server/db/types";
import type { ParticipantCtx } from "@/server/tokens";

let db: Awaited<ReturnType<typeof createTestDb>>;
const NAMES = ["Alice Applewood", "Bertram Birch", "Cordelia Cedar", "Dmitri Dogwood"];

/** Drawn group via raw SQL: 0→1→2→3→0 with aliases; everyone has revealed. */
async function seedDrawn(d: Db) {
  const g = await insertGroup(d, { name: "Office Elves" });
  const ids: string[] = [];
  for (const [i, name] of NAMES.entries()) {
    const [r] = await d.query<{ id: string }>(
      `insert into participants (group_id, name, email, status) values ($1, $2, $3, 'approved') returning id`,
      [g.id, name, `p${i}@example.com`],
    );
    ids.push(r.id);
  }
  for (let i = 0; i < ids.length; i++) {
    await d.query(`insert into assignments (group_id, giver_id, recipient_id, revealed_at) values ($1, $2, $3, now())`, [g.id, ids[i], ids[(i + 1) % ids.length]]);
    await d.query(`update participants set alias = $2 where id = $1`, [ids[i], `Alias ${i}`]);
  }
  await d.query(`update groups set status = 'drawn', drawn_at = now() where id = $1`, [g.id]);
  const ctx = (i: number): ParticipantCtx => ({ groupId: g.id, participantId: ids[i] });
  return { groupId: g.id, ids, ctx };
}

beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

describe("messaging", () => {
  it("lets a Santa message their recipient and the recipient reply", async () => {
    const { ctx } = await seedDrawn(db);
    const santaView = await sendMessage(db, ctx(0), { thread: "recipient", body: "  Ho ho ho! Any allergies?  " });
    expect(santaView.counterpartLabel).toBe(NAMES[1]);
    expect(santaView.santaAlias).toBe("Alias 0");
    expect(santaView.messages).toEqual([expect.objectContaining({ fromMe: true, body: "Ho ho ho! Any allergies?" })]);

    const recipientView = await sendMessage(db, ctx(1), { thread: "santa", body: "Just peanuts!" });
    expect(recipientView.counterpartLabel).toBe("Alias 0 — Your Secret Santa");
    expect(recipientView.messages.map((m) => [m.fromMe, m.body])).toEqual([
      [false, "Ho ho ho! Any allergies?"],
      [true, "Just peanuts!"],
    ]);
    const again = await getThread(db, ctx(0), "recipient");
    expect(again.messages.map((m) => m.fromMe)).toEqual([true, false]);
  });

  it("never exposes the giver's identity to the recipient", async () => {
    const { ctx, ids } = await seedDrawn(db);
    await sendMessage(db, ctx(0), { thread: "recipient", body: "Hello!" });
    const json = JSON.stringify(await getThread(db, ctx(1), "santa"));
    expect(json).not.toContain(NAMES[0]);
    expect(json).not.toContain("p0@example.com");
    expect(json).not.toContain(ids[0]);
  });

  it("returns NOT_DRAWN before the drawing, and for someone with no assignment", async () => {
    const g = await insertGroup(db);
    const [r] = await db.query<{ id: string }>(`insert into participants (group_id, name, email, status) values ($1, 'X', 'x@example.com', 'approved') returning id`, [g.id]);
    const ctx = { groupId: g.id, participantId: r.id };
    await expect(getThread(db, ctx, "recipient")).rejects.toMatchObject({ code: "NOT_DRAWN" });
    await expect(getThread(db, ctx, "santa")).rejects.toMatchObject({ code: "NOT_DRAWN" });
    // A ctx from another group can't reach this group's threads.
    const { ctx: other } = await seedDrawn(db);
    await expect(getThread(db, { groupId: g.id, participantId: other(0).participantId }, "recipient")).rejects.toMatchObject({ code: "NOT_DRAWN" });
  });

  it("requires the Santa to unwrap first", async () => {
    const { ctx, groupId, ids } = await seedDrawn(db);
    await db.query(`update assignments set revealed_at = null where group_id = $1 and giver_id = $2`, [groupId, ids[0]]);
    await expect(getThread(db, ctx(0), "recipient")).rejects.toMatchObject({ code: "NOT_DRAWN", message: "Unwrap your assignment first." });
  });

  it("enforces the length limit", async () => {
    const { ctx } = await seedDrawn(db);
    await expect(sendMessage(db, ctx(0), { thread: "recipient", body: "x".repeat(1001) })).rejects.toThrow();
    await expect(sendMessage(db, ctx(0), { thread: "recipient", body: "   " })).rejects.toThrow();
    expect((await db.query(`select 1 from messages`)).length).toBe(0);
  });

  it("mute blocks the Santa but not the recipient", async () => {
    const { ctx } = await seedDrawn(db);
    const muted = await setSantaMuted(db, ctx(1), true);
    expect(muted.muted).toBe(true);
    await expect(sendMessage(db, ctx(0), { thread: "recipient", body: "hi" })).rejects.toMatchObject({ code: "MUTED" });
    await sendMessage(db, ctx(1), { thread: "santa", body: "still can write" });
    expect((await setSantaMuted(db, ctx(1), false)).muted).toBe(false);
    await sendMessage(db, ctx(0), { thread: "recipient", body: "hi" });
  });

  it("report flags the message, mutes the thread and audits without content", async () => {
    const { ctx, groupId } = await seedDrawn(db);
    const t = await sendMessage(db, ctx(0), { thread: "recipient", body: "rude words" });
    const msgId = t.messages[0].id;
    // Only the recipient of that message can report it.
    await expect(reportMessage(db, ctx(0), msgId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(reportMessage(db, ctx(2), msgId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(reportMessage(db, ctx(1), "not-a-uuid")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await reportMessage(db, ctx(1), msgId);
    const [m] = await db.query<{ reported_at: Date | null }>(`select reported_at from messages where id = $1`, [msgId]);
    expect(m.reported_at).not.toBeNull();
    expect((await getThread(db, ctx(1), "santa")).muted).toBe(true);
    const audits = await db.query<{ event_type: string; metadata: unknown }>(`select event_type, metadata from audit_events where group_id = $1`, [groupId]);
    expect(audits).toEqual([{ event_type: "message.reported", metadata: { messageId: msgId } }]);
    // The recipient's own reply can't be reported by them.
    const r = await sendMessage(db, ctx(1), { thread: "santa", body: "reply" });
    await expect(reportMessage(db, ctx(1), r.messages[1].id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("closed groups are read-only", async () => {
    const { ctx, groupId } = await seedDrawn(db);
    await sendMessage(db, ctx(0), { thread: "recipient", body: "before close" });
    await db.query(`update groups set status = 'closed' where id = $1`, [groupId]);
    expect((await getThread(db, ctx(1), "santa")).messages).toHaveLength(1);
    await expect(sendMessage(db, ctx(0), { thread: "recipient", body: "after" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "This exchange has wrapped up; messages are read-only.",
    });
  });

  it("sends at most one notification per thread direction per hour", async () => {
    const { ctx, ids } = await seedDrawn(db);
    await sendMessage(db, ctx(0), { thread: "recipient", body: "one" });
    await sendMessage(db, ctx(0), { thread: "recipient", body: "two" });
    await sendMessage(db, ctx(1), { thread: "santa", body: "reply" });
    const jobs = await db.query<{ participant_id: string; to_email: string; payload: { thread: string } }>(
      `select participant_id, to_email, payload from email_jobs where template = 'new_message' order by created_at`,
    );
    expect(jobs.map((j) => [j.participant_id, j.to_email, j.payload.thread])).toEqual([
      [ids[1], "p1@example.com", "santa"],
      [ids[0], "p0@example.com", "recipient"],
    ]);
    expect(JSON.stringify(jobs)).not.toContain("one");
  });

  it("rate limits bursts", async () => {
    const { ctx } = await seedDrawn(db);
    for (let i = 0; i < 20; i++) await sendMessage(db, ctx(0), { thread: "recipient", body: `m${i}` });
    await expect(sendMessage(db, ctx(0), { thread: "recipient", body: "too many" })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
