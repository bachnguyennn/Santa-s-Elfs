// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { OrganizerCtx } from "../tokens";
import type { ExclusionDTO, ExclusionInput } from "@/lib/contracts";

export async function listExclusions(db: Db, ctx: OrganizerCtx): Promise<ExclusionDTO[]> {
  void db; void ctx;
  throw new Error("not implemented");
}

/** Only while open; both ids must belong to ctx.groupId. symmetric adds both directions. */
export async function addExclusion(db: Db, ctx: OrganizerCtx, input: ExclusionInput): Promise<ExclusionDTO[]> {
  void db; void ctx; void input;
  throw new Error("not implemented");
}

export async function removeExclusion(db: Db, ctx: OrganizerCtx, input: ExclusionInput): Promise<ExclusionDTO[]> {
  void db; void ctx; void input;
  throw new Error("not implemented");
}
