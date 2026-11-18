import { api, readJson } from "@/server/http";
import { requireParticipant } from "@/server/auth";
import { getThread, sendMessage } from "@/server/services/messaging";
import { kickEmailWorker } from "@/server/kick";
import { sendMessageSchema, threadSchema } from "@/lib/contracts";

export const GET = api<{ pid: string }>(async ({ req, db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  const thread = threadSchema.parse(new URL(req.url).searchParams.get("thread"));
  return getThread(db, ctx, thread);
});

export const POST = api<{ pid: string }>(async ({ req, db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  const input = await readJson(req, sendMessageSchema);
  const result = await sendMessage(db, ctx, input);
  kickEmailWorker(db);
  return result;
});
