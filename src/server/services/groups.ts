// OWNER: backend agent. Contract — keep signatures stable.
import { ZodError } from "zod";
import type { Db } from "../db/types";
import { issueToken, generateInviteCode, type OrganizerCtx } from "../tokens";
import {
  createGroupSchema,
  updateGroupSchema,
  MAX_PARTICIPANTS,
  type CreateGroupInput,
  type GroupPublicDTO,
  type InvitePreviewDTO,
  type OrganizerDashboardDTO,
  type OrganizerParticipantDTO,
  type UpdateGroupInput,
} from "@/lib/contracts";
import { zonedWallTimeToUtc } from "@/lib/time";
import { AppError } from "../errors";
import { enqueueEmail } from "../email/queue";
import { audit } from "../audit";
import { env } from "../env";
import { logInfo } from "../log";
import { getDrawReadiness } from "../draw/draw";

export interface CreatedGroup {
  groupId: string;
  inviteCode: string;
  organizerToken: string;
  organizerParticipant: { participantId: string; token: string } | null;
}

// ---------------------------------------------------------------------------
// Shared helpers (also used by other services in this folder)
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

/** A 400 VALIDATION error carrying `fields` (rendered by api()). */
export function fieldError(field: string, message: string): ZodError {
  return new ZodError([{ code: "custom", path: [field], message }]);
}

export function iso(v: Date | string | null | undefined): string | null {
  return v == null ? null : new Date(v).toISOString();
}

/** Columns needed by toGroupPublic (exchange_date cast to text to avoid tz shifting). */
export const GROUP_PUBLIC_COLUMNS = `g.name, g.organizer_name, g.budget_min_cents, g.budget_max_cents, g.currency,
  g.signup_deadline, g.draw_method, g.draw_at, g.exchange_date::text as exchange_date, g.timezone,
  g.requires_approval, g.rules, g.status`;

export interface GroupPublicRow {
  name: string;
  organizer_name: string;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  currency: string;
  signup_deadline: Date | string | null;
  draw_method: "manual" | "scheduled";
  draw_at: Date | string | null;
  exchange_date: string | null;
  timezone: string;
  requires_approval: boolean;
  rules: string | null;
  status: "open" | "drawn" | "closed";
}

export function toGroupPublic(r: GroupPublicRow): GroupPublicDTO {
  return {
    name: r.name,
    organizerName: r.organizer_name,
    budgetMinCents: r.budget_min_cents,
    budgetMaxCents: r.budget_max_cents,
    currency: r.currency,
    signupDeadline: iso(r.signup_deadline),
    drawMethod: r.draw_method,
    drawAt: iso(r.draw_at),
    exchangeDate: r.exchange_date,
    timezone: r.timezone,
    requiresApproval: r.requires_approval,
    rules: r.rules,
    status: r.status,
  };
}

/** Why a group no longer accepts join requests (null = open). */
export function closedReasonOf(g: {
  status: string;
  signup_deadline: Date | string | null;
  approved_count: number;
}): InvitePreviewDTO["closedReason"] {
  if (g.status === "drawn") return "drawn";
  if (g.status === "closed") return "closed";
  if (g.signup_deadline && new Date(g.signup_deadline).getTime() <= Date.now()) return "deadline";
  if (g.approved_count >= MAX_PARTICIPANTS) return "full";
  return null;
}

type Settings = ReturnType<typeof updateGroupSchema.parse>;

/** Convert validated settings to DB values (UTC instants, cents). */
function toDbSettings(v: Settings) {
  return {
    name: v.name,
    budgetMinCents: v.budgetMin === undefined ? null : Math.round(v.budgetMin * 100),
    budgetMaxCents: v.budgetMax === undefined ? null : Math.round(v.budgetMax * 100),
    currency: v.currency,
    signupDeadline: v.signupDeadline ? zonedWallTimeToUtc(v.signupDeadline, v.timezone) : null,
    drawMethod: v.drawMethod,
    drawAt: v.drawMethod === "scheduled" && v.drawAt ? zonedWallTimeToUtc(v.drawAt, v.timezone) : null,
    exchangeDate: v.exchangeDate ?? null,
    timezone: v.timezone,
    requiresApproval: v.requiresApproval,
    rules: v.rules ?? null,
  };
}

function assertFuture(field: "signupDeadline" | "drawAt", d: Date | null, previous?: Date | string | null) {
  if (!d) return;
  if (previous && new Date(previous).getTime() === d.getTime()) return; // unchanged
  if (d.getTime() <= Date.now()) {
    throw fieldError(
      field,
      field === "drawAt" ? "Choose a drawing time in the future." : "Choose a signup deadline in the future.",
    );
  }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

/** Validate (createGroupSchema), create group (+ organizer participant if opted in), mint tokens, queue organizer_welcome. */
export async function createGroup(db: Db, input: CreateGroupInput): Promise<CreatedGroup> {
  const v = createGroupSchema.parse(input);
  const s = toDbSettings(v);
  assertFuture("signupDeadline", s.signupDeadline);
  assertFuture("drawAt", s.drawAt);

  return db.tx(async (t) => {
    const inviteCode = generateInviteCode();
    const [g] = await t.query<{ id: string }>(
      `insert into groups (invite_code, name, organizer_name, organizer_email, budget_min_cents, budget_max_cents, currency,
         signup_deadline, draw_method, draw_at, exchange_date, timezone, requires_approval, rules)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning id`,
      [
        inviteCode, s.name, v.organizerName, v.organizerEmail, s.budgetMinCents, s.budgetMaxCents, s.currency,
        s.signupDeadline, s.drawMethod, s.drawAt, s.exchangeDate, s.timezone, s.requiresApproval, s.rules,
      ],
    );
    const groupId = g.id;
    const organizerToken = await issueToken(t, { kind: "organizer", groupId });
    await enqueueEmail(t, v.organizerEmail, { template: "organizer_welcome", groupId }, `organizer_welcome:${groupId}`);

    let organizerParticipant: CreatedGroup["organizerParticipant"] = null;
    if (v.organizerParticipates) {
      const [p] = await t.query<{ id: string }>(
        `insert into participants (group_id, name, email, status, is_organizer, decided_at)
         values ($1, $2, $3, 'approved', true, now()) returning id`,
        [groupId, v.organizerName, v.organizerEmail],
      );
      const token = await issueToken(t, { kind: "participant", groupId, participantId: p.id });
      await enqueueEmail(
        t,
        v.organizerEmail,
        { template: "participant_welcome", groupId, participantId: p.id },
        `participant_welcome:${p.id}`,
      );
      organizerParticipant = { participantId: p.id, token };
    }

    await audit(t, { groupId, actor: "organizer", type: "group.created", metadata: { organizerParticipates: v.organizerParticipates } });
    return { groupId, inviteCode, organizerToken, organizerParticipant };
  });
}

/** Public invite preview; null if the code is unknown. Never includes participant names. */
export async function getInvitePreview(db: Db, inviteCode: string): Promise<InvitePreviewDTO | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(inviteCode)) return null;
  const [r] = await db.query<GroupPublicRow & { approved_count: number }>(
    `select ${GROUP_PUBLIC_COLUMNS},
       (select count(*)::int from participants p where p.group_id = g.id and p.status = 'approved') as approved_count
     from groups g where g.invite_code = $1`,
    [inviteCode],
  );
  if (!r) return null;
  const closedReason = closedReasonOf(r);
  return {
    ...toGroupPublic(r),
    inviteCode,
    approvedCount: r.approved_count,
    capacity: MAX_PARTICIPANTS,
    isOpen: closedReason === null,
    closedReason,
  };
}

interface ParticipantAdminRow {
  id: string;
  name: string;
  email: string;
  status: OrganizerParticipantDTO["status"];
  is_organizer: boolean;
  created_at: Date | string;
  has_profile: boolean;
  has_assignment: boolean;
  revealed_at: Date | string | null;
  email_template: string | null;
  email_status: "pending" | "sending" | "sent" | "failed" | null;
  email_at: Date | string | null;
}

/** Organizer view of participants in a group (optionally one participant). */
export async function loadOrganizerParticipants(db: Db, groupId: string, participantId?: string): Promise<OrganizerParticipantDTO[]> {
  const rows = await db.query<ParticipantAdminRow>(
    `select p.id, p.name, p.email, p.status, p.is_organizer, p.created_at,
       (exists (select 1 from profiles pr where pr.participant_id = p.id)
         or exists (select 1 from wishlist_items w where w.participant_id = p.id)) as has_profile,
       (a.giver_id is not null) as has_assignment, a.revealed_at,
       e.template as email_template, e.status as email_status, coalesce(e.sent_at, e.created_at) as email_at
     from participants p
     left join assignments a on a.group_id = p.group_id and a.giver_id = p.id
     left join lateral (
       -- new_message notifications are excluded: their timing would let the organizer
       -- correlate a recipient's reply with the Santa it notifies (who drew whom).
       select ej.template, ej.status, ej.sent_at, ej.created_at from email_jobs ej
        where ej.participant_id = p.id and ej.to_email = p.email and ej.template <> 'new_message'
        order by ej.created_at desc limit 1
     ) e on true
     where p.group_id = $1 and ($2::uuid is null or p.id = $2::uuid)
     order by p.created_at, p.id`,
    [groupId, participantId ?? null],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    status: r.status,
    isOrganizer: r.is_organizer,
    joinedAt: iso(r.created_at)!,
    hasProfile: r.has_profile,
    revealed: r.has_assignment ? r.revealed_at !== null : null,
    lastEmail: r.email_template && r.email_status ? { template: r.email_template, status: r.email_status, at: iso(r.email_at)! } : null,
  }));
}

export async function getOrganizerDashboard(db: Db, ctx: OrganizerCtx): Promise<OrganizerDashboardDTO> {
  const [g] = await db.query<
    GroupPublicRow & { invite_code: string; organizer_email: string; drawn_at: Date | string | null; draw_error: string | null }
  >(`select ${GROUP_PUBLIC_COLUMNS}, g.invite_code, g.organizer_email, g.drawn_at, g.draw_error from groups g where g.id = $1`, [
    ctx.groupId,
  ]);
  if (!g) throw new AppError("NOT_FOUND", "This group no longer exists.");

  const participants = await loadOrganizerParticipants(db, ctx.groupId);
  const exclusions = await db.query<{ giver_id: string; receiver_id: string }>(
    `select giver_id, receiver_id from exclusions where group_id = $1 order by created_at, giver_id, receiver_id`,
    [ctx.groupId],
  );
  const [emails] = await db.query<{ pending: number; sent: number; failed: number }>(
    `select count(*) filter (where status in ('pending', 'sending'))::int as pending,
            count(*) filter (where status = 'sent')::int as sent,
            count(*) filter (where status = 'failed')::int as failed
       from email_jobs where group_id = $1`,
    [ctx.groupId],
  );
  const readiness = await getDrawReadiness(db, ctx.groupId);

  return {
    groupId: ctx.groupId,
    group: { ...toGroupPublic(g), organizerEmail: g.organizer_email, drawnAt: iso(g.drawn_at), drawError: g.draw_error },
    inviteUrl: `${env.appUrl}/j/${g.invite_code}`,
    participants,
    approvedCount: participants.filter((p) => p.status === "approved").length,
    pendingCount: participants.filter((p) => p.status === "pending").length,
    capacity: MAX_PARTICIPANTS,
    exclusions: exclusions.map((e) => ({ giverId: e.giver_id, receiverId: e.receiver_id })),
    readiness,
    emails: emails ?? { pending: 0, sent: 0, failed: 0 },
    organizerParticipantId: participants.find((p) => p.isOrganizer)?.id ?? null,
    emailSimulated: env.emailMode === "simulate",
  };
}

/** Only while status = 'open'. Clears groups.draw_error. */
export async function updateGroupSettings(db: Db, ctx: OrganizerCtx, input: UpdateGroupInput): Promise<OrganizerDashboardDTO> {
  const v = updateGroupSchema.parse(input);
  const s = toDbSettings(v);
  await db.tx(async (t) => {
    const [g] = await t.query<{ status: string; signup_deadline: Date | null; draw_at: Date | null }>(
      `select status, signup_deadline, draw_at from groups where id = $1 for update`,
      [ctx.groupId],
    );
    if (!g) throw new AppError("NOT_FOUND", "This group no longer exists.");
    if (g.status !== "open") throw new AppError("GROUP_LOCKED", "Settings can't be changed after names are drawn.");
    assertFuture("signupDeadline", s.signupDeadline, g.signup_deadline);
    assertFuture("drawAt", s.drawAt, g.draw_at);
    await t.query(
      `update groups set name = $2, budget_min_cents = $3, budget_max_cents = $4, currency = $5, signup_deadline = $6,
         draw_method = $7, draw_at = $8, exchange_date = $9, timezone = $10, requires_approval = $11, rules = $12,
         draw_error = null, updated_at = now()
       where id = $1`,
      [
        ctx.groupId, s.name, s.budgetMinCents, s.budgetMaxCents, s.currency, s.signupDeadline,
        s.drawMethod, s.drawAt, s.exchangeDate, s.timezone, s.requiresApproval, s.rules,
      ],
    );
    await audit(t, { groupId: ctx.groupId, actor: "organizer", type: "group.updated" });
  });
  return getOrganizerDashboard(db, ctx);
}

/** Mark the exchange finished (status 'closed'): no further changes; messaging becomes read-only. */
export async function closeGroup(db: Db, ctx: OrganizerCtx): Promise<void> {
  await db.tx(async (t) => {
    const [g] = await t.query<{ status: string }>(`select status from groups where id = $1 for update`, [ctx.groupId]);
    if (!g) throw new AppError("NOT_FOUND", "This group no longer exists.");
    if (g.status === "closed") return;
    await t.query(`update groups set status = 'closed', updated_at = now() where id = $1`, [ctx.groupId]);
    await audit(t, { groupId: ctx.groupId, actor: "organizer", type: "group.closed", metadata: { from: g.status } });
  });
}

/** Permanently delete the group and all participant data (cascade). */
export async function deleteGroup(db: Db, ctx: OrganizerCtx): Promise<void> {
  await db.query(`delete from groups where id = $1`, [ctx.groupId]);
  logInfo("group.deleted", { groupId: ctx.groupId });
}
