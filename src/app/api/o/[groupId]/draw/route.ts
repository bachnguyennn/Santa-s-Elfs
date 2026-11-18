import { drawSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { rateLimit } from "@/server/rateLimit";
import { kickEmailWorker } from "@/server/kick";
import { drawGroup, getDrawReadiness } from "@/server/draw/draw";

type Params = { groupId: string };

/** GET /api/o/[groupId]/draw -> DrawReadinessDTO */
export const GET = api<Params>(async ({ db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  return getDrawReadiness(db, ctx.groupId);
});

/** POST /api/o/[groupId]/draw { confirm: true } -> { status: "drawn" | "already_drawn" } */
export const POST = api<Params>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  await readJson(req, drawSchema);
  await rateLimit(db, `draw:${ctx.groupId}`, 10, 3600);
  const result = await drawGroup(db, ctx.groupId, { trigger: "manual" });
  if (result.status === "drawn") kickEmailWorker(db);
  return result;
});
