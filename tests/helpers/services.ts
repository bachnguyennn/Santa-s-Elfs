import type { Db } from "@/server/db/types";
import type { CreateGroupInput } from "@/lib/contracts";
import { insertGroup, insertParticipants } from "./fixtures";

/** "YYYY-MM-DDTHH:mm" wall time `days` from now (UTC wall clock; tests use timezone "UTC"). */
export function localIn(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 16);
}

export function groupInput(overrides: Partial<CreateGroupInput> = {}): CreateGroupInput {
  return {
    name: "Office Party",
    organizerName: "Olive",
    organizerEmail: "Olive@Example.com",
    organizerParticipates: false,
    budgetMin: 20,
    budgetMax: 40.5,
    currency: "USD",
    drawMethod: "manual",
    timezone: "UTC",
    requiresApproval: false,
    ...overrides,
  };
}

/**
 * A drawn group built with raw SQL (independent of drawGroup): n approved
 * participants in a cycle p[i] -> p[i+1], each with an alias.
 */
export async function insertDrawnGroup(db: Db, n = 3): Promise<{ id: string; inviteCode: string; participants: string[] }> {
  const g = await insertGroup(db);
  const participants = await insertParticipants(db, g.id, n);
  for (let i = 0; i < n; i++) {
    await db.query(`update participants set alias = $2 where id = $1`, [participants[i], `Alias ${i + 1}`]);
    await db.query(`insert into assignments (group_id, giver_id, recipient_id) values ($1, $2, $3)`, [
      g.id,
      participants[i],
      participants[(i + 1) % n],
    ]);
  }
  await db.query(`update groups set status = 'drawn', drawn_at = now() where id = $1`, [g.id]);
  return { ...g, participants };
}

export async function emailJobs(db: Db, groupId?: string) {
  return db.query<{ to_email: string; template: string; participant_id: string | null; dedupe_key: string | null }>(
    `select to_email, template, participant_id, dedupe_key from email_jobs ${groupId ? "where group_id = $1" : ""} order by created_at`,
    groupId ? [groupId] : [],
  );
}
