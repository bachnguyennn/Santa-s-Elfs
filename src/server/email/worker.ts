// OWNER: email/messaging agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import { env } from "../env";
import { logError } from "../log";
import { emergencyCodeHash, generateOtp, issueToken } from "../tokens";
import { deliver, ProviderError } from "./provider";
import type { EmailJob } from "./queue";
import { renderEmail } from "./render";
import * as T from "./templates/emails";

export const MAX_ATTEMPTS = 5;
/** Pause between real provider calls (Resend default limit: 10 req/s per team). */
const SEND_PACING_MS = 300;

interface JobRow {
  id: string;
  group_id: string | null;
  template: string;
  payload: EmailJob;
  attempts: number;
}

/** Minutes to wait before the next attempt: 1, 4, 16, 64. */
export function backoffMinutes(attempts: number): number {
  return 4 ** Math.max(0, attempts - 1);
}

type Built = { to: string; content: T.EmailContent; afterSend?: () => Promise<void> } | "stale";

async function groupRow(db: Db, groupId: string) {
  const rows = await db.query<{ name: string; organizer_email: string; status: string }>(
    `select name, organizer_email, status from groups where id = $1`,
    [groupId],
  );
  return rows[0];
}

async function participantRow(db: Db, groupId: string, participantId: string) {
  const rows = await db.query<{ name: string; email: string; status: string }>(
    `select name, email, status from participants where id = $1 and group_id = $2`,
    [participantId, groupId],
  );
  return rows[0];
}

async function link(db: Db, kind: "organizer" | "participant", groupId: string, participantId?: string) {
  const token = await issueToken(db, { kind, groupId, participantId });
  return `${env.appUrl}/a/${token}`;
}

/** Build an email from current DB state. Links / codes are minted here, never stored in the queue. */
async function build(db: Db, job: EmailJob): Promise<Built> {
  const g = await groupRow(db, job.groupId);
  if (!g) return "stale";

  switch (job.template) {
    case "organizer_welcome":
      return { to: g.organizer_email, content: T.organizerWelcome({ groupName: g.name, link: await link(db, "organizer", job.groupId) }) };
    case "organizer_recovery":
      return { to: g.organizer_email, content: T.organizerRecovery({ groupName: g.name, link: await link(db, "organizer", job.groupId) }) };
    case "draw_failed":
      if (g.status !== "open") return "stale";
      return {
        to: g.organizer_email,
        content: T.drawFailed({ groupName: g.name, reason: T.drawFailureReason(job.reason), link: await link(db, "organizer", job.groupId) }),
      };
    case "emergency_code": {
      const ok = await db.query(
        `select 1 from emergency_challenges where id = $1 and group_id = $2 and consumed_at is null and expires_at > now()`,
        [job.challengeId, job.groupId],
      );
      if (ok.length === 0) return "stale";
      const code = generateOtp();
      return {
        to: g.organizer_email,
        content: T.emergencyCode({ groupName: g.name, code }),
        // Store the hash only once the code was handed to the provider, so a
        // retry never invalidates a code that was already delivered.
        afterSend: async () => {
          await db.query(
            `update emergency_challenges set code_hash = $2 where id = $1 and consumed_at is null and expires_at > now()`,
            [job.challengeId, emergencyCodeHash(job.challengeId, code)],
          );
        },
      };
    }
  }

  const p = await participantRow(db, job.groupId, job.participantId);
  if (!p) return "stale";

  switch (job.template) {
    case "participant_welcome":
    case "participant_recovery": {
      if (p.status !== "pending" && p.status !== "approved") return "stale";
      const l = await link(db, "participant", job.groupId, job.participantId);
      return {
        to: p.email,
        content:
          job.template === "participant_welcome"
            ? T.participantWelcome({ groupName: g.name, link: l, pending: p.status === "pending" })
            : T.participantRecovery({ groupName: g.name, link: l }),
      };
    }
    case "join_request_received":
      if (p.status !== "pending") return "stale";
      return {
        to: g.organizer_email,
        content: T.joinRequestReceived({ groupName: g.name, requesterName: p.name, link: await link(db, "organizer", job.groupId) }),
      };
    case "join_approved":
      if (p.status !== "approved") return "stale";
      return { to: p.email, content: T.joinApproved({ groupName: g.name, link: await link(db, "participant", job.groupId, job.participantId) }) };
    case "join_rejected":
      if (p.status !== "rejected") return "stale";
      return { to: p.email, content: T.joinRejected({ groupName: g.name }) };
    case "assignment_ready":
    case "new_message": {
      if (p.status !== "approved" || g.status === "open") return "stale";
      if (job.template === "new_message" && g.status !== "drawn") return "stale";
      const l = await link(db, "participant", job.groupId, job.participantId);
      return {
        to: p.email,
        content: job.template === "assignment_ready" ? T.assignmentReady({ link: l }) : T.newMessage({ thread: job.thread, link: l }),
      };
    }
  }
}

/** Short, PII-free error description for last_error / logs. */
function shortError(err: unknown): string {
  if (err instanceof ProviderError) return err.short;
  const name = (err as { name?: string })?.name;
  return typeof name === "string" && /^[A-Za-z]{1,40}$/.test(name) ? name : "Error";
}

/** Claim due jobs (FOR UPDATE SKIP LOCKED), render, send, retry with backoff. Respects provider limits. */
export async function processEmailJobs(db: Db, opts?: { limit?: number }): Promise<{ sent: number; failed: number; deferred: number }> {
  const result = { sent: 0, failed: 0, deferred: 0 };
  const simulate = env.emailMode === "simulate";

  const [{ n: sentToday }] = await db.query<{ n: number }>(
    `select count(*)::int as n from email_jobs where status = 'sent' and sent_at > now() - interval '24 hours'`,
  );
  const budget = Math.min(opts?.limit ?? 25, env.emailDailyLimit - sentToday);
  if (budget <= 0) {
    const [{ n }] = await db.query<{ n: number }>(
      `select count(*)::int as n from email_jobs where status = 'pending' and next_attempt_at <= now()`,
    );
    result.deferred = n;
    return result;
  }

  const jobs = await db.query<JobRow>(
    `update email_jobs set status = 'sending', attempts = attempts + 1, next_attempt_at = now()
      where id in (
        select id from email_jobs
         where (status = 'pending' and next_attempt_at <= now())
            or (status = 'sending' and next_attempt_at <= now() - interval '10 minutes')
         order by created_at
         limit $1
         for update skip locked)
      returning id, group_id, template, payload, attempts`,
    [budget],
  );

  let first = true;
  for (const job of jobs) {
    const payload = (typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload) as EmailJob;
    try {
      const built = await build(db, payload);
      if (built === "stale") {
        await db.query(`update email_jobs set status = 'failed', last_error = 'stale' where id = $1`, [job.id]);
        result.failed++;
        continue;
      }
      const rendered = await renderEmail(built.content);
      if (!simulate && !first) await new Promise((r) => setTimeout(r, SEND_PACING_MS));
      first = false;
      const sent = await deliver(db, built.to, rendered, job.id);
      if (built.afterSend) await built.afterSend();
      await db.query(
        `update email_jobs set status = 'sent', sent_at = now(), last_error = null, provider_id = $2 where id = $1`,
        [job.id, "providerId" in sent ? sent.providerId : "idempotent-replay"],
      );
      result.sent++;
    } catch (err) {
      const short = shortError(err);
      const permanent = (err instanceof ProviderError && !err.retryable) || job.attempts >= MAX_ATTEMPTS;
      logError("email.send_failed", err, { jobId: job.id, template: job.template, attempt: job.attempts, error: short });
      if (permanent) {
        await db.query(`update email_jobs set status = 'failed', last_error = $2 where id = $1`, [job.id, short]);
        result.failed++;
      } else {
        await db.query(
          `update email_jobs set status = 'pending', last_error = $2, next_attempt_at = now() + make_interval(mins => $3) where id = $1`,
          [job.id, short, backoffMinutes(job.attempts)],
        );
        result.deferred++;
      }
    }
  }
  return result;
}
