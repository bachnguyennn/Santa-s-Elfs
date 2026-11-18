// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { ParticipantCtx } from "../tokens";
import type { ParticipantHomeDTO, RecipientViewDTO } from "@/lib/contracts";

export async function getParticipantHome(db: Db, ctx: ParticipantCtx): Promise<ParticipantHomeDTO> {
  void db; void ctx;
  throw new Error("not implemented");
}

/**
 * Reveal the caller's (already persisted) assignment. Idempotent: sets revealed_at
 * the first time, always returns the same recipient. NOT_DRAWN before the drawing.
 * Never draws or redraws.
 */
export async function revealAssignment(db: Db, ctx: ParticipantCtx): Promise<RecipientViewDTO> {
  void db; void ctx;
  throw new Error("not implemented");
}

/** The recipient view if already revealed, else null. */
export async function getRecipientView(db: Db, ctx: ParticipantCtx): Promise<RecipientViewDTO | null> {
  void db; void ctx;
  throw new Error("not implemented");
}
