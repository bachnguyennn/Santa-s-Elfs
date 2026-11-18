import type { Db } from "../db/types";
import { env } from "../env";
import type { RenderedEmail } from "./render";

/** A send failure with a short, PII-free description safe to store in email_jobs.last_error. */
export class ProviderError extends Error {
  constructor(
    readonly short: string,
    readonly retryable: boolean,
  ) {
    super(short);
    this.name = "ProviderError";
  }
}

export type SendResult = { providerId: string } | { alreadySent: true };

/**
 * Deliver one email. Simulate mode writes to dev_outbox; resend mode calls the
 * Resend REST API with `Idempotency-Key: <job id>` so retries never double-send.
 * No Reply-To: replies must not bypass the anonymous messaging.
 */
export async function deliver(db: Db, to: string, email: RenderedEmail, idempotencyKey: string): Promise<SendResult> {
  if (env.emailMode === "simulate") {
    const rows = await db.query<{ id: string }>(
      `insert into dev_outbox (to_email, subject, html, text) values ($1, $2, $3, $4) returning id`,
      [to, email.subject, email.html, email.text],
    );
    return { providerId: `simulated:${rows[0].id}` };
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from: env.emailFrom, to: [to], subject: email.subject, html: email.html, text: email.text }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "Error";
    throw new ProviderError(`network:${name}`.slice(0, 60), true);
  }

  if (res.ok) {
    const body = (await res.json().catch(() => ({}))) as { id?: unknown };
    return { providerId: typeof body.id === "string" ? body.id.slice(0, 100) : "unknown" };
  }

  const errBody = (await res.json().catch(() => ({}))) as { name?: unknown };
  const errName = typeof errBody.name === "string" && /^[a-z_]{1,50}$/.test(errBody.name) ? errBody.name : "";
  // Same key, different body: a previous attempt with this job id was accepted
  // (links/codes are minted per attempt, so the body differs). It was sent.
  if (res.status === 409 && errName === "invalid_idempotent_request") return { alreadySent: true };
  // 400/422 = the request itself is invalid (e.g. bad address): retrying won't help.
  // Everything else (429 rate/quota, 401/403 config, 5xx) may recover.
  const retryable = res.status !== 400 && res.status !== 422;
  throw new ProviderError(`http_${res.status}${errName ? `:${errName}` : ""}`, retryable);
}
