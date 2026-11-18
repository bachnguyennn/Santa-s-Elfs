import type { Db } from "@/server/db/types";
import { generateInviteCode } from "@/server/tokens";

/** Low-level fixtures via raw SQL (independent of the service layer). */
export async function insertGroup(
  db: Db,
  overrides: Partial<{ name: string; requiresApproval: boolean; drawMethod: "manual" | "scheduled"; drawAt: string | null; signupDeadline: string | null; status: string }> = {},
): Promise<{ id: string; inviteCode: string }> {
  const inviteCode = generateInviteCode();
  const drawMethod = overrides.drawMethod ?? "manual";
  const rows = await db.query<{ id: string }>(
    `insert into groups (invite_code, name, organizer_name, organizer_email, currency, draw_method, draw_at, signup_deadline, timezone, requires_approval, budget_min_cents, budget_max_cents)
     values ($1, $2, 'Olive Organizer', 'olive@example.com', 'USD', $3, $4, $5, 'America/Toronto', $6, 2000, 4000) returning id`,
    [inviteCode, overrides.name ?? "Test Group", drawMethod, overrides.drawAt ?? (drawMethod === "scheduled" ? new Date(Date.now() + 86400000).toISOString() : null), overrides.signupDeadline ?? null, overrides.requiresApproval ?? false],
  );
  return { id: rows[0].id, inviteCode };
}

export async function insertParticipants(db: Db, groupId: string, count: number, status: "approved" | "pending" = "approved"): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const rows = await db.query<{ id: string }>(
      `insert into participants (group_id, name, email, status) values ($1, $2, $3, $4) returning id`,
      [groupId, `Person ${i + 1}`, `person${i + 1}.${Math.random().toString(36).slice(2, 8)}@example.com`, status],
    );
    ids.push(rows[0].id);
  }
  return ids;
}
