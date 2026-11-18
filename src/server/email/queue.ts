import type { Db } from "../db/types";

/**
 * Email templates. Payloads carry ids only — access links / codes are minted
 * by the worker at send time, so the queue never stores a usable credential.
 */
export type EmailJob =
  | { template: "organizer_welcome"; groupId: string }
  | { template: "organizer_recovery"; groupId: string }
  | { template: "participant_welcome"; groupId: string; participantId: string }
  | { template: "participant_recovery"; groupId: string; participantId: string }
  | { template: "join_request_received"; groupId: string; participantId: string } // to organizer
  | { template: "join_approved"; groupId: string; participantId: string }
  | { template: "join_rejected"; groupId: string; participantId: string }
  | { template: "assignment_ready"; groupId: string; participantId: string }
  | { template: "new_message"; groupId: string; participantId: string; thread: "recipient" | "santa" }
  | { template: "draw_failed"; groupId: string; reason: string } // to organizer
  | { template: "emergency_code"; groupId: string; challengeId: string }; // to organizer

export type EmailTemplate = EmailJob["template"];

/**
 * Queue an email. With `dedupeKey`, a second enqueue with the same key is a
 * no-op (prevents duplicate notifications, e.g. "assignment_ready:<participantId>").
 * Call inside the same transaction as the state change it notifies about.
 */
export async function enqueueEmail(db: Db, toEmail: string, job: EmailJob, dedupeKey?: string): Promise<void> {
  const participantId = "participantId" in job ? job.participantId : null;
  await db.query(
    `insert into email_jobs (group_id, participant_id, to_email, template, payload, dedupe_key)
     values ($1, $2, $3, $4, $5::text::jsonb, $6)
     on conflict (dedupe_key) do nothing`,
    [job.groupId, participantId, toEmail, job.template, JSON.stringify(job), dedupeKey ?? null],
  );
}
