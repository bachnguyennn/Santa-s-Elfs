// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import { issueToken, revokeParticipantTokens, type OrganizerCtx } from "../tokens";
import {
  joinGroupSchema,
  participantDecisionSchema,
  recoverSchema,
  type JoinGroupInput,
  type OrganizerParticipantDTO,
  type ParticipantDecisionInput,
  type RecoverInput,
} from "@/lib/contracts";
import { AppError, mapDbError } from "../errors";
import { enqueueEmail } from "../email/queue";
import { audit } from "../audit";
import { rateLimit } from "../rateLimit";
import { closedReasonOf, isUuid, loadOrganizerParticipants } from "./groups";

const INVITE_RE = /^[A-Za-z0-9_-]{16,64}$/;

export const DUPLICATE_EMAIL_MESSAGE =
  "That email has already joined this group. Use “Email me my link” to get your private link again.";

const notFound = () => new AppError("NOT_FOUND", "We couldn't find that participant in this group.");

/**
 * Join via invite code. Approved immediately (open groups, capacity permitting)
 * or pending (approval groups). Returns a fresh participant token for the joining
 * browser session. Duplicate email -> DUPLICATE_EMAIL (never reveals or re-issues
 * access to the existing participant; they must use recovery).
 */
export async function joinGroup(
  db: Db,
  inviteCode: string,
  input: JoinGroupInput,
): Promise<{ participantId: string; groupId: string; status: "pending" | "approved"; token: string }> {
  const v = joinGroupSchema.parse(input);
  if (!INVITE_RE.test(inviteCode)) throw new AppError("NOT_FOUND", "This invite link isn't valid.");
  try {
    return await db.tx(async (t) => {
      const [g] = await t.query<{
        id: string;
        status: string;
        signup_deadline: Date | null;
        requires_approval: boolean;
        organizer_email: string;
        approved_count: number;
      }>(
        `select g.id, g.status, g.signup_deadline, g.requires_approval, g.organizer_email,
           (select count(*)::int from participants p where p.group_id = g.id and p.status = 'approved') as approved_count
         from groups g where g.invite_code = $1`,
        [inviteCode],
      );
      if (!g) throw new AppError("NOT_FOUND", "This invite link isn't valid.");
      switch (closedReasonOf(g)) {
        case "drawn":
        case "closed":
          throw new AppError("GROUP_LOCKED", "Names have already been drawn for this group.");
        case "deadline":
          throw new AppError("SIGNUPS_CLOSED", "Signups for this group have closed.");
        case "full":
          throw new AppError("GROUP_FULL", "This group already has 20 participants.");
      }
      const dup = await t.query(`select 1 from participants where group_id = $1 and email = $2`, [g.id, v.email]);
      if (dup.length) throw new AppError("DUPLICATE_EMAIL", DUPLICATE_EMAIL_MESSAGE);

      const status = g.requires_approval ? "pending" : "approved";
      // The participants_guard trigger is the final authority on capacity / lock under concurrency.
      const [p] = await t.query<{ id: string }>(
        `insert into participants (group_id, name, email, status, decided_at)
         values ($1, $2, $3, $4, case when $4 = 'approved' then now() end) returning id`,
        [g.id, v.name, v.email, status],
      );
      const token = await issueToken(t, { kind: "participant", groupId: g.id, participantId: p.id });
      await enqueueEmail(t, v.email, { template: "participant_welcome", groupId: g.id, participantId: p.id }, `participant_welcome:${p.id}`);
      if (status === "pending") {
        await enqueueEmail(
          t,
          g.organizer_email,
          { template: "join_request_received", groupId: g.id, participantId: p.id },
          `join_request_received:${p.id}`,
        );
      }
      await audit(t, { groupId: g.id, actor: "participant", type: "participant.joined", subjectParticipantId: p.id, metadata: { status } });
      return { participantId: p.id, groupId: g.id, status, token } as const;
    });
  } catch (err) {
    const mapped = mapDbError(err);
    if (mapped instanceof AppError && mapped.code === "DUPLICATE_EMAIL") {
      throw new AppError("DUPLICATE_EMAIL", DUPLICATE_EMAIL_MESSAGE);
    }
    throw mapped;
  }
}

const TARGET_STATUS = { approve: "approved", reject: "rejected", remove: "removed" } as const;

/** Organizer approves / rejects / removes. Approve fails with GROUP_FULL at capacity. */
export async function decideParticipant(
  db: Db,
  ctx: OrganizerCtx,
  participantId: string,
  input: ParticipantDecisionInput,
): Promise<OrganizerParticipantDTO> {
  const { action } = participantDecisionSchema.parse(input);
  if (!isUuid(participantId)) throw notFound();
  try {
    await db.tx(async (t) => {
      const [p] = await t.query<{ email: string; status: string; decided_at: Date | string | null }>(
        `select email, status, decided_at from participants where id = $1 and group_id = $2 for update`,
        [participantId, ctx.groupId],
      );
      if (!p) throw notFound();
      const next = TARGET_STATUS[action];
      if (p.status === next) return; // idempotent
      // Trigger enforces allowed transitions, capacity and the post-draw lock.
      await t.query(`update participants set status = $2, decided_at = now() where id = $1`, [participantId, next]);
      if (action === "remove") await revokeParticipantTokens(t, participantId);
      // One email per decision: keyed by the previous decision, so a later re-approval
      // (after a removal or rejection) still sends a fresh private link.
      const cycle = p.decided_at ? new Date(p.decided_at).toISOString() : "initial";
      if (action === "approve") {
        await enqueueEmail(t, p.email, { template: "join_approved", groupId: ctx.groupId, participantId }, `join_approved:${participantId}:${cycle}`);
      } else if (action === "reject") {
        await enqueueEmail(t, p.email, { template: "join_rejected", groupId: ctx.groupId, participantId }, `join_rejected:${participantId}:${cycle}`);
      }
      await audit(t, {
        groupId: ctx.groupId,
        actor: "organizer",
        type: `participant.${next}`,
        subjectParticipantId: participantId,
        metadata: { from: p.status },
      });
    });
  } catch (err) {
    throw mapDbError(err);
  }
  const [dto] = await loadOrganizerParticipants(db, ctx.groupId, participantId);
  return dto;
}

/** Re-send a participant's private link (organizer action). */
export async function resendParticipantLink(db: Db, ctx: OrganizerCtx, participantId: string): Promise<void> {
  if (!isUuid(participantId)) throw notFound();
  const [p] = await db.query<{ email: string; status: string }>(
    `select email, status from participants where id = $1 and group_id = $2`,
    [participantId, ctx.groupId],
  );
  if (!p) throw notFound();
  if (p.status !== "pending" && p.status !== "approved") {
    throw new AppError("CONFLICT", "Links can only be sent to pending or approved participants.");
  }
  await rateLimit(db, `resend:${participantId}`, 3, 3600);
  await db.tx(async (t) => {
    await enqueueEmail(t, p.email, { template: "participant_recovery", groupId: ctx.groupId, participantId });
    await audit(t, { groupId: ctx.groupId, actor: "organizer", type: "participant.link_resent", subjectParticipantId: participantId });
  });
}

/**
 * Lost-link recovery. Queues new links ONLY to the registered email address.
 * Always resolves the same way whether or not the email matched (no enumeration).
 */
export async function recoverLinks(db: Db, input: RecoverInput): Promise<void> {
  const { email, inviteCode } = recoverSchema.parse(input);
  try {
    await rateLimit(db, `recover:email:${email}`, 3, 3600);
  } catch (err) {
    if (err instanceof AppError && err.code === "RATE_LIMITED") return; // silent: identical response
    throw err;
  }

  await db.tx(async (t) => {
    let groups: { id: string }[];
    let participants: { id: string; group_id: string; email: string }[];
    if (inviteCode !== undefined) {
      if (!INVITE_RE.test(inviteCode)) return;
      groups = await t.query(`select id from groups where invite_code = $1 and organizer_email = $2`, [inviteCode, email]);
      participants = await t.query(
        `select p.id, p.group_id, p.email from participants p join groups g on g.id = p.group_id
          where g.invite_code = $1 and p.email = $2 and p.status in ('pending', 'approved')`,
        [inviteCode, email],
      );
    } else {
      groups = await t.query(`select id from groups where organizer_email = $1 order by created_at desc limit 10`, [email]);
      participants = await t.query(
        `select id, group_id, email from participants where email = $1 and status in ('pending', 'approved')
          order by created_at desc limit 10`,
        [email],
      );
    }
    // Recipient is always the stored (registered) address, which equals the normalized input here.
    for (const g of groups) {
      await enqueueEmail(t, email, { template: "organizer_recovery", groupId: g.id });
      await audit(t, { groupId: g.id, actor: "system", type: "organizer.link_recovered" });
    }
    for (const p of participants) {
      await enqueueEmail(t, p.email, { template: "participant_recovery", groupId: p.group_id, participantId: p.id });
      await audit(t, { groupId: p.group_id, actor: "system", type: "participant.link_recovered", subjectParticipantId: p.id });
    }
  });
}
