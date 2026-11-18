import { recoverSchema } from "@/lib/contracts";
import { api, readJson } from "@/server/http";
import { clientKey, rateLimit } from "@/server/rateLimit";
import { recoverLinks } from "@/server/services/enrollment";
import { kickEmailWorker } from "@/server/kick";

export const POST = api(async ({ req, db }) => {
  await rateLimit(db, `recover:ip:${clientKey(req)}`, 10, 3600);
  const input = await readJson(req, recoverSchema);
  await recoverLinks(db, input);
  kickEmailWorker(db);
  return { ok: true }; // always generic: never reveals whether the email matched
});
