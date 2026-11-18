import { participantDecisionSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { decideParticipant } from "@/server/services/enrollment";
import { kickEmailWorker } from "@/server/kick";

export const PATCH = api<{ groupId: string; pid: string }>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  const input = await readJson(req, participantDecisionSchema);
  const result = await decideParticipant(db, ctx, params.pid, input);
  kickEmailWorker(db);
  return result;
});
