import { api } from "@/server/http";
import { requireParticipant } from "@/server/auth";
import { revealAssignment } from "@/server/services/participant";

export const POST = api<{ pid: string }>(async ({ db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  return revealAssignment(db, ctx);
});
