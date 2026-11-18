// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { ParticipantCtx } from "../tokens";
import type { ParticipantHomeDTO, RecipientViewDTO } from "@/lib/contracts";
import { AppError } from "../errors";
import { audit } from "../audit";
import { GROUP_PUBLIC_COLUMNS, iso, toGroupPublic, type GroupPublicRow } from "./groups";
import { loadProfile } from "./profiles";

export async function getParticipantHome(db: Db, ctx: ParticipantCtx): Promise<ParticipantHomeDTO> {
  const [r] = await db.query<
    GroupPublicRow & {
      p_id: string;
      p_name: string;
      p_email: string;
      p_status: ParticipantHomeDTO["participant"]["status"];
      p_alias: string | null;
      has_assignment: boolean;
      revealed_at: Date | string | null;
    }
  >(
    `select ${GROUP_PUBLIC_COLUMNS}, p.id as p_id, p.name as p_name, p.email as p_email, p.status as p_status,
       p.alias as p_alias, (a.giver_id is not null) as has_assignment, a.revealed_at
     from participants p
     join groups g on g.id = p.group_id
     left join assignments a on a.group_id = p.group_id and a.giver_id = p.id
     where p.id = $1 and p.group_id = $2`,
    [ctx.participantId, ctx.groupId],
  );
  if (!r) throw new AppError("NOT_FOUND", "We couldn't find you in this group.");
  const drawn = r.status !== "open";
  const assignmentState = drawn && r.has_assignment ? (r.revealed_at ? "revealed" : "ready") : "none";
  return {
    participant: { id: r.p_id, name: r.p_name, email: r.p_email, status: r.p_status, alias: r.p_alias },
    group: toGroupPublic(r),
    profile: await loadProfile(db, ctx.participantId),
    assignment: { state: assignmentState },
    messaging: {
      canMessageRecipient: assignmentState === "revealed",
      hasSanta: drawn && r.p_status === "approved",
    },
  };
}

async function buildRecipientView(
  db: Db,
  row: { recipient_id: string; recipient_name: string; my_alias: string | null; revealed_at: Date | string },
): Promise<RecipientViewDTO> {
  const profile = await loadProfile(db, row.recipient_id);
  return {
    // Only the recipient's name + profile: never their email or participant id.
    recipient: { name: row.recipient_name, profile },
    myAlias: row.my_alias ?? "Secret Santa",
    revealedAt: iso(row.revealed_at)!,
  };
}

const ASSIGNMENT_SELECT = `select a.recipient_id, a.revealed_at, r.name as recipient_name, me.alias as my_alias
   from assignments a
   join groups g on g.id = a.group_id
   join participants r on r.id = a.recipient_id
   join participants me on me.id = a.giver_id
  where a.group_id = $1 and a.giver_id = $2 and g.status in ('drawn', 'closed')`;

type AssignmentRow = { recipient_id: string; revealed_at: Date | string | null; recipient_name: string; my_alias: string | null };

/**
 * Reveal the caller's (already persisted) assignment. Idempotent: sets revealed_at
 * the first time, always returns the same recipient. NOT_DRAWN before the drawing.
 * Never draws or redraws.
 */
export async function revealAssignment(db: Db, ctx: ParticipantCtx): Promise<RecipientViewDTO> {
  const row = await db.tx(async (t) => {
    const [a] = await t.query<AssignmentRow>(`${ASSIGNMENT_SELECT} for update of a`, [ctx.groupId, ctx.participantId]);
    if (!a) throw new AppError("NOT_DRAWN", "Names haven't been drawn yet.");
    if (a.revealed_at) return { ...a, revealed_at: a.revealed_at };
    const [u] = await t.query<{ revealed_at: Date | string }>(
      `update assignments set revealed_at = coalesce(revealed_at, now()) where group_id = $1 and giver_id = $2 returning revealed_at`,
      [ctx.groupId, ctx.participantId],
    );
    // Subject is the giver only; the recipient is never recorded.
    await audit(t, { groupId: ctx.groupId, actor: "participant", type: "assignment.revealed", subjectParticipantId: ctx.participantId });
    return { ...a, revealed_at: u.revealed_at };
  });
  return buildRecipientView(db, row);
}

/** The recipient view if already revealed, else null. */
export async function getRecipientView(db: Db, ctx: ParticipantCtx): Promise<RecipientViewDTO | null> {
  const [a] = await db.query<AssignmentRow>(ASSIGNMENT_SELECT, [ctx.groupId, ctx.participantId]);
  if (!a || !a.revealed_at) return null;
  return buildRecipientView(db, { ...a, revealed_at: a.revealed_at });
}
