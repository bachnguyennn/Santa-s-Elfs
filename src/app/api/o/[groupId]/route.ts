import { updateGroupSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { deleteGroup, getOrganizerDashboard, updateGroupSettings } from "@/server/services/groups";

type Params = { groupId: string };

export const GET = api<Params>(async ({ db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  return getOrganizerDashboard(db, ctx);
});

export const PATCH = api<Params>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  const input = await readJson(req, updateGroupSchema);
  return updateGroupSettings(db, ctx, input);
});

export const DELETE = api<Params>(async ({ db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  await deleteGroup(db, ctx);
  return { ok: true };
});
