import { exclusionSchema, removeExclusionSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { addExclusion, removeExclusion } from "@/server/services/exclusions";

type Params = { groupId: string };

export const POST = api<Params>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  return addExclusion(db, ctx, await readJson(req, exclusionSchema));
});

export const DELETE = api<Params>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  return removeExclusion(db, ctx, await readJson(req, removeExclusionSchema));
});
