import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { emailJobs, insertDrawnGroup } from "../helpers/services";
import { completeEmergencyReveal, startEmergencyChallenge } from "@/server/services/emergency";
import { emergencyCodeHash, issueToken, authenticateOrganizer } from "@/server/tokens";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

const CODE = "123456";

/** Simulates the email worker minting the code. */
async function setCode(challengeId: string, code = CODE) {
  await db.query(`update emergency_challenges set code_hash = $2 where id = $1`, [challengeId, emergencyCodeHash(challengeId, code)]);
}

const attempts = async (id: string) =>
  (await db.query<{ attempts: number }>(`select attempts from emergency_challenges where id = $1`, [id]))[0].attempts;

describe("emergency reveal", () => {
  it("start: requires a drawn group and an approved participant in it; queues the code to the organizer", async () => {
    const open = await insertGroup(db);
    const [p] = await insertParticipants(db, open.id, 1);
    await expect(startEmergencyChallenge(db, { groupId: open.id }, p)).rejects.toMatchObject({ code: "NOT_DRAWN" });

    const g = await insertDrawnGroup(db);
    await expect(startEmergencyChallenge(db, { groupId: g.id }, p)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const ch = await startEmergencyChallenge(db, { groupId: g.id }, g.participants[0]);
    expect(ch.sentTo).toBe("o•••@example.com");
    expect(new Date(ch.expiresAt).getTime()).toBeGreaterThan(Date.now() + 9 * 60_000);
    const jobs = await emailJobs(db, g.id);
    expect(jobs).toEqual([expect.objectContaining({ template: "emergency_code", to_email: "olive@example.com" })]);
  });

  it("succeeds once with the right code and audits without the recipient", async () => {
    const g = await insertDrawnGroup(db);
    const [giver, recipient] = g.participants;
    const ch = await startEmergencyChallenge(db, { groupId: g.id }, giver);
    await setCode(ch.challengeId);
    const res = await completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: CODE });
    expect(res).toEqual({ participantName: "Person 1", recipientName: "Person 2" });

    const [a] = await db.query<{ subject_participant_id: string; metadata: object; actor: string }>(
      `select subject_participant_id, metadata, actor from audit_events where event_type = 'emergency.reveal'`,
    );
    expect(a.subject_participant_id).toBe(giver);
    expect(a.actor).toBe("organizer");
    expect(JSON.stringify(a)).not.toContain(recipient);

    // single use
    await expect(completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: CODE })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    });
  });

  it("wrong codes increment attempts and lock after 5", async () => {
    const g = await insertDrawnGroup(db);
    const ch = await startEmergencyChallenge(db, { groupId: g.id }, g.participants[0]);
    await setCode(ch.challengeId);
    for (let i = 1; i <= 5; i++) {
      await expect(completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: "000000" })).rejects.toMatchObject({
        code: "CHALLENGE_FAILED",
      });
      expect(await attempts(ch.challengeId)).toBe(i);
    }
    await expect(completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: CODE })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    });
    expect(await db.query(`select 1 from audit_events where event_type = 'emergency.reveal'`)).toHaveLength(0);
  });

  it("expired challenges and unsent codes fail", async () => {
    const g = await insertDrawnGroup(db);
    const ch = await startEmergencyChallenge(db, { groupId: g.id }, g.participants[0]);
    await expect(completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: CODE })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    }); // code not minted yet
    await setCode(ch.challengeId);
    await db.query(`update emergency_challenges set expires_at = now() - interval '1 second' where id = $1`, [ch.challengeId]);
    await expect(completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: CODE })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    });
  });

  it("a challenge from another group can't be used", async () => {
    const g1 = await insertDrawnGroup(db);
    const g2 = await insertDrawnGroup(db);
    const ch = await startEmergencyChallenge(db, { groupId: g1.id }, g1.participants[0]);
    await setCode(ch.challengeId);
    await expect(completeEmergencyReveal(db, { groupId: g2.id }, { challengeId: ch.challengeId, code: CODE })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    });
  });

  it("is rate limited per group", async () => {
    const g = await insertDrawnGroup(db);
    for (let i = 0; i < 5; i++) await startEmergencyChallenge(db, { groupId: g.id }, g.participants[0]);
    await expect(startEmergencyChallenge(db, { groupId: g.id }, g.participants[0])).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("a participant capability can't authenticate as the organizer (route guard)", async () => {
    const g = await insertDrawnGroup(db);
    const pToken = await issueToken(db, { kind: "participant", groupId: g.id, participantId: g.participants[0] });
    await expect(authenticateOrganizer(db, pToken, g.id)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
