import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { emailSchema } from "@/lib/contracts";
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
 * Deliver through the configured provider or local outbox.
 * Resend supports idempotency; Gmail SMTP can duplicate mail after an ambiguous failure.
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

  if (env.emailMode === "gmail") {
    const user = emailSchema.safeParse(env.gmailUser);
    if (!user.success || !env.gmailAppPassword) throw new ProviderError("gmail_config_missing", true);
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: user.data, pass: env.gmailAppPassword },
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
      logger: false, debug: false,
    });
    try {
      const sent = await transport.sendMail({
        // Always use the authenticated mailbox, even if EMAIL_FROM still names Resend.
        from: { name: "SantaElf", address: user.data }, to,
        subject: email.subject, html: email.html, text: email.text,
        // A stable, opaque Message-ID helps threading; SMTP does not guarantee deduplication.
        messageId: `<${createHash("sha256").update(idempotencyKey).digest("hex")}@gmail.com>`,
        disableFileAccess: true, disableUrlAccess: true,
      });
      if (!sent.accepted?.length) throw new ProviderError("gmail_no_recipient_accepted", true);
      return { providerId: `gmail:${createHash("sha256").update(idempotencyKey).digest("hex")}` };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const smtp = err as { code?: string; responseCode?: number; command?: string };
      // SMTP errors can contain credentials, addresses and full server replies. Never retain them.
      const code = ["EAUTH", "ECONNECTION", "ESOCKET", "ETIMEDOUT", "EENVELOPE", "EMESSAGE", "EDNS", "ESTREAM"].includes(smtp.code ?? "") ? smtp.code : "ERROR";
      const status = Number.isInteger(smtp.responseCode) && smtp.responseCode! >= 400 && smtp.responseCode! <= 599 ? smtp.responseCode : undefined;
      const badRecipient = smtp.command === "RCPT TO" && status !== undefined && status >= 500;
      throw new ProviderError(`gmail_${code}${status ? `_${status}` : ""}`, !badRecipient);
    }
  }

  if (!env.resendApiKey) throw new ProviderError("resend_config_missing", true);
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
