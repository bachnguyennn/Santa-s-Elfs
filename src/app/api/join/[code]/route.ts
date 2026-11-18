import { joinGroupSchema, type JoinResult } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { clientKey, rateLimit } from "@/server/rateLimit";
import { joinGroup } from "@/server/services/enrollment";
import { setParticipantSession } from "@/server/auth";
import { kickEmailWorker } from "@/server/kick";

export const POST = api<{ code: string }>(async ({ req, db, params }): Promise<JoinResult> => {
  await rateLimit(db, `join:ip:${clientKey(req)}`, 10, 600);
  await rateLimit(db, `join:code:${params.code}`, 60, 3600);
  const input = await readJson(req, joinGroupSchema);
  const joined = await joinGroup(db, params.code, input);
  await setParticipantSession(joined.participantId, joined.token);
  kickEmailWorker(db);
  return { participantId: joined.participantId, status: joined.status };
});
