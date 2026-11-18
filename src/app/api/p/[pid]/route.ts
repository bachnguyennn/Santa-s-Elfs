import { api } from "@/server/http";
import { requireParticipant } from "@/server/auth";
import { getParticipantHome } from "@/server/services/participant";

export const GET = api<{ pid: string }>(async ({ db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  return getParticipantHome(db, ctx);
});
