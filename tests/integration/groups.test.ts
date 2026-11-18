import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { createTestDb } from "../helpers/db";
import { insertParticipants } from "../helpers/fixtures";
import { emailJobs, groupInput, insertDrawnGroup, localIn } from "../helpers/services";
import {
  closeGroup,
  createGroup,
  deleteGroup,
  getInvitePreview,
  getOrganizerDashboard,
  updateGroupSettings,
} from "@/server/services/groups";
import { resolveToken } from "@/server/tokens";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

async function fieldsOf(p: Promise<unknown>): Promise<Record<string, string>> {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ZodError);
  return Object.fromEntries((err as ZodError).issues.map((i) => [i.path.join("."), i.message]));
}

describe("createGroup", () => {
  it("creates a group with converted values, tokens, welcome email and audit", async () => {
    const res = await createGroup(
      db,
      groupInput({ drawMethod: "scheduled", signupDeadline: localIn(5), drawAt: localIn(6), exchangeDate: localIn(10).slice(0, 10), timezone: "America/Toronto" }),
    );
    const [g] = await db.query<{ organizer_email: string; budget_min_cents: number; budget_max_cents: number; draw_at: Date }>(
      `select organizer_email, budget_min_cents, budget_max_cents, draw_at from groups where id = $1`,
      [res.groupId],
    );
    expect(g.organizer_email).toBe("olive@example.com");
    expect(g.budget_min_cents).toBe(2000);
    expect(g.budget_max_cents).toBe(4050);
    // Toronto wall time is 4-5 hours behind UTC.
    const offsetH = (new Date(g.draw_at).getTime() - new Date(localIn(6) + ":00Z").getTime()) / 3_600_000;
    expect(offsetH).toBeGreaterThanOrEqual(4);
    expect(offsetH).toBeLessThanOrEqual(5);

    expect(await resolveToken(db, res.organizerToken)).toEqual({ kind: "organizer", groupId: res.groupId, participantId: null });
    expect(res.organizerParticipant).toBeNull();
    const jobs = await emailJobs(db, res.groupId);
    expect(jobs.map((j) => j.template)).toEqual(["organizer_welcome"]);
    const audits = await db.query<{ event_type: string }>(`select event_type from audit_events where group_id = $1`, [res.groupId]);
    expect(audits.map((a) => a.event_type)).toContain("group.created");
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from participants where group_id = $1`, [res.groupId]);
    expect(n).toBe(0);
  });

  it("organizer participation uses a slot only when opted in", async () => {
    const res = await createGroup(db, groupInput({ organizerParticipates: true }));
    expect(res.organizerParticipant).not.toBeNull();
    const ps = await db.query<{ status: string; is_organizer: boolean; email: string }>(
      `select status, is_organizer, email from participants where group_id = $1`,
      [res.groupId],
    );
    expect(ps).toEqual([{ status: "approved", is_organizer: true, email: "olive@example.com" }]);
    const t = await resolveToken(db, res.organizerParticipant!.token);
    expect(t).toMatchObject({ kind: "participant", participantId: res.organizerParticipant!.participantId });
    expect((await emailJobs(db, res.groupId)).map((j) => j.template).sort()).toEqual(["organizer_welcome", "participant_welcome"]);
    const preview = await getInvitePreview(db, res.inviteCode);
    expect(preview?.approvedCount).toBe(1);
  });

  it("rejects bad ordering, budgets and past dates with field errors", async () => {
    expect(await fieldsOf(createGroup(db, groupInput({ budgetMin: 50, budgetMax: 10 })))).toHaveProperty("budgetMax");
    expect(
      await fieldsOf(createGroup(db, groupInput({ drawMethod: "scheduled", signupDeadline: localIn(5), drawAt: localIn(4) }))),
    ).toHaveProperty("drawAt");
    expect(await fieldsOf(createGroup(db, groupInput({ drawMethod: "scheduled" })))).toHaveProperty("drawAt");
    expect(await fieldsOf(createGroup(db, groupInput({ signupDeadline: localIn(-1) })))).toHaveProperty("signupDeadline");
    expect(await fieldsOf(createGroup(db, groupInput({ drawMethod: "scheduled", drawAt: localIn(-1) })))).toHaveProperty("drawAt");
    expect(await fieldsOf(createGroup(db, groupInput({ signupDeadline: localIn(5), exchangeDate: localIn(2).slice(0, 10) })))).toHaveProperty(
      "exchangeDate",
    );
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from groups`);
    expect(n).toBe(0);
  });
});

describe("getInvitePreview", () => {
  it("returns public info only and reports closed reasons", async () => {
    const res = await createGroup(db, groupInput({ exchangeDate: "2099-12-24" }));
    const p = await getInvitePreview(db, res.inviteCode);
    expect(p).toMatchObject({ name: "Office Party", organizerName: "Olive", isOpen: true, closedReason: null, capacity: 20, exchangeDate: "2099-12-24" });
    expect(JSON.stringify(p)).not.toContain("olive@example.com");

    await db.query(`update groups set signup_deadline = now() - interval '1 minute' where id = $1`, [res.groupId]);
    expect((await getInvitePreview(db, res.inviteCode))?.closedReason).toBe("deadline");
    await db.query(`update groups set signup_deadline = null where id = $1`, [res.groupId]);
    await insertParticipants(db, res.groupId, 20);
    expect(await getInvitePreview(db, res.inviteCode)).toMatchObject({ isOpen: false, closedReason: "full", approvedCount: 20 });
    expect(await getInvitePreview(db, "doesnotexist-0000000")).toBeNull();
  });

  it("reports drawn groups", async () => {
    const g = await insertDrawnGroup(db);
    expect((await getInvitePreview(db, g.inviteCode))?.closedReason).toBe("drawn");
  });
});

describe("organizer dashboard & settings", () => {
  it("returns participants, counts and readiness", async () => {
    const res = await createGroup(db, groupInput({ organizerParticipates: true }));
    await insertParticipants(db, res.groupId, 2);
    await insertParticipants(db, res.groupId, 1, "pending");
    const d = await getOrganizerDashboard(db, { groupId: res.groupId });
    expect(d.approvedCount).toBe(3);
    expect(d.pendingCount).toBe(1);
    expect(d.participants).toHaveLength(4);
    expect(d.organizerParticipantId).toBe(res.organizerParticipant!.participantId);
    expect(d.participants[0].lastEmail?.template).toBe("participant_welcome");
    expect(d.participants.every((p) => p.revealed === null)).toBe(true);
    expect(d.emails.pending).toBe(2);
    expect(d.inviteUrl).toMatch(new RegExp(`/j/${res.inviteCode}$`));
    expect(d.readiness.approvedCount).toBe(3);
    expect(d.group.organizerEmail).toBe("olive@example.com");
  });

  it("shows reveal state after the drawing without exposing recipients", async () => {
    const g = await insertDrawnGroup(db);
    await db.query(`update assignments set revealed_at = now() where giver_id = $1`, [g.participants[0]]);
    const d = await getOrganizerDashboard(db, { groupId: g.id });
    expect(d.participants.map((p) => p.revealed)).toEqual([true, false, false]);
    expect(JSON.stringify(d)).not.toMatch(/recipient/i);
  });

  it("updates settings while open, clears draw_error, and locks after drawing", async () => {
    const res = await createGroup(db, groupInput());
    await db.query(`update groups set draw_error = 'NOT_ENOUGH_PARTICIPANTS' where id = $1`, [res.groupId]);
    const d = await updateGroupSettings(db, { groupId: res.groupId }, {
      ...groupInput({ name: "Renamed", drawMethod: "scheduled", drawAt: localIn(3), budgetMin: undefined }),
    });
    expect(d.group.name).toBe("Renamed");
    expect(d.group.drawError).toBeNull();
    expect(d.group.budgetMinCents).toBeNull();
    expect(d.group.drawMethod).toBe("scheduled");
    await expect(
      updateGroupSettings(db, { groupId: res.groupId }, groupInput({ drawMethod: "scheduled", drawAt: localIn(-1) })),
    ).rejects.toBeInstanceOf(ZodError);

    const drawn = await insertDrawnGroup(db);
    await expect(updateGroupSettings(db, { groupId: drawn.id }, groupInput())).rejects.toMatchObject({ code: "GROUP_LOCKED" });
  });

  it("allows an unchanged past signup deadline on update", async () => {
    const res = await createGroup(db, groupInput({ signupDeadline: localIn(1) }));
    await db.query(`update groups set signup_deadline = date_trunc('minute', now() - interval '1 day') where id = $1`, [res.groupId]);
    const [{ wall }] = await db.query<{ wall: string }>(
      `select to_char(signup_deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI') as wall from groups where id = $1`,
      [res.groupId],
    );
    const d = await updateGroupSettings(db, { groupId: res.groupId }, groupInput({ name: "Same deadline", signupDeadline: wall }));
    expect(d.group.name).toBe("Same deadline");
  });

  it("closes and deletes", async () => {
    const g = await insertDrawnGroup(db);
    await closeGroup(db, { groupId: g.id });
    expect((await db.query<{ status: string }>(`select status from groups where id = $1`, [g.id]))[0].status).toBe("closed");
    await deleteGroup(db, { groupId: g.id });
    expect(await db.query(`select 1 from participants where group_id = $1`, [g.id])).toHaveLength(0);
    expect(await db.query(`select 1 from groups where id = $1`, [g.id])).toHaveLength(0);
  });
});
