import { createGroupSchema, type CreateGroupResult } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { clientKey, rateLimit } from "@/server/rateLimit";
import { createGroup } from "@/server/services/groups";
import { setOrganizerSession, setParticipantSession } from "@/server/auth";
import { kickEmailWorker } from "@/server/kick";
import { env } from "@/server/env";

export const POST = api(async ({ req, db }): Promise<CreateGroupResult> => {
  await rateLimit(db, `create:ip:${clientKey(req)}`, 10, 3600);
  const input = await readJson(req, createGroupSchema);
  await rateLimit(db, `create:email:${input.organizerEmail}`, 5, 86400);
  const created = await createGroup(db, input);
  await setOrganizerSession(created.groupId, created.organizerToken);
  if (created.organizerParticipant) {
    await setParticipantSession(created.organizerParticipant.participantId, created.organizerParticipant.token);
  }
  kickEmailWorker(db);
  return {
    groupId: created.groupId,
    inviteUrl: `${env.appUrl}/j/${created.inviteCode}`,
    organizerParticipantId: created.organizerParticipant?.participantId ?? null,
  };
});
