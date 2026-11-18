import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { Db } from "./db/types";
import { AppError } from "./errors";

/** 256-bit capability token, URL-safe. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Public invite code (not a credential; only allows viewing the invite + joining). */
export function generateInviteCode(): string {
  return randomBytes(12).toString("base64url");
}

/** 6-digit numeric one-time code. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const TOKEN_TTL_DAYS = 180;

export type TokenKind = "participant" | "organizer";

/** Mint and persist a capability token; returns the raw token (only time it exists in plaintext). */
export async function issueToken(
  db: Db,
  opts: { kind: TokenKind; groupId: string; participantId?: string; ttlDays?: number },
): Promise<string> {
  const raw = generateToken();
  const ttl = opts.ttlDays ?? TOKEN_TTL_DAYS;
  await db.query(
    `insert into access_tokens (token_hash, kind, group_id, participant_id, expires_at)
     values ($1, $2, $3, $4, now() + make_interval(days => $5))`,
    [sha256(raw), opts.kind, opts.groupId, opts.participantId ?? null, ttl],
  );
  return raw;
}

export interface TokenRecord {
  kind: TokenKind;
  groupId: string;
  participantId: string | null;
}

/** Resolve a raw token to its scope, or null if unknown, expired, or revoked. */
export async function resolveToken(db: Db, raw: string | undefined | null): Promise<TokenRecord | null> {
  if (!raw || raw.length < 32 || raw.length > 128) return null;
  const rows = await db.query<{ kind: TokenKind; group_id: string; participant_id: string | null }>(
    `update access_tokens set last_used_at = now()
      where token_hash = $1 and revoked_at is null and expires_at > now()
      returning kind, group_id, participant_id`,
    [sha256(raw)],
  );
  const r = rows[0];
  return r ? { kind: r.kind, groupId: r.group_id, participantId: r.participant_id } : null;
}

/** Revoke every token for a participant (e.g. after removal). */
export async function revokeParticipantTokens(db: Db, participantId: string) {
  await db.query(`update access_tokens set revoked_at = now() where participant_id = $1 and revoked_at is null`, [
    participantId,
  ]);
}

/** Proof that the caller holds a valid participant capability for this participant. */
export interface ParticipantCtx {
  readonly participantId: string;
  readonly groupId: string;
}
/** Proof that the caller holds a valid organizer capability for this group. */
export interface OrganizerCtx {
  readonly groupId: string;
}

export async function authenticateParticipant(db: Db, raw: string | undefined, participantId: string): Promise<ParticipantCtx> {
  const t = await resolveToken(db, raw);
  if (!t || t.kind !== "participant" || t.participantId !== participantId) {
    throw new AppError("UNAUTHORIZED", "This private link is invalid or has expired.");
  }
  return { participantId, groupId: t.groupId };
}

export async function authenticateOrganizer(db: Db, raw: string | undefined, groupId: string): Promise<OrganizerCtx> {
  const t = await resolveToken(db, raw);
  if (!t || t.kind !== "organizer" || t.groupId !== groupId) {
    throw new AppError("UNAUTHORIZED", "This organizer link is invalid or has expired.");
  }
  return { groupId };
}

/** Hash format for emergency one-time codes (bound to the challenge id). Shared by the email worker and verifier. */
export function emergencyCodeHash(challengeId: string, code: string): string {
  return sha256(`${challengeId}:${code}`);
}
