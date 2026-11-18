import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { drawGroup, getDrawReadiness, processDueDraws } from "@/server/draw/draw";
import type { Db } from "@/server/db/types";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

const assignments = (d: Db, groupId: string) =>
  d.query<{ giver_id: string; recipient_id: string }>(`select giver_id, recipient_id from assignments where group_id = $1 order by giver_id`, [groupId]);
const aliases = (d: Db, groupId: string) =>
  d.query<{ id: string; alias: string | null }>(`select id, alias from participants where group_id = $1 order by id`, [groupId]);
const groupRow = async (d: Db, groupId: string) =>
  (await d.query<{ status: string; drawn_at: Date | null; draw_error: string | null }>(`select status, drawn_at, draw_error from groups where id = $1`, [groupId]))[0];
const jobs = (d: Db, groupId: string, template: string) =>
  d.query<{ to_email: string; payload: Record<string, unknown> }>(`select to_email, payload from email_jobs where group_id = $1 and template = $2`, [groupId, template]);
const exclude = (d: Db, groupId: string, giver: string, receiver: string) =>
  d.query(`insert into exclusions (group_id, giver_id, receiver_id) values ($1, $2, $3)`, [groupId, giver, receiver]);

async function expectNothingWritten(groupId: string) {
  expect(await assignments(db, groupId)).toHaveLength(0);
  expect((await aliases(db, groupId)).every((p) => p.alias === null)).toBe(true);
  expect((await groupRow(db, groupId)).status).toBe("open");
  expect(await jobs(db, groupId, "assignment_ready")).toHaveLength(0);
}

describe("drawGroup", () => {
  it("writes a valid assignment, unique aliases, emails and audit", async () => {
    const g = await insertGroup(db);
    const ids = await insertParticipants(db, g.id, 7);
    expect(await drawGroup(db, g.id, { trigger: "manual" })).toEqual({ status: "drawn" });

    const rows = await assignments(db, g.id);
    expect(rows).toHaveLength(7);
    expect(new Set(rows.map((r) => r.giver_id))).toEqual(new Set(ids));
    expect(new Set(rows.map((r) => r.recipient_id))).toEqual(new Set(ids));
    for (const r of rows) expect(r.giver_id).not.toBe(r.recipient_id);

    const al = await aliases(db, g.id);
    expect(new Set(al.map((p) => p.alias)).size).toBe(7);
    expect(al.every((p) => p.alias)).toBe(true);

    const grp = await groupRow(db, g.id);
    expect(grp.status).toBe("drawn");
    expect(grp.drawn_at).not.toBeNull();
    expect(await jobs(db, g.id, "assignment_ready")).toHaveLength(7);

    const events = await db.query<{ actor: string; metadata: Record<string, unknown> }>(
      `select actor, metadata from audit_events where group_id = $1 and event_type = 'draw.completed'`,
      [g.id],
    );
    expect(events).toEqual([{ actor: "organizer", metadata: { trigger: "manual", participantCount: 7 } }]);
  });

  it("is idempotent: a second draw changes nothing", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 5);
    await drawGroup(db, g.id, { trigger: "manual" });
    const before = { a: await assignments(db, g.id), al: await aliases(db, g.id) };
    expect(await drawGroup(db, g.id, { trigger: "manual" })).toEqual({ status: "already_drawn" });
    expect(await assignments(db, g.id)).toEqual(before.a);
    expect(await aliases(db, g.id)).toEqual(before.al);
    expect(await jobs(db, g.id, "assignment_ready")).toHaveLength(5);
  });

  it("draws exactly once under concurrent calls", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 6);
    const results = await Promise.all(Array.from({ length: 5 }, () => drawGroup(db, g.id, { trigger: "manual" })));
    expect(results.filter((r) => r.status === "drawn")).toHaveLength(1);
    expect(results.filter((r) => r.status === "already_drawn")).toHaveLength(4);
    expect(await assignments(db, g.id)).toHaveLength(6);
    expect(await jobs(db, g.id, "assignment_ready")).toHaveLength(6);
  });

  it("rejects fewer than 3 approved participants without writing", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 2);
    await insertParticipants(db, g.id, 3, "pending");
    await expect(drawGroup(db, g.id, { trigger: "manual" })).rejects.toMatchObject({ code: "NOT_ENOUGH_PARTICIPANTS" });
    await expectNothingWritten(g.id);
  });

  it("leaves pending participants out of the drawing", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    const approved = await insertParticipants(db, g.id, 4);
    const pending = await insertParticipants(db, g.id, 2, "pending");
    await drawGroup(db, g.id, { trigger: "manual" });
    const rows = await assignments(db, g.id);
    expect(rows).toHaveLength(4);
    const involved = new Set(rows.flatMap((r) => [r.giver_id, r.recipient_id]));
    expect(involved).toEqual(new Set(approved));
    const al = await aliases(db, g.id);
    for (const p of pending) expect(al.find((x) => x.id === p)!.alias).toBeNull();
  });

  it("ignores exclusions involving non-approved participants", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    const [a, b, c] = await insertParticipants(db, g.id, 3);
    const [p] = await insertParticipants(db, g.id, 1, "pending");
    await exclude(db, g.id, a, p);
    await exclude(db, g.id, p, b);
    expect(await drawGroup(db, g.id, { trigger: "manual" })).toEqual({ status: "drawn" });
    expect(new Set((await assignments(db, g.id)).map((r) => r.giver_id))).toEqual(new Set([a, b, c]));
  });

  it("rejects impossible exclusions without writing", async () => {
    const g = await insertGroup(db);
    const [a, b, c] = await insertParticipants(db, g.id, 3);
    await exclude(db, g.id, a, b);
    await exclude(db, g.id, a, c);
    await expect(drawGroup(db, g.id, { trigger: "manual" })).rejects.toMatchObject({ code: "IMPOSSIBLE_EXCLUSIONS" });
    await expectNothingWritten(g.id);
  });

  it("respects symmetric exclusions over repeated draws", async () => {
    for (let i = 0; i < 8; i++) {
      const g = await insertGroup(db);
      const [a, b, c, d] = await insertParticipants(db, g.id, 4);
      for (const [x, y] of [[a, b], [b, a], [c, d], [d, c]]) await exclude(db, g.id, x, y);
      await drawGroup(db, g.id, { trigger: "manual" });
      const map = new Map((await assignments(db, g.id)).map((r) => [r.giver_id, r.recipient_id]));
      expect(map.get(a)).not.toBe(b);
      expect(map.get(b)).not.toBe(a);
      expect(map.get(c)).not.toBe(d);
      expect(map.get(d)).not.toBe(c);
    }
  });

  it("locks membership and aliases after the draw", async () => {
    const g = await insertGroup(db);
    const [a] = await insertParticipants(db, g.id, 3);
    await drawGroup(db, g.id, { trigger: "manual" });
    await expect(insertParticipants(db, g.id, 1)).rejects.toThrow(/GROUP_LOCKED/);
    await expect(db.query(`update participants set alias = 'Cocoa-x' where id = $1`, [a])).rejects.toThrow(/ALIAS_IMMUTABLE/);
  });

  it("refuses closed groups and missing groups", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 3);
    await db.query(`update groups set status = 'closed' where id = $1`, [g.id]);
    await expect(drawGroup(db, g.id, { trigger: "manual" })).rejects.toMatchObject({ code: "GROUP_LOCKED" });
    await expect(drawGroup(db, "00000000-0000-0000-0000-000000000000", { trigger: "manual" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("processDueDraws", () => {
  it("draws due groups, skips future ones, and records failures once", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const due = await insertGroup(db, { drawMethod: "scheduled", drawAt: past });
    await insertParticipants(db, due.id, 4);
    const future = await insertGroup(db, { drawMethod: "scheduled", drawAt: new Date(Date.now() + 3_600_000).toISOString() });
    await insertParticipants(db, future.id, 4);
    const under = await insertGroup(db, { drawMethod: "scheduled", drawAt: past });
    await insertParticipants(db, under.id, 2);
    const manual = await insertGroup(db);
    await insertParticipants(db, manual.id, 4);

    expect(await processDueDraws(db)).toEqual({ drawn: 1, failed: 1 });

    expect((await groupRow(db, due.id)).status).toBe("drawn");
    expect(await assignments(db, due.id)).toHaveLength(4);
    const ev = await db.query<{ actor: string }>(`select actor from audit_events where group_id = $1 and event_type = 'draw.completed'`, [due.id]);
    expect(ev).toEqual([{ actor: "system" }]);

    expect((await groupRow(db, future.id)).status).toBe("open");
    expect((await groupRow(db, manual.id)).status).toBe("open");

    const failed = await groupRow(db, under.id);
    expect(failed.status).toBe("open");
    expect(failed.draw_error).toBe("NOT_ENOUGH_PARTICIPANTS");
    const mails = await jobs(db, under.id, "draw_failed");
    expect(mails).toHaveLength(1);
    expect(mails[0].to_email).toBe("olive@example.com");
    expect(mails[0].payload).toMatchObject({ reason: "NOT_ENOUGH_PARTICIPANTS" });
    await expectNothingWritten(under.id);

    // Next tick: nothing left to attempt, no duplicate email.
    expect(await processDueDraws(db)).toEqual({ drawn: 0, failed: 0 });
    expect(await jobs(db, under.id, "draw_failed")).toHaveLength(1);
    const failEvents = await db.query(`select 1 from audit_events where group_id = $1 and event_type = 'draw.failed'`, [under.id]);
    expect(failEvents).toHaveLength(1);
  });

  it("records IMPOSSIBLE_EXCLUSIONS for scheduled groups", async () => {
    const g = await insertGroup(db, { drawMethod: "scheduled", drawAt: new Date(Date.now() - 1000).toISOString() });
    const [a, b, c] = await insertParticipants(db, g.id, 3);
    await exclude(db, g.id, b, a);
    await exclude(db, g.id, c, a);
    expect(await processDueDraws(db)).toEqual({ drawn: 0, failed: 1 });
    expect((await groupRow(db, g.id)).draw_error).toBe("IMPOSSIBLE_EXCLUSIONS");
  });
});

describe("getDrawReadiness", () => {
  it("is ready with enough participants and warns about pending requests", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    await insertParticipants(db, g.id, 3);
    await insertParticipants(db, g.id, 2, "pending");
    const r = await getDrawReadiness(db, g.id);
    expect(r).toMatchObject({ ready: true, approvedCount: 3, pendingCount: 2, issues: [] });
    expect(r.warnings).toEqual(["2 pending requests won't be included in the drawing."]);
  });

  it("reports NOT_ENOUGH_PARTICIPANTS", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 2);
    const r = await getDrawReadiness(db, g.id);
    expect(r.ready).toBe(false);
    expect(r.issues.map((i) => i.code)).toEqual(["NOT_ENOUGH_PARTICIPANTS"]);
  });

  it("reports IMPOSSIBLE_EXCLUSIONS", async () => {
    const g = await insertGroup(db);
    const [a, b, c] = await insertParticipants(db, g.id, 3);
    await exclude(db, g.id, a, b);
    await exclude(db, g.id, a, c);
    const r = await getDrawReadiness(db, g.id);
    expect(r.issues).toEqual([
      { code: "IMPOSSIBLE_EXCLUSIONS", message: "We couldn't find a valid drawing with the current exclusions. Please adjust your rules and try again." },
    ]);
  });

  it("reports ALREADY_DRAWN and GROUP_CLOSED", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 3);
    await drawGroup(db, g.id, { trigger: "manual" });
    expect((await getDrawReadiness(db, g.id)).issues.map((i) => i.code)).toEqual(["ALREADY_DRAWN"]);
    await db.query(`update groups set status = 'closed' where id = $1`, [g.id]);
    expect((await getDrawReadiness(db, g.id)).issues.map((i) => i.code)).toEqual(["GROUP_CLOSED"]);
  });
});
