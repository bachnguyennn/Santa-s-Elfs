# SantaElf Architecture

## Overview

SantaElf is a single Next.js (App Router) application written in TypeScript, backed by PostgreSQL.

```
Browser ──► Next.js pages (server components read via services)
        └─► /api/* route handlers ──► services (src/server/services, src/server/draw)
                                         └─► Db interface ──► Postgres (Supabase) | PGlite (local demo/tests)
Cron (GitHub Actions / Supabase pg_cron / Vercel cron) ──► GET /api/cron/tick
                                                            ├─ processDueDraws()
                                                            ├─ processEmailJobs() ──► Resend | Gmail SMTP | dev outbox
                                                            └─ retention purge
```

Postgres handles the email queue (`email_jobs`), rate limits (`rate_limits`) and locks (`SELECT … FOR UPDATE` on the group row). The app does not need Redis or a separate queue service.

## Modules

| Path | Responsibility |
|---|---|
| `src/lib/contracts.ts` | Zod request schemas, response DTOs, error codes, API route map (client-safe) |
| `src/lib/time.ts` | Timezone conversion (wall time in group tz ⇄ UTC), formatting |
| `src/server/db/*` | `Db` interface; PGlite + postgres.js drivers; migration runner |
| `src/server/tokens.ts` | Capability tokens: generate, hash, issue, resolve, revoke; `authenticate*` |
| `src/server/auth.ts` | Cookie sessions (`se_p_<participantId>`, `se_o_<groupId>`) → `require*` |
| `src/server/http.ts` | `api()` route wrapper: same-origin check, JSON errors, no internals leaked |
| `src/server/rateLimit.ts` | Postgres fixed-window limiter (hashed keys) |
| `src/server/audit.ts` | Privacy-preserving audit log |
| `src/server/services/*` | Groups, enrollment, profiles, exclusions, participant/reveal, messaging, emergency |
| `src/server/draw/*` | Matching engine (pure), alias assignment, `drawGroup` (atomic), scheduled draws |
| `src/server/email/*` | Queue, worker (retry/backoff/limits), templates (React Email), provider |
| `src/server/cron.ts`, `src/server/retention.ts` | Cron tick (auth + isolated steps), data retention purge |
| `src/components/ui/*` | Design-system primitives |

## Access model (accountless)

- **Invite code** (`/j/<code>`): public-ish, lets anyone *view the invite and request to join*. Never grants access to private data.
- **Capability tokens**: 256-bit random, stored as SHA-256 hashes in `access_tokens`, scoped by `kind` (`organizer` | `participant`), `group_id`, `participant_id`; expire after 180 days; revocable.
- **Private links** `/a/<token>` exchange the token for an httpOnly, SameSite=Lax cookie and redirect to a clean URL (`/o/<groupId>` or `/p/<participantId>`), so tokens don't linger in history, screenshots or Referer headers.
- On join/create the server sets the cookie directly (the "joining session"). Later access uses the emailed link or recovery, which only ever emails the **registered** address.
- Entering an existing email at join → `DUPLICATE_EMAIL`; it never grants access to the existing profile.

## Group lifecycle

`open` → (draw) → `drawn` → (organizer closes) → `closed`; delete at any time (cascade).
Participant statuses: `pending → approved | rejected`, `approved → removed`, `rejected/removed → approved` (only while open). Enforced by trigger `participants_guard`, which also enforces the 20-approved cap and membership lock, serialized by locking the group row.

## Drawing

`drawGroup(db, groupId, { trigger })` is the only way assignments are created (manual and scheduled):
1. Transaction; `SELECT … FOR UPDATE` the group. If `drawn` → return `already_drawn` (idempotent).
2. Load approved participants (≥3) and exclusions.
3. Matching: feasibility via bipartite perfect-matching; randomized backtracking with matching-based pruning (crypto RNG). Not claimed to be uniformly distributed.
4. Assign unique aliases from the 20-name pool (crypto shuffle).
5. Insert assignments, set aliases, set `status='drawn'`, queue `assignment_ready` emails (dedupe key per participant), audit. Commit.
Email failures never touch assignments. Scheduled failures set `draw_error` and email the organizer once.

## Messaging

A conversation = one assignment (`group_id`, `giver_id`). Messages store `sender_role` (`santa` | `recipient`), never a sender participant id. The recipient's API view of the thread contains only the Santa's alias. Recipients can mute and report.

## Emergency reveal

Organizer selects one participant → server creates a challenge and emails a 6-digit code to the organizer address (minted at send time) → organizer enters code (10-min expiry, 5 attempts, single use) → server returns that one recipient and writes an audit event (without the recipient).

## Email

`enqueueEmail()` inside the same transaction as the state change. Worker claims jobs with `FOR UPDATE SKIP LOCKED`, mints access links at send time, sends via Resend REST API or Gmail SMTP (or writes to `dev_outbox` in simulate mode), retries with exponential backoff (max 5 attempts; Resend `Idempotency-Key` = job id, and a 409 idempotency conflict means an earlier attempt was accepted), and respects a daily cap (`EMAIL_DAILY_LIMIT`) and per-second pacing. Gmail uses TLS on port 465 with a Google App Password and sends from `GMAIL_USER`. SMTP has no delivery-idempotency guarantee: a timeout after acceptance can produce a duplicate on retry, even with a stable Message-ID. Credentials and raw SMTP responses never enter job errors or logs.

## Retention

Groups (and all participant data) are purged automatically 60 days after the exchange date (or 180 days after creation when no date is set). Organizers can delete immediately.
