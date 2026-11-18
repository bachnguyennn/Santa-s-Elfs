import type { Db } from "./db/types";

export type AuditActor = "organizer" | "participant" | "system";

/**
 * Record a privacy-preserving audit event. NEVER put names, emails, tokens,
 * message bodies or assignment targets in `metadata`.
 */
export async function audit(
  db: Db,
  e: { groupId: string; actor: AuditActor; type: string; subjectParticipantId?: string; metadata?: Record<string, string | number | boolean | null> },
) {
  await db.query(
    `insert into audit_events (group_id, actor, event_type, subject_participant_id, metadata) values ($1, $2, $3, $4, $5::text::jsonb)`,
    [e.groupId, e.actor, e.type, e.subjectParticipantId ?? null, JSON.stringify(e.metadata ?? {})],
  );
}
