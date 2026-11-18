import { emergencyChallengeSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { startEmergencyChallenge } from "@/server/services/emergency";
import { kickEmailWorker } from "@/server/kick";

export const POST = api<{ groupId: string }>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  const { participantId } = await readJson(req, emergencyChallengeSchema);
  const result = await startEmergencyChallenge(db, ctx, participantId);
  kickEmailWorker(db);
  return result;
});
