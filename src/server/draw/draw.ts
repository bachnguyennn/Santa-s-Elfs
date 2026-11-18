// OWNER: draw/algorithm agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { DrawReadinessDTO } from "@/lib/contracts";

export async function getDrawReadiness(db: Db, groupId: string): Promise<DrawReadinessDTO> {
  void db; void groupId;
  throw new Error("not implemented");
}

/**
 * The single drawing service used by manual AND scheduled draws. Atomic and
 * idempotent: locks the group row; if already drawn returns "already_drawn".
 * Throws AppError NOT_ENOUGH_PARTICIPANTS / IMPOSSIBLE_EXCLUSIONS / GROUP_LOCKED.
 * Persists assignments + aliases, locks membership, queues assignment_ready emails.
 */
export async function drawGroup(db: Db, groupId: string, opts: { trigger: "manual" | "scheduled" }): Promise<{ status: "drawn" | "already_drawn" }> {
  void db; void groupId; void opts;
  throw new Error("not implemented");
}

/** Cron: draw every open scheduled group whose draw_at <= now and draw_error is null. */
export async function processDueDraws(db: Db, now?: Date): Promise<{ drawn: number; failed: number }> {
  void db; void now;
  throw new Error("not implemented");
}
