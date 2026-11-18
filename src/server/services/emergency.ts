// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { OrganizerCtx } from "../tokens";
import type { EmergencyChallengeDTO, EmergencyRevealDTO } from "@/lib/contracts";

/** Create a challenge for one participant and queue an emergency_code email to the organizer. Rate limited. */
export async function startEmergencyChallenge(db: Db, ctx: OrganizerCtx, participantId: string): Promise<EmergencyChallengeDTO> {
  void db; void ctx; void participantId;
  throw new Error("not implemented");
}

/** Verify the code (max 5 attempts, 10 min expiry, single use), audit, and reveal ONE assignment. */
export async function completeEmergencyReveal(
  db: Db,
  ctx: OrganizerCtx,
  input: { challengeId: string; code: string },
): Promise<EmergencyRevealDTO> {
  void db; void ctx; void input;
  throw new Error("not implemented");
}
