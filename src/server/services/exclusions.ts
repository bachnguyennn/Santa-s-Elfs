// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { OrganizerCtx } from "../tokens";
import { exclusionSchema, removeExclusionSchema, type ExclusionDTO, type ExclusionInput } from "@/lib/contracts";
import { AppError } from "../errors";
import { audit } from "../audit";

export async function listExclusions(db: Db, ctx: OrganizerCtx): Promise<ExclusionDTO[]> {
  const rows = await db.query<{ giver_id: string; receiver_id: string }>(
    `select giver_id, receiver_id from exclusions where group_id = $1 order by created_at, giver_id, receiver_id`,
    [ctx.groupId],
  );
  return rows.map((r) => ({ giverId: r.giver_id, receiverId: r.receiver_id }));
}

/** Locks the group row, requires status 'open' and both participants in ctx.groupId. */
async function assertEditable(t: Db, ctx: OrganizerCtx, giverId: string, receiverId: string) {
  const [g] = await t.query<{ status: string }>(`select status from groups where id = $1 for update`, [ctx.groupId]);
  if (!g) throw new AppError("NOT_FOUND", "This group no longer exists.");
  if (g.status !== "open") throw new AppError("GROUP_LOCKED", "Exclusions can't be changed after names are drawn.");
  const [{ n }] = await t.query<{ n: number }>(
    `select count(*)::int as n from participants where group_id = $1 and id in ($2, $3)`,
    [ctx.groupId, giverId, receiverId],
  );
  if (n !== 2) throw new AppError("NOT_FOUND", "Both people must be in this group.");
}

/** Only while open; both ids must belong to ctx.groupId. symmetric adds both directions. */
export async function addExclusion(db: Db, ctx: OrganizerCtx, input: ExclusionInput): Promise<ExclusionDTO[]> {
  const v = exclusionSchema.parse(input);
  await db.tx(async (t) => {
    await assertEditable(t, ctx, v.giverId, v.receiverId);
    const pairs = v.symmetric ? [[v.giverId, v.receiverId], [v.receiverId, v.giverId]] : [[v.giverId, v.receiverId]];
    for (const [giver, receiver] of pairs) {
      await t.query(
        `insert into exclusions (group_id, giver_id, receiver_id) values ($1, $2, $3) on conflict do nothing`,
        [ctx.groupId, giver, receiver],
      );
    }
    await audit(t, { groupId: ctx.groupId, actor: "organizer", type: "exclusion.added", metadata: { symmetric: v.symmetric } });
  });
  return listExclusions(db, ctx);
}

export async function removeExclusion(db: Db, ctx: OrganizerCtx, input: ExclusionInput): Promise<ExclusionDTO[]> {
  const v = removeExclusionSchema.parse(input);
  await db.tx(async (t) => {
    await assertEditable(t, ctx, v.giverId, v.receiverId);
    await t.query(
      `delete from exclusions where group_id = $1
         and ((giver_id = $2 and receiver_id = $3) or ($4 and giver_id = $3 and receiver_id = $2))`,
      [ctx.groupId, v.giverId, v.receiverId, v.symmetric],
    );
    await audit(t, { groupId: ctx.groupId, actor: "organizer", type: "exclusion.removed", metadata: { symmetric: v.symmetric } });
  });
  return listExclusions(db, ctx);
}
