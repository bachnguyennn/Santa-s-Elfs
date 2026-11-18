/**
 * SantaElf shared contracts: request schemas (zod) and response DTOs.
 * Client-safe: no server imports. Every API route validates with these schemas
 * and returns exactly these DTO shapes — never raw database rows.
 */
import { z } from "zod";
import { isValidTimeZone } from "./time";

export const MIN_PARTICIPANTS = 3;
export const MAX_PARTICIPANTS = 20;
export const MESSAGE_MAX_LENGTH = 1000;
export const WISHLIST_MAX_ITEMS = 25;
export const INTERESTS_MAX = 20;

export const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "NZD", "JPY", "INR", "MXN", "BRL", "CHF", "SEK", "NOK", "DKK", "PLN", "SGD", "ZAR"] as const;

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DUPLICATE_EMAIL"
  | "GROUP_FULL"
  | "GROUP_LOCKED"
  | "SIGNUPS_CLOSED"
  | "ALREADY_DRAWN"
  | "NOT_ENOUGH_PARTICIPANTS"
  | "IMPOSSIBLE_EXCLUSIONS"
  | "INVALID_TRANSITION"
  | "NOT_DRAWN"
  | "MUTED"
  | "CHALLENGE_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

/** Error body returned by every API route on failure. `fields` maps input paths to messages. */
export interface ApiError {
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ message: "Enter a valid email address." }));

export const personNameSchema = trimmed(60).min(1, "Enter a name.");

/** Wall-clock local datetime "YYYY-MM-DDTHH:mm", interpreted in the group's timezone. */
export const localDateTimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a date and time.");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date.");

/** Money in major units (e.g. 25 or 25.50). Converted to cents server-side. */
const moneySchema = z.number().min(0).max(100_000).optional();

/** http(s) URL only — blocks javascript:, data:, etc. */
export const safeUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a full link starting with https://");

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------
const groupSettingsShape = {
  name: trimmed(80).min(1, "Give your group a name."),
  budgetMin: moneySchema,
  budgetMax: moneySchema,
  currency: z.enum(CURRENCIES),
  signupDeadline: localDateTimeSchema.optional(),
  drawMethod: z.enum(["manual", "scheduled"]),
  drawAt: localDateTimeSchema.optional(),
  exchangeDate: dateSchema.optional(),
  timezone: z.string().refine(isValidTimeZone, "Choose a valid timezone."),
  requiresApproval: z.boolean(),
  rules: optionalText(2000),
};

function refineGroupSettings<T extends { budgetMin?: number; budgetMax?: number; drawMethod: string; drawAt?: string; signupDeadline?: string; exchangeDate?: string }>(
  v: T,
  ctx: z.RefinementCtx,
) {
  if (v.budgetMin !== undefined && v.budgetMax !== undefined && v.budgetMin > v.budgetMax) {
    ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Maximum budget must be at least the minimum." });
  }
  if (v.drawMethod === "scheduled" && !v.drawAt) {
    ctx.addIssue({ code: "custom", path: ["drawAt"], message: "Choose when the names should be drawn." });
  }
  // Local wall-clock strings in the same timezone compare correctly as strings.
  if (v.signupDeadline && v.drawAt && v.drawMethod === "scheduled" && v.signupDeadline > v.drawAt) {
    ctx.addIssue({ code: "custom", path: ["drawAt"], message: "The drawing must happen after signups close." });
  }
  if (v.exchangeDate && v.drawAt && v.drawMethod === "scheduled" && v.exchangeDate < v.drawAt.slice(0, 10)) {
    ctx.addIssue({ code: "custom", path: ["exchangeDate"], message: "The exchange should be after the drawing." });
  }
  if (v.exchangeDate && v.signupDeadline && v.exchangeDate < v.signupDeadline.slice(0, 10)) {
    ctx.addIssue({ code: "custom", path: ["exchangeDate"], message: "The exchange should be after signups close." });
  }
}

export const createGroupSchema = z
  .object({
    ...groupSettingsShape,
    organizerName: personNameSchema,
    organizerEmail: emailSchema,
    /** Explicit opt-in: the organizer also takes part in the exchange (uses one slot). */
    organizerParticipates: z.boolean(),
  })
  .superRefine(refineGroupSettings);
export type CreateGroupInput = z.input<typeof createGroupSchema>;

export const updateGroupSchema = z.object(groupSettingsShape).superRefine(refineGroupSettings);
export type UpdateGroupInput = z.input<typeof updateGroupSchema>;

export const joinGroupSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  /** Honeypot: must be empty. Bots fill every field. */
  website: z.string().max(0).optional().default(""),
});
export type JoinGroupInput = z.input<typeof joinGroupSchema>;

export const recoverSchema = z.object({
  email: emailSchema,
  /** When given, only that group is searched (participant recovery from an invite page). */
  inviteCode: z.string().max(64).optional(),
});
export type RecoverInput = z.input<typeof recoverSchema>;

export const participantDecisionSchema = z.object({ action: z.enum(["approve", "reject", "remove"]) });
export type ParticipantDecisionInput = z.input<typeof participantDecisionSchema>;

export const wishlistItemSchema = z.object({
  name: trimmed(120).min(1, "Name the gift idea."),
  description: optionalText(500),
  url: z
    .union([safeUrlSchema, z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const profileSchema = z.object({
  about: optionalText(1000),
  interests: z
    .array(trimmed(40).min(1))
    .max(INTERESTS_MAX)
    .transform((tags) => [...new Set(tags.map((t) => t.trim()))]),
  dislikes: optionalText(1000),
  notes: optionalText(1000),
  wishlist: z.array(wishlistItemSchema).max(WISHLIST_MAX_ITEMS),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const exclusionSchema = z
  .object({ giverId: z.uuid(), receiverId: z.uuid(), symmetric: z.boolean().default(true) })
  .refine((v) => v.giverId !== v.receiverId, { path: ["receiverId"], message: "Pick two different people." });
export type ExclusionInput = z.input<typeof exclusionSchema>;

export const removeExclusionSchema = z.object({ giverId: z.uuid(), receiverId: z.uuid(), symmetric: z.boolean().default(true) });

export const drawSchema = z.object({ confirm: z.literal(true) });

export const emergencyChallengeSchema = z.object({ participantId: z.uuid() });
export const emergencyRevealSchema = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code.") });

export const threadSchema = z.enum(["recipient", "santa"]);
export type Thread = z.infer<typeof threadSchema>;
export const sendMessageSchema = z.object({
  thread: threadSchema,
  body: z.string().trim().min(1, "Write a message.").max(MESSAGE_MAX_LENGTH),
});
export type SendMessageInput = z.input<typeof sendMessageSchema>;
export const muteSchema = z.object({ muted: z.boolean() });

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------
export type GroupStatus = "open" | "drawn" | "closed";
export type ParticipantStatus = "pending" | "approved" | "rejected" | "removed";
export type DrawMethod = "manual" | "scheduled";

/** Group details safe to show any member of the group (and the public invite page). */
export interface GroupPublicDTO {
  name: string;
  organizerName: string;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  currency: string;
  /** ISO 8601 UTC. */
  signupDeadline: string | null;
  drawMethod: DrawMethod;
  /** ISO 8601 UTC. */
  drawAt: string | null;
  /** YYYY-MM-DD */
  exchangeDate: string | null;
  timezone: string;
  requiresApproval: boolean;
  rules: string | null;
  status: GroupStatus;
}

export interface InvitePreviewDTO extends GroupPublicDTO {
  inviteCode: string;
  approvedCount: number;
  capacity: number;
  /** Whether new join requests are accepted right now. */
  isOpen: boolean;
  closedReason: "deadline" | "full" | "drawn" | "closed" | null;
}

export interface CreateGroupResult {
  groupId: string;
  inviteUrl: string;
  /** Present when organizerParticipates was true. */
  organizerParticipantId: string | null;
}

export interface JoinResult {
  participantId: string;
  status: Extract<ParticipantStatus, "pending" | "approved">;
}

export interface WishlistItemDTO {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
}

export interface ProfileDTO {
  about: string | null;
  interests: string[];
  dislikes: string | null;
  notes: string | null;
  wishlist: WishlistItemDTO[];
}

export interface DrawIssue {
  code: "NOT_ENOUGH_PARTICIPANTS" | "ALREADY_DRAWN" | "GROUP_CLOSED" | "IMPOSSIBLE_EXCLUSIONS";
  message: string;
}

export interface DrawReadinessDTO {
  ready: boolean;
  approvedCount: number;
  pendingCount: number;
  issues: DrawIssue[];
  /** Non-blocking notes, e.g. pending requests that will be left out. */
  warnings: string[];
}

export interface ExclusionDTO {
  giverId: string;
  receiverId: string;
}

export interface OrganizerParticipantDTO {
  id: string;
  name: string;
  email: string;
  status: ParticipantStatus;
  isOrganizer: boolean;
  joinedAt: string;
  hasProfile: boolean;
  /** After the drawing: whether they opened their reveal. Never who they drew. */
  revealed: boolean | null;
  /** Status of the most recent email to this participant. */
  lastEmail: { template: string; status: "pending" | "sending" | "sent" | "failed"; at: string } | null;
}

export interface OrganizerDashboardDTO {
  groupId: string;
  group: GroupPublicDTO & { organizerEmail: string; drawnAt: string | null; drawError: string | null };
  inviteUrl: string;
  participants: OrganizerParticipantDTO[];
  approvedCount: number;
  pendingCount: number;
  capacity: number;
  exclusions: ExclusionDTO[];
  readiness: DrawReadinessDTO;
  emails: { pending: number; sent: number; failed: number };
  organizerParticipantId: string | null;
  /** Shown in local demo mode so testers know emails are simulated. */
  emailSimulated: boolean;
}

export interface ParticipantHomeDTO {
  participant: {
    id: string;
    name: string;
    email: string;
    status: ParticipantStatus;
    /** Your own Christmas alias (only you see it). Null before the drawing. */
    alias: string | null;
  };
  group: GroupPublicDTO;
  profile: ProfileDTO;
  /** "none" before the drawing; "ready" drawn but not opened; "revealed" opened. */
  assignment: { state: "none" | "ready" | "revealed" };
  /** Unread-ish counts are out of scope; just whether threads exist. */
  messaging: { canMessageRecipient: boolean; hasSanta: boolean };
}

/** What a giver sees about the person they drew. Never includes the recipient's email or id. */
export interface RecipientViewDTO {
  recipient: { name: string; profile: Omit<ProfileDTO, "wishlist"> & { wishlist: WishlistItemDTO[] } };
  /** The giver's own alias, which the recipient sees on messages. */
  myAlias: string;
  revealedAt: string;
}

export interface MessageDTO {
  id: string;
  fromMe: boolean;
  body: string;
  createdAt: string;
}

/**
 * A conversation from the caller's point of view.
 * - thread "recipient": caller is the Santa writing to the person they drew.
 * - thread "santa": caller is the recipient talking to their anonymous Santa.
 * Never contains the Santa's real name, email, or participant id.
 */
export interface ThreadDTO {
  thread: Thread;
  /** Display name of the other party: recipient's real name, or "<Alias> — Your Secret Santa". */
  counterpartLabel: string;
  /** The Santa alias in this conversation (caller's own alias on the "recipient" thread). */
  santaAlias: string;
  /** Recipient has paused messages from their Santa. */
  muted: boolean;
  messages: MessageDTO[];
}

export interface EmergencyChallengeDTO {
  challengeId: string;
  expiresAt: string;
  /** Masked organizer email the code was sent to, e.g. "o•••@example.com". */
  sentTo: string;
}

export interface EmergencyRevealDTO {
  participantName: string;
  recipientName: string;
}

// ---------------------------------------------------------------------------
// API route map (all JSON). Organizer routes need the organizer cookie for the
// group; participant routes need the participant cookie for that participant.
// ---------------------------------------------------------------------------
// POST   /api/groups                                   createGroupSchema        -> CreateGroupResult (sets organizer [+participant] cookie)
// POST   /api/join/[code]                              joinGroupSchema          -> JoinResult (sets participant cookie)
// POST   /api/recover                                  recoverSchema            -> { ok: true } (always generic)
// GET    /a/[token]                                    (page-level redirect: exchanges link token for cookie)
// GET    /api/o/[groupId]                              -                        -> OrganizerDashboardDTO
// PATCH  /api/o/[groupId]                              updateGroupSchema        -> OrganizerDashboardDTO
// DELETE /api/o/[groupId]                              -                        -> { ok: true }
// POST   /api/o/[groupId]/close                        -                        -> { ok: true }
// PATCH  /api/o/[groupId]/participants/[pid]           participantDecisionSchema-> OrganizerParticipantDTO
// POST   /api/o/[groupId]/participants/[pid]/resend    -                        -> { ok: true }
// POST   /api/o/[groupId]/exclusions                   exclusionSchema          -> ExclusionDTO[]
// DELETE /api/o/[groupId]/exclusions                   removeExclusionSchema    -> ExclusionDTO[]
// GET    /api/o/[groupId]/draw                         -                        -> DrawReadinessDTO
// POST   /api/o/[groupId]/draw                         drawSchema               -> { status: "drawn" | "already_drawn" }
// POST   /api/o/[groupId]/emergency/challenge          emergencyChallengeSchema -> EmergencyChallengeDTO
// POST   /api/o/[groupId]/emergency/reveal             emergencyRevealSchema    -> EmergencyRevealDTO
// GET    /api/p/[pid]                                  -                        -> ParticipantHomeDTO
// PUT    /api/p/[pid]/profile                          profileSchema            -> ProfileDTO
// POST   /api/p/[pid]/reveal                           -                        -> RecipientViewDTO
// GET    /api/p/[pid]/messages?thread=recipient|santa  -                        -> ThreadDTO
// POST   /api/p/[pid]/messages                         sendMessageSchema        -> ThreadDTO
// POST   /api/p/[pid]/messages/mute                    muteSchema               -> ThreadDTO (santa thread)
// POST   /api/p/[pid]/messages/[messageId]/report      -                        -> { ok: true }
// GET    /api/cron/tick                                Authorization: Bearer CRON_SECRET -> { draws, emails, purged }
