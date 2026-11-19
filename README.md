# SantaElf

SantaElf is a free Secret Santa web app for groups of 3 to 20 people. The organizer shares an invite link, and the elves draw names. Each person opens a Christmas card to see their recipient and can chat with their own Santa under a secret Christmas alias. Access is through private links sent by email.

## Features

- **Groups of 3–20** with budget, currency, signup deadline, exchange date and timezone.
- **No accounts:** people join with a name and email and get a private link (capability token) instead of a password. Lost links can be re-sent to the registered address.
- **Optional organizer approval** for join requests; capacity is enforced in the database, even under simultaneous joins.
- **Santa profiles & wishlists:** about me, interests, gift ideas with product links, things I don't want, notes.
- **Exclusions** ("these two shouldn't draw each other", or one-way), with feasibility checking before the draw.
- **Manual or scheduled drawing** through one atomic, idempotent drawing service. Membership locks after the draw.
- **Unique Christmas aliases** (Rudolph, Dasher, … Northstar) assigned securely per group.
- **Animated Christmas-card reveal** (skippable, reduced-motion aware) that never redraws.
- **Anonymous messaging** between each Santa and their recipient, with mute and report.
- **Audited emergency reveal** of one participant's assignment, protected by an emailed one-time code.
- **Email notifications** via Resend or Gmail with a durable queue and retries. Resend also provides duplicate-delivery protection. Emails can be simulated locally.
- **Privacy by default:** hashed tokens, strict response DTOs, no-referrer/no-index private pages, privacy-preserving audit log, automatic data deletion after the exchange. See [SECURITY.md](SECURITY.md).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Radix primitives · Lucide icons · Zod · PostgreSQL (Supabase in production, [PGlite](https://pglite.dev) locally) · React Email + Resend or Gmail · Vitest · Playwright.

One Next.js app; Postgres is also the job queue and rate limiter. See [ARCHITECTURE.md](ARCHITECTURE.md), [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md).

## Run it locally (demo mode, no accounts or keys needed)

Requirements: Node.js 20.9+ (22 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables set, SantaElf runs in **local demo mode**:

- Data lives in an embedded Postgres (PGlite) under `.data/pglite` — delete that folder to reset.
- **Emails are simulated.** Every email (including private links and emergency codes) appears at **http://localhost:3000/dev/outbox**. The outbox page is disabled whenever real email is configured, and in production builds (`next start`, deployments) unless `ENABLE_DEV_OUTBOX=true` — so a deployment that forgot `RESEND_API_KEY` doesn't publish everyone's private links.
- Scheduled drawings run when the cron endpoint is called: `curl http://localhost:3000/api/cron/tick` (allowed without a secret only outside production).

Tip: to try several participants on one machine, use separate browser profiles or private windows — each private link sets a cookie for that participant.

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Purpose |
|---|---|
| `APP_URL` | Public base URL used in emailed links, e.g. `https://santaelf.example.com` |
| `DATABASE_URL` | Postgres connection string. Empty → local PGlite. **Required when deployed.** |
| `RESEND_API_KEY` | Enables Resend when `EMAIL_MODE` is unset. Not needed for Gmail. |
| `EMAIL_FROM` | Resend sender, e.g. `SantaElf <santa@yourdomain.com>` (domain must be verified). Gmail always uses `GMAIL_USER`. |
| `EMAIL_MODE` | `simulate`, `resend` or `gmail`. Explicit real providers fail instead of silently simulating when credentials are missing. |
| `GMAIL_USER` | Gmail address used to send all app emails. |
| `GMAIL_APP_PASSWORD` | Google App Password for that mailbox. Never use your normal Google password. |
| `EMAIL_DAILY_LIMIT` | Daily send cap (default 100, matching Resend's free tier) |
| `CRON_SECRET` | Bearer secret for `GET /api/cron/tick` (`openssl rand -hex 32`) |
| `TRUSTED_IP_HEADER` | Header with the real client IP for per-IP rate limits. Must be one your platform/proxy **overwrites** (clients can forge anything else, e.g. `X-Forwarded-For`). Default: `x-real-ip` on Vercel; elsewhere unset, so all clients share one rate-limit bucket. `none` disables it. |
| `ENABLE_DEV_OUTBOX` | `true` exposes `/dev/outbox` in a production build (E2E only). Never on a real deployment. |

## Tests

```bash
npm test             # unit + integration tests (in-memory Postgres via PGlite)
npm run typecheck
npm run lint
npm run build
npm run test:e2e     # Playwright end-to-end (builds must exist: run `npm run build` first)
```

Integration tests run against a real migrated database. To run them against a real Postgres server (CI does this, which also exercises real row locking under concurrency):

```bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test
```

## Automated deployment checks

`npm run verify` runs typecheck, lint, unit/integration tests, a production build and the full Playwright suite. Install Chromium once with `npx playwright install chromium`. The existing **CI** GitHub workflow runs these checks on pushes to `main` and pull requests, including a separate real-Postgres test run. You can also start CI from **Actions → CI → Run workflow**.

The **Deployment check** workflow runs read-only checks after GitHub receives a successful Production deployment event. Set the repository secret `SANTAELF_URL` to your stable website URL, such as `https://santa-s-elfs.vercel.app`. It checks public pages, security headers, the disabled development outbox, cron authentication, a database-backed invite lookup and rejection of anonymous private-API requests. It does not send emails or create groups. If your hosting integration does not emit deployment events, use **Actions → Deployment check → Run workflow**.

Run the same read-only check locally:

```bash
SANTAELF_URL=https://santa-s-elfs.vercel.app npm run test:deployment
```

For the Resend-specific delivery rehearsal, add two more **GitHub repository secrets**:

| Secret | Value |
|---|---|
| `SANTAELF_TEST_EMAILS` | Three distinct, comma-separated email addresses you control. Use dedicated test inboxes or aliases. |
| `SANTAELF_RESEND_READ_KEY` | A Resend API key with permission to list and retrieve sent emails for the same Resend team as the app. A sending-only key is insufficient. |

Select **Actions → Deployment check → Run workflow** and enable **rehearsal**. This is manual because it creates a temporary group and sends real email. It checks three participants, wishlist persistence, organizer access from an emailed link, an actual scheduled draw, assignment emails and private links, stable reveals, anonymous messages and replies, role isolation, and access recovery. It never calls cron itself, so a passing draw verifies the configured scheduler. Allow up to 20 minutes for the draw, plus email delivery time. Keep the existing scheduler enabled with its `SANTAELF_URL` and `CRON_SECRET` secrets.

This delivery rehearsal requires Resend; it cannot inspect Gmail delivery. For Gmail, use the read-only deployment check and verify emailed links through the website and test inboxes. The rehearsal checks Resend's delivery event, which means acceptance by the recipient mail server. It cannot establish inbox-versus-spam placement; inspect the three inboxes separately. It uses the HTTP API and rendered page responses; the existing Playwright suite covers browser interactions. Successful writes exercise the deployed database schema but do not certify backups, capacity or every migration.

For a local rehearsal, put those three variables in a git-ignored `.env.deployment.local`, then run:

```bash
node --env-file=.env.deployment.local --import tsx scripts/check-deployment.ts rehearsal
```

The rehearsal prints fixed progress messages without identities, assignments, tokens, message bodies or HTTP dumps. It deletes its own group on success and on ordinary failures, retrying deletion three times. If the process is forcibly killed or cleanup fails, use the organizer email for the group named **Deployment check** to delete it before rerunning. Delivered emails remain in the test inboxes and provider records. Each rehearsal normally sends about 11 emails and uses normal rate limits; rerunning consumes additional email quota. Avoid running it alongside a real exchange near the daily cap.

## Sending through Gmail without a custom domain

Gmail mode sends from an existing Gmail mailbox using Nodemailer over TLS (`smtp.gmail.com:465`). It does not require Resend or a custom domain.

1. Enable [2-Step Verification](https://myaccount.google.com/security) on the Google account you want SantaElf to send from.
2. Create a Google [App Password](https://myaccount.google.com/apppasswords), named SantaElf. Use that password for the app, never your normal Google login password. Google may not offer App Passwords for some managed accounts or security configurations; see [Google's requirements](https://support.google.com/mail/answer/185833).
3. In **Vercel → Settings → Environment Variables**, set these for **Production**:

   ```text
   EMAIL_MODE=gmail
   GMAIL_USER=your-sending-account@gmail.com
   GMAIL_APP_PASSWORD=your-google-app-password
   EMAIL_DAILY_LIMIT=100
   ```

4. Save and redeploy. `EMAIL_MODE=gmail` takes precedence over an old `RESEND_API_KEY`. Gmail mode ignores `EMAIL_FROM` and uses `SantaElf <GMAIL_USER>`, so an old Resend sender cannot interfere. Set the same variables in `.env.local` to test locally.
5. Request one new private link and check its inbox and spam folder. Pending jobs use the new provider on their next retry. Jobs already marked failed need a new resend or recovery request.

All app messages come from this mailbox, so recipients will see its address. A dedicated SantaElf Gmail account keeps it separate from personal mail. Replies arrive in that mailbox; use the app's anonymous chat for gift questions. Assignment emails still omit the recipient's name, and notification emails omit message bodies.

Gmail applies account-wide sending limits and anti-abuse checks. Personal accounts generally have a limit of 500 recipients in a rolling day; ordinary mailbox activity counts too, and sending can be blocked sooner. SantaElf keeps its own default cap of 100 per rolling 24 hours across all groups. Gmail is suitable for a small trial, with less predictable delivery and capacity than a transactional email service. See [Nodemailer's Gmail guide](https://nodemailer.com/guides/using-gmail).

SMTP does not provide Resend's idempotency guarantee. A connection failure after Gmail accepts an email can cause a duplicate on retry. SantaElf uses a stable, opaque Message-ID for each job, but does not promise Gmail will deduplicate it. Failed sends never redraw assignments.

## Email & scheduled drawings

- **Email:** create a free [Resend](https://resend.com) account, verify a sending domain, set `RESEND_API_KEY` and `EMAIL_FROM`. Emails are queued in the `email_jobs` table, sent right after each action, and retried with backoff (up to 5 attempts) by the cron tick. Resend uses idempotency keys for duplicate protection within its retention window. Gmail uses SMTP, where retries can duplicate a message.
- **Cron tick:** `GET /api/cron/tick` with `Authorization: Bearer $CRON_SECRET` runs due scheduled drawings, retries emails and purges expired data. Trigger it every 5–15 minutes with any of:
  - **GitHub Actions** (included: `.github/workflows/cron.yml`, every 10 minutes). Add repository secrets `SANTAELF_URL` and `CRON_SECRET`.
  - **Supabase pg_cron + pg_net:**
    ```sql
    select cron.schedule('santaelf-tick', '*/10 * * * *', $$
      select net.http_get(
        url := 'https://YOUR-APP/api/cron/tick',
        headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'));
    $$);
    ```
  - **Vercel Cron** (`vercel.json` includes a once-daily backstop — Hobby plans only allow daily crons).

## Deploying on Vercel

1. **Supabase:** create a project. Copy the *transaction pooler* connection string (port 6543) as `DATABASE_URL`. Apply migrations from your machine:
   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   ```
   (RLS is enabled on all tables with no policies — the app talks to Postgres server-side only. Do not expose the database through client SDKs.)
2. **Email:** configure Gmail using the steps above, or verify a domain in Resend and create an API key.
3. **Vercel:** import the GitHub repo and set `APP_URL`, `DATABASE_URL` and `CRON_SECRET`. For Gmail, add `EMAIL_MODE=gmail`, `GMAIL_USER` and `GMAIL_APP_PASSWORD`. For Resend, add `RESEND_API_KEY` and `EMAIL_FROM`. Deploy.
4. **Cron:** add `SANTAELF_URL` and `CRON_SECRET` as GitHub Actions secrets (or use pg_cron) so scheduled drawings happen on time.

## Free-tier limitations (verify current limits before launch)

- **Resend free:** about 100 emails/day and 3,000/month, with a per-second rate limit. A 20-person draw sends 20 emails at once; SantaElf paces sends and defers anything over `EMAIL_DAILY_LIMIT` to the next day.
- **Supabase free:** small database quota and projects pause after a period of inactivity — fine for seasonal use, but the first request after a pause is slow.
- **Vercel Hobby:** for personal, non-commercial use; cron jobs limited to once per day (hence the GitHub Actions/pg_cron tick).
- **GitHub Actions schedules** can run late under load and are disabled after 60 days without repository activity.
- Scheduled drawings happen on the first cron tick after the chosen time, so expect up to ~10 minutes of delay.

## Project docs

- [PRODUCT.md](PRODUCT.md) — product context and users
- [DESIGN.md](DESIGN.md) — visual system and UI conventions
- [ARCHITECTURE.md](ARCHITECTURE.md) — modules, data model, flows
- [SECURITY.md](SECURITY.md) — threat model, privacy controls, retention
- [AGENTS.md](AGENTS.md) — contributor & coding-agent guidelines

## Future improvements

- Optional email verification step for organizers who want stronger identity checks.
- Wishlist "claimed" markers visible only to the Santa.
- Multiple languages and right-to-left support.
- Organizer-configurable avoidance of two-person loops (A↔B).
- Calendar (.ics) attachments for the exchange date.
- Self-serve "reroll before anyone opens" with organizer confirmation.
