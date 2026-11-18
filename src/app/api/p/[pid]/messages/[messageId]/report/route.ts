import { api } from "@/server/http";
import { requireParticipant } from "@/server/auth";
import { reportMessage } from "@/server/services/messaging";

export const POST = api<{ pid: string; messageId: string }>(async ({ db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  await reportMessage(db, ctx, params.messageId);
  return { ok: true };
});
