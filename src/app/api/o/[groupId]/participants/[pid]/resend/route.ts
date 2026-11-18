import { api } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { resendParticipantLink } from "@/server/services/enrollment";
import { kickEmailWorker } from "@/server/kick";

export const POST = api<{ groupId: string; pid: string }>(async ({ db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  await resendParticipantLink(db, ctx, params.pid);
  kickEmailWorker(db);
  return { ok: true };
});
