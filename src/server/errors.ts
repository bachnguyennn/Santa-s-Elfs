/** Stable error codes shared with the client (see src/lib/contracts.ts ErrorCode). */
import type { ErrorCode } from "@/lib/contracts";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DUPLICATE_EMAIL: 409,
  GROUP_FULL: 409,
  GROUP_LOCKED: 409,
  SIGNUPS_CLOSED: 409,
  ALREADY_DRAWN: 409,
  NOT_ENOUGH_PARTICIPANTS: 422,
  IMPOSSIBLE_EXCLUSIONS: 422,
  INVALID_TRANSITION: 409,
  NOT_DRAWN: 409,
  MUTED: 403,
  CHALLENGE_FAILED: 403,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.status = STATUS[code];
  }
}

const DB_MESSAGES: Partial<Record<string, [ErrorCode, string]>> = {
  GROUP_FULL: ["GROUP_FULL", "This group already has 20 participants."],
  GROUP_LOCKED: ["GROUP_LOCKED", "Names have been drawn, so membership is locked."],
  INVALID_TRANSITION: ["INVALID_TRANSITION", "That membership change isn't allowed."],
  ALIAS_IMMUTABLE: ["CONFLICT", "Aliases can't be changed once assigned."],
  ASSIGNMENT_IMMUTABLE: ["CONFLICT", "Assignments can't be changed once drawn."],
};

/** Translate known Postgres trigger/constraint failures into AppErrors. Returns the input otherwise. */
export function mapDbError(err: unknown): unknown {
  if (!err || typeof err !== "object") return err;
  const e = err as { code?: string; message?: string; constraint_name?: string; constraint?: string };
  if (e.code === "P0001" && e.message && DB_MESSAGES[e.message]) {
    const [code, msg] = DB_MESSAGES[e.message]!;
    return new AppError(code, msg);
  }
  if (e.code === "23505") {
    const c = e.constraint_name ?? e.constraint ?? "";
    if (c.includes("participants_group_id_email")) {
      return new AppError("DUPLICATE_EMAIL", "That email has already joined this group.");
    }
    return new AppError("CONFLICT", "That change conflicts with existing data.");
  }
  return err;
}
