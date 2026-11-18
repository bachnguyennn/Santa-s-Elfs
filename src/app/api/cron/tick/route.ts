import { getDb } from "@/server/db";
import { env } from "@/server/env";
import { checkCronAuth, runCronTick } from "@/server/cron";

// Scheduled draws, email retries and retention. Called by GitHub Actions (every
// 10 min) and a daily Vercel cron backstop, both with `Authorization: Bearer $CRON_SECRET`.
export const maxDuration = 60;

export async function GET(req: Request) {
  const status = checkCronAuth(req.headers.get("authorization"), env.cronSecret, env.isProduction);
  if (status === 503) return Response.json({ error: { code: "INTERNAL", message: "CRON_SECRET is not configured." } }, { status });
  if (status === 401) return Response.json({ error: { code: "UNAUTHORIZED", message: "Invalid cron secret." } }, { status });
  const result = await runCronTick(await getDb());
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
