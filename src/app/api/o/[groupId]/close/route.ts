import { api } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { closeGroup } from "@/server/services/groups";

export const POST = api<{ groupId: string }>(async ({ db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  await closeGroup(db, ctx);
  return { ok: true };
});
