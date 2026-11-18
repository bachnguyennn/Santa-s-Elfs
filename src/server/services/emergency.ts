// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import { emergencyCodeHash, safeEqualHex, type OrganizerCtx } from "../tokens";
import {
  emergencyChallengeSchema,
  emergencyRevealSchema,
  type EmergencyChallengeDTO,
  type EmergencyRevealDTO,
} from "@/lib/contracts";
import { AppError } from "../errors";
import { enqueueEmail } from "../email/queue";
import { audit } from "../audit";
import { rateLimit } from "../rateLimit";
import { iso } from "./groups";

export const EMERGENCY_MAX_ATTEMPTS = 5;
const CHALLENGE_FAILED_MESSAGE = "That code didn't work. It may be wrong, expired or already used.";

/** "olive@example.com" -> "o•••@example.com" */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "•••";
  return `${email[0]}•••${email.slice(at)}`;
}

/** Create a challenge for one participant and queue an emergency_code email to the organizer. Rate limited. */
export async function startEmergencyChallenge(db: Db, ctx: OrganizerCtx, participantId: string): Promise<EmergencyChallengeDTO> {
  emergencyChallengeSchema.parse({ participantId });
  const [g] = await db.query<{ status: string; organizer_email: string }>(
    `select status, organizer_email from groups where id = $1`,
    [ctx.groupId],
  );
  if (!g) throw new AppError("NOT_FOUND", "This group no longer exists.");
  if (g.status !== "drawn" && g.status !== "closed") throw new AppError("NOT_DRAWN", "Names haven't been drawn yet.");
  const [p] = await db.query(`select 1 from participants where id = $1 and group_id = $2 and status = 'approved'`, [
    participantId,
    ctx.groupId,
  ]);
  if (!p) throw new AppError("NOT_FOUND", "We couldn't find that participant in this group.");

  await rateLimit(db, `emergency:${ctx.groupId}`, 5, 3600);

  return db.tx(async (t) => {
    const [c] = await t.query<{ id: string; expires_at: Date | string }>(
      `insert into emergency_challenges (group_id, participant_id, expires_at)
       values ($1, $2, now() + interval '10 minutes') returning id, expires_at`,
      [ctx.groupId, participantId],
    );
    // The worker mints the code at send time and stores emergencyCodeHash(challengeId, code).
    await enqueueEmail(t, g.organizer_email, { template: "emergency_code", groupId: ctx.groupId, challengeId: c.id });
    await audit(t, {
      groupId: ctx.groupId,
      actor: "organizer",
      type: "emergency.challenge_started",
      subjectParticipantId: participantId,
    });
    return { challengeId: c.id, expiresAt: iso(c.expires_at)!, sentTo: maskEmail(g.organizer_email) };
  });
}

/** Verify the code (max 5 attempts, 10 min expiry, single use), audit, and reveal ONE assignment. */
export async function completeEmergencyReveal(
  db: Db,
  ctx: OrganizerCtx,
  input: { challengeId: string; code: string },
): Promise<EmergencyRevealDTO> {
  const v = emergencyRevealSchema.parse(input);
  const fail = () => new AppError("CHALLENGE_FAILED", CHALLENGE_FAILED_MESSAGE);

  // The transaction commits in every case (so a failed attempt is persisted); we throw afterwards.
  const result = await db.tx(async (t): Promise<EmergencyRevealDTO | null> => {
    const [c] = await t.query<{
      id: string;
      participant_id: string;
      code_hash: string | null;
      attempts: number;
      expired: boolean;
      consumed_at: Date | null;
    }>(
      `select id, participant_id, code_hash, attempts, expires_at <= now() as expired, consumed_at
         from emergency_challenges where id = $1 and group_id = $2 for update`,
      [v.challengeId, ctx.groupId],
    );
    if (!c || c.consumed_at || c.expired || c.attempts >= EMERGENCY_MAX_ATTEMPTS || !c.code_hash) return null;

    if (!safeEqualHex(emergencyCodeHash(c.id, v.code), c.code_hash)) {
      await t.query(`update emergency_challenges set attempts = attempts + 1 where id = $1`, [c.id]);
      return null;
    }

    const [r] = await t.query<{ participant_name: string; recipient_name: string }>(
      `select giver.name as participant_name, recipient.name as recipient_name
         from assignments a
         join participants giver on giver.id = a.giver_id
         join participants recipient on recipient.id = a.recipient_id
        where a.group_id = $1 and a.giver_id = $2`,
      [ctx.groupId, c.participant_id],
    );
    if (!r) return null;
    await t.query(`update emergency_challenges set consumed_at = now(), attempts = attempts + 1 where id = $1`, [c.id]);
    // Audit the reveal of ONE participant's assignment. The recipient is never recorded.
    await audit(t, {
      groupId: ctx.groupId,
      actor: "organizer",
      type: "emergency.reveal",
      subjectParticipantId: c.participant_id,
      metadata: { challengeId: c.id },
    });
    return { participantName: r.participant_name, recipientName: r.recipient_name };
  });
  if (!result) throw fail();
  return result;
}
