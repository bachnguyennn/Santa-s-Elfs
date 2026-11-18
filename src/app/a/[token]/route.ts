import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { resolveToken } from "@/server/tokens";
import { clientKey, rateLimit } from "@/server/rateLimit";
import { setOrganizerSession, setParticipantSession } from "@/server/auth";
import { AppError } from "@/server/errors";
import { logError } from "@/server/log";

/**
 * Exchange a private link token for an httpOnly cookie, then redirect to a
 * clean URL so the token doesn't linger in history or Referer headers.
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url), 303);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  };
  try {
    const db = await getDb();
    try {
      await rateLimit(db, `link:ip:${clientKey(req)}`, 30, 600);
    } catch (err) {
      if (err instanceof AppError && err.code === "RATE_LIMITED") return go("/expired?reason=rate");
      throw err;
    }
    const { token } = await ctx.params;
    const t = await resolveToken(db, token);
    if (t?.kind === "participant" && t.participantId) {
      await setParticipantSession(t.participantId, token);
      return go(`/p/${t.participantId}`);
    }
    if (t?.kind === "organizer") {
      await setOrganizerSession(t.groupId, token);
      return go(`/o/${t.groupId}`);
    }
    return go("/expired");
  } catch (err) {
    logError("link.exchange_failed", err);
    return go("/expired");
  }
}
