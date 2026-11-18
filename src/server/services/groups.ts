// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { OrganizerCtx } from "../tokens";
import type { CreateGroupInput, InvitePreviewDTO, OrganizerDashboardDTO, UpdateGroupInput } from "@/lib/contracts";

export interface CreatedGroup {
  groupId: string;
  inviteCode: string;
  organizerToken: string;
  organizerParticipant: { participantId: string; token: string } | null;
}

/** Validate (createGroupSchema), create group (+ organizer participant if opted in), mint tokens, queue organizer_welcome. */
export async function createGroup(db: Db, input: CreateGroupInput): Promise<CreatedGroup> {
  void db; void input;
  throw new Error("not implemented");
}

/** Public invite preview; null if the code is unknown. Never includes participant names. */
export async function getInvitePreview(db: Db, inviteCode: string): Promise<InvitePreviewDTO | null> {
  void db; void inviteCode;
  throw new Error("not implemented");
}

export async function getOrganizerDashboard(db: Db, ctx: OrganizerCtx): Promise<OrganizerDashboardDTO> {
  void db; void ctx;
  throw new Error("not implemented");
}

/** Only while status = 'open'. Clears groups.draw_error. */
export async function updateGroupSettings(db: Db, ctx: OrganizerCtx, input: UpdateGroupInput): Promise<OrganizerDashboardDTO> {
  void db; void ctx; void input;
  throw new Error("not implemented");
}

/** Mark the exchange finished (status 'closed'): no further changes; messaging becomes read-only. */
export async function closeGroup(db: Db, ctx: OrganizerCtx): Promise<void> {
  void db; void ctx;
  throw new Error("not implemented");
}

/** Permanently delete the group and all participant data (cascade). */
export async function deleteGroup(db: Db, ctx: OrganizerCtx): Promise<void> {
  void db; void ctx;
  throw new Error("not implemented");
}
