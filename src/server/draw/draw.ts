import type { Db } from "../db/types";
import { MIN_PARTICIPANTS, type DrawIssue, type DrawReadinessDTO } from "@/lib/contracts";
import { AppError } from "../errors";
import { audit } from "../audit";
import { enqueueEmail } from "../email/queue";
import { logError } from "../log";
import { findAssignment, isFeasible, type IsExcluded } from "./matching";
import { assignAliases } from "./aliases";

const MESSAGES = {
  GROUP_CLOSED: "This group is closed, so names can't be drawn.",
  ALREADY_DRAWN: "Names have already been drawn for this group.",
  NOT_ENOUGH_PARTICIPANTS: `You need at least ${MIN_PARTICIPANTS} approved participants to draw names.`,
  IMPOSSIBLE_EXCLUSIONS: "We couldn't find a valid drawing with the current exclusions. Please adjust your rules and try again.",
} as const;

type GroupRow = { status: "open" | "drawn" | "closed" };

/** Approved participants (ordered by id) and an exclusion check limited to approved pairs. */
async function loadDrawInput(db: Db, groupId: string) {
  const participants = await db.query<{ id: string; email: string }>(
    `select id, email from participants where group_id = $1 and status = 'approved' order by id`,
    [groupId],
  );
  const rows = await db.query<{ giver_id: string; receiver_id: string }>(
    `select e.giver_id, e.receiver_id
       from exclusions e
       join participants g on g.id = e.giver_id and g.status = 'approved'
       join participants r on r.id = e.receiver_id and r.status = 'approved'
      where e.group_id = $1`,
    [groupId],
  );
  const excluded = new Set(rows.map((r) => `${r.giver_id}|${r.receiver_id}`));
  const isExcluded: IsExcluded = (giver, receiver) => excluded.has(`${giver}|${receiver}`);
  return { participants, ids: participants.map((p) => p.id), isExcluded };
}

export async function getDrawReadiness(db: Db, groupId: string): Promise<DrawReadinessDTO> {
  const [group] = await db.query<GroupRow>(`select status from groups where id = $1`, [groupId]);
  if (!group) throw new AppError("NOT_FOUND", "We couldn't find that group.");

  const [counts] = await db.query<{ approved: number; pending: number }>(
    `select count(*) filter (where status = 'approved')::int as approved,
            count(*) filter (where status = 'pending')::int as pending
       from participants where group_id = $1`,
    [groupId],
  );
  const { approved, pending } = counts;

  const issues: DrawIssue[] = [];
  const warnings: string[] = [];
  if (group.status === "closed") issues.push({ code: "GROUP_CLOSED", message: MESSAGES.GROUP_CLOSED });
  if (group.status === "drawn") issues.push({ code: "ALREADY_DRAWN", message: MESSAGES.ALREADY_DRAWN });
  if (group.status === "open") {
    if (approved < MIN_PARTICIPANTS) {
      issues.push({ code: "NOT_ENOUGH_PARTICIPANTS", message: `${MESSAGES.NOT_ENOUGH_PARTICIPANTS} You have ${approved}.` });
    } else {
      const { ids, isExcluded } = await loadDrawInput(db, groupId);
      if (!isFeasible(ids, isExcluded)) issues.push({ code: "IMPOSSIBLE_EXCLUSIONS", message: MESSAGES.IMPOSSIBLE_EXCLUSIONS });
    }
    if (pending > 0) {
      warnings.push(`${pending} pending ${pending === 1 ? "request" : "requests"} won't be included in the drawing.`);
    }
  }

  return { ready: issues.length === 0, approvedCount: approved, pendingCount: pending, issues, warnings };
}

/**
 * The single drawing service used by manual AND scheduled draws. Atomic and
 * idempotent: locks the group row; if already drawn returns "already_drawn".
 * Throws AppError NOT_ENOUGH_PARTICIPANTS / IMPOSSIBLE_EXCLUSIONS / GROUP_LOCKED.
 * Persists assignments + aliases, locks membership, queues assignment_ready emails.
 */
export async function drawGroup(db: Db, groupId: string, opts: { trigger: "manual" | "scheduled" }): Promise<{ status: "drawn" | "already_drawn" }> {
  return db.tx(async (t) => {
    const [group] = await t.query<GroupRow>(`select status from groups where id = $1 for update`, [groupId]);
    if (!group) throw new AppError("NOT_FOUND", "We couldn't find that group.");
    if (group.status === "drawn") return { status: "already_drawn" as const };
    if (group.status === "closed") throw new AppError("GROUP_LOCKED", MESSAGES.GROUP_CLOSED);

    const { participants, ids, isExcluded } = await loadDrawInput(t, groupId);
    if (ids.length < MIN_PARTICIPANTS) throw new AppError("NOT_ENOUGH_PARTICIPANTS", MESSAGES.NOT_ENOUGH_PARTICIPANTS);

    const assignment = findAssignment(ids, isExcluded);
    if (!assignment) throw new AppError("IMPOSSIBLE_EXCLUSIONS", MESSAGES.IMPOSSIBLE_EXCLUSIONS);
    const aliases = assignAliases(ids);

    // Aliases first: the participants trigger locks membership once the group leaves 'open'.
    for (const id of ids) {
      await t.query(`update participants set alias = $2 where id = $1 and group_id = $3`, [id, aliases.get(id), groupId]);
    }
    for (const [giver, recipient] of assignment) {
      await t.query(`insert into assignments (group_id, giver_id, recipient_id) values ($1, $2, $3)`, [groupId, giver, recipient]);
    }
    await t.query(`update groups set status = 'drawn', drawn_at = now(), draw_error = null, updated_at = now() where id = $1`, [groupId]);

    for (const p of participants) {
      await enqueueEmail(t, p.email, { template: "assignment_ready", groupId, participantId: p.id }, `assignment_ready:${p.id}`);
    }
    await audit(t, {
      groupId,
      actor: opts.trigger === "manual" ? "organizer" : "system",
      type: "draw.completed",
      metadata: { trigger: opts.trigger, participantCount: ids.length },
    });
    return { status: "drawn" as const };
  });
}

/** Cron: draw every open scheduled group whose draw_at <= now and draw_error is null. */
export async function processDueDraws(db: Db, now: Date = new Date()): Promise<{ drawn: number; failed: number }> {
  const due = await db.query<{ id: string }>(
    `select id from groups
      where status = 'open' and draw_method = 'scheduled' and draw_at <= $1 and draw_error is null
      order by draw_at`,
    [now.toISOString()],
  );

  let drawn = 0;
  let failed = 0;
  for (const { id } of due) {
    try {
      const res = await drawGroup(db, id, { trigger: "scheduled" });
      if (res.status === "drawn") drawn++;
    } catch (err) {
      failed++;
      if (err instanceof AppError) {
        await recordDrawFailure(db, id, err.code).catch((e) => logError("draw.record_failure_failed", e, { groupId: id }));
      } else {
        // Leave draw_error null so the next tick retries.
        logError("draw.scheduled_failed", err, { groupId: id });
      }
    }
  }
  return { drawn, failed };
}

/** Persist a scheduled-draw validation failure and notify the organizer once. */
async function recordDrawFailure(db: Db, groupId: string, code: string) {
  await db.tx(async (t) => {
    const [g] = await t.query<{ organizer_email: string; draw_at: Date | string }>(
      `update groups set draw_error = $2
        where id = $1 and status = 'open' and draw_error is null
        returning organizer_email, draw_at`,
      [groupId, code],
    );
    if (!g) return; // drawn, closed or deleted meanwhile
    const drawAt = new Date(g.draw_at).toISOString();
    await enqueueEmail(t, g.organizer_email, { template: "draw_failed", groupId, reason: code }, `draw_failed:${groupId}:${drawAt}`);
    await audit(t, { groupId, actor: "system", type: "draw.failed", metadata: { reason: code } });
  });
}
