// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { OrganizerCtx } from "../tokens";
import type { JoinGroupInput, OrganizerParticipantDTO, ParticipantDecisionInput, RecoverInput } from "@/lib/contracts";

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
  void db; void inviteCode; void input;
  throw new Error("not implemented");
}

/** Organizer approves / rejects / removes. Approve fails with GROUP_FULL at capacity. */
export async function decideParticipant(
  db: Db,
  ctx: OrganizerCtx,
  participantId: string,
  input: ParticipantDecisionInput,
): Promise<OrganizerParticipantDTO> {
  void db; void ctx; void participantId; void input;
  throw new Error("not implemented");
}

/** Re-send a participant's private link (organizer action). */
export async function resendParticipantLink(db: Db, ctx: OrganizerCtx, participantId: string): Promise<void> {
  void db; void ctx; void participantId;
  throw new Error("not implemented");
}

/**
 * Lost-link recovery. Queues new links ONLY to the registered email address.
 * Always resolves the same way whether or not the email matched (no enumeration).
 */
export async function recoverLinks(db: Db, input: RecoverInput): Promise<void> {
  void db; void input;
  throw new Error("not implemented");
}
