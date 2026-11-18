import { emergencyRevealSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { requireOrganizer } from "@/server/auth";
import { completeEmergencyReveal } from "@/server/services/emergency";

export const POST = api<{ groupId: string }>(async ({ req, db, params }) => {
  const ctx = await requireOrganizer(db, params.groupId);
  return completeEmergencyReveal(db, ctx, await readJson(req, emergencyRevealSchema));
});
