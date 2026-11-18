# SantaElf 🎁

A free, accountless Secret Santa web app for groups of 3–20. The organizer shares one link, the elves draw names, everyone unwraps their assignment through an animated Christmas card, and recipients can chat with their Santa — who appears only under a secret Christmas alias.

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
- **Email notifications** via Resend with a durable queue, retries and duplicate protection — or simulated locally.
- **Privacy by default:** hashed tokens, strict response DTOs, no-referrer/no-index private pages, privacy-preserving audit log, automatic data deletion after the exchange. See [SECURITY.md](SECURITY.md).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Radix primitives · Lucide icons · Zod · PostgreSQL (Supabase in production, [PGlite](https://pglite.dev) locally) · React Email + Resend · Vitest · Playwright.

One Next.js app; Postgres is also the job queue and rate limiter. See [ARCHITECTURE.md](ARCHITECTURE.md), [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md).

## Run it locally (demo mode — no accounts or keys needed)

Requirements: Node.js 20.9+ (22 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables set, SantaElf runs in **local demo mode**:

- Data lives in an embedded Postgres (PGlite) under `.data/pglite` — delete that folder to reset.
- **Emails are simulated, not sent.** Every email (including private links and emergency codes) appears at **http://localhost:3000/dev/outbox**. The outbox page is disabled whenever real email is configured.
- Scheduled drawings run when the cron endpoint is called: `curl http://localhost:3000/api/cron/tick` (allowed without a secret only outside production).

Tip: to try several participants on one machine, use separate browser profiles or private windows — each private link sets a cookie for that participant.

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Purpose |
|---|---|
| `APP_URL` | Public base URL used in emailed links, e.g. `https://santaelf.example.com` |
| `DATABASE_URL` | Postgres connection string. Empty → local PGlite. **Required when deployed.** |
| `RESEND_API_KEY` | Enables real email via Resend. Empty → simulated email. |
| `EMAIL_FROM` | Sender, e.g. `SantaElf <santa@yourdomain.com>` (domain must be verified in Resend) |
| `EMAIL_MODE` | Force `simulate` even with a key (useful for staging) |
| `EMAIL_DAILY_LIMIT` | Daily send cap (default 100, matching Resend's free tier) |
| `CRON_SECRET` | Bearer secret for `GET /api/cron/tick` (`openssl rand -hex 32`) |

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

## Email & scheduled drawings

- **Email:** create a free [Resend](https://resend.com) account, verify a sending domain, set `RESEND_API_KEY` and `EMAIL_FROM`. Emails are queued in the `email_jobs` table, sent right after each action, and retried with backoff (up to 5 attempts) by the cron tick. Resend idempotency keys prevent double delivery on retries.
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

## Deploying (Vercel + Supabase + Resend)

1. **Supabase:** create a project. Copy the *transaction pooler* connection string (port 6543) as `DATABASE_URL`. Apply migrations from your machine:
   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   ```
   (RLS is enabled on all tables with no policies — the app talks to Postgres server-side only. Do not expose the database through client SDKs.)
2. **Resend:** verify your domain, create an API key.
3. **Vercel:** import the GitHub repo, set `APP_URL`, `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`. Deploy.
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
