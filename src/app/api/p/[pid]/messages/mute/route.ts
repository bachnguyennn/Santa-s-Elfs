import { api, readJson } from "@/server/http";
import { requireParticipant } from "@/server/auth";
import { setSantaMuted } from "@/server/services/messaging";
import { muteSchema } from "@/lib/contracts";

export const POST = api<{ pid: string }>(async ({ req, db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  const { muted } = await readJson(req, muteSchema);
  return setSantaMuted(db, ctx, muted);
});
