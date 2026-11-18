import "server-only";
import { redirect } from "next/navigation";
import { getDb, type Db } from "./db";
import { requireOrganizer, requireParticipant } from "./auth";
import { AppError } from "./errors";
import type { OrganizerCtx, ParticipantCtx } from "./tokens";

/** For server-component pages under /p/[participantId]: authorize or redirect to /expired. */
export async function participantPage(participantId: string): Promise<{ db: Db; ctx: ParticipantCtx }> {
  const db = await getDb();
  try {
    return { db, ctx: await requireParticipant(db, participantId) };
  } catch (err) {
    if (err instanceof AppError && err.code === "UNAUTHORIZED") redirect("/expired");
    throw err;
  }
}

/** For server-component pages under /o/[groupId]: authorize or redirect to /expired. */
export async function organizerPage(groupId: string): Promise<{ db: Db; ctx: OrganizerCtx }> {
  const db = await getDb();
  try {
    return { db, ctx: await requireOrganizer(db, groupId) };
  } catch (err) {
    if (err instanceof AppError && err.code === "UNAUTHORIZED") redirect("/expired");
    throw err;
  }
}
