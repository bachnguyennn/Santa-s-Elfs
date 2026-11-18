import { profileSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireParticipant } from "@/server/auth";
import { saveProfile } from "@/server/services/profiles";

export const PUT = api<{ pid: string }>(async ({ req, db, params }) => {
  const ctx = await requireParticipant(db, params.pid);
  return saveProfile(db, ctx, await readJson(req, profileSchema));
});
