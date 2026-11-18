import "server-only";
import { cookies } from "next/headers";
import type { Db } from "./db/types";
import {
  authenticateOrganizer,
  authenticateParticipant,
  TOKEN_TTL_DAYS,
  type OrganizerCtx,
  type ParticipantCtx,
} from "./tokens";
import { env } from "./env";

// Capability tokens live in httpOnly cookies scoped per participant / per group,
// so one browser can hold several roles (e.g. organizer who also participates).
const participantCookie = (participantId: string) => `se_p_${participantId}`;
const organizerCookie = (groupId: string) => `se_o_${groupId}`;

const cookieOpts = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60,
});

export async function setParticipantSession(participantId: string, rawToken: string) {
  (await cookies()).set(participantCookie(participantId), rawToken, cookieOpts());
}

export async function setOrganizerSession(groupId: string, rawToken: string) {
  (await cookies()).set(organizerCookie(groupId), rawToken, cookieOpts());
}

/** Throws AppError(UNAUTHORIZED) unless this browser holds a valid participant capability. */
export async function requireParticipant(db: Db, participantId: string): Promise<ParticipantCtx> {
  const raw = (await cookies()).get(participantCookie(participantId))?.value;
  return authenticateParticipant(db, raw, participantId);
}

/** Throws AppError(UNAUTHORIZED) unless this browser holds a valid organizer capability for the group. */
export async function requireOrganizer(db: Db, groupId: string): Promise<OrganizerCtx> {
  const raw = (await cookies()).get(organizerCookie(groupId))?.value;
  return authenticateOrganizer(db, raw, groupId);
}
