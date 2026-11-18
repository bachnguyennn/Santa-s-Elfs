// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { ParticipantCtx } from "../tokens";
import type { ProfileDTO, ProfileInput } from "@/lib/contracts";

/** Internal: load a participant's profile + wishlist. Callers must already be authorized. */
export async function loadProfile(db: Db, participantId: string): Promise<ProfileDTO> {
  void db; void participantId;
  throw new Error("not implemented");
}

/** Replace the caller's own profile and wishlist. Allowed while pending or approved. */
export async function saveProfile(db: Db, ctx: ParticipantCtx, input: ProfileInput): Promise<ProfileDTO> {
  void db; void ctx; void input;
  throw new Error("not implemented");
}
