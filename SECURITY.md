# Security & Privacy

SantaElf handles email addresses, private gift assignments and anonymous conversations, without user accounts. This document describes the threat model, the controls in place, and their known limits.

## Reporting a vulnerability

Please open a private security advisory on the GitHub repository (Security → Report a vulnerability) rather than a public issue.

## What we protect

| Asset | Who may see it |
|---|---|
| Who gives to whom (assignment) | The giver sees **their own** recipient only. The organizer can reveal **one** participant's recipient through the audited emergency flow. No other users have access. |
| A Santa's alias ↔ real identity | The Santa themself. Recipients see the alias only. |
| Profiles & wishlists | The participant; after the drawing, their own Santa. |
| Participant emails | The participant and the organizer. |
| Messages | The two members of one giver→recipient pair. |

## Access model

- **No passwords or accounts.** Access is by *capability links*: 256-bit random tokens (`crypto.randomBytes(32)`), stored only as SHA-256 hashes, scoped by role (`organizer` / `participant`), group and participant, expiring after 180 days, revocable (removed participants are revoked immediately).
- Links open `/a/<token>`, which swaps the token for an `httpOnly`, `SameSite=Lax` (and `Secure` in production) cookie and redirects to a token-free URL. Pages send `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex` and `Cache-Control: no-store` on private routes, load no third-party scripts, and are framed-denied. Every response carries a Content-Security-Policy (`default-src 'self'`, no third-party origins, `object-src 'none'`, `frame-ancestors 'none'`); scripts need `'unsafe-inline'` because Next.js bootstraps with inline scripts and we don't use nonces, so the CSP limits *where* code can come from rather than fully preventing injected inline script — React's escaping remains the primary XSS defence (no `dangerouslySetInnerHTML` with user content).
- The **invite link** (`/j/<code>`) is not a credential: it only shows the public invite and lets someone ask to join. It never exposes participant names or assignments.
- Every organizer API route verifies an organizer token for *that* group; every participant route verifies a participant token for *that* participant. Services scope every query by the authenticated group/participant.
- State-changing requests require a same-origin `Origin` header (missing, cross-site or opaque `null` origins get 403) (CSRF defence in depth on top of SameSite cookies) and JSON bodies validated with Zod.

## Anonymity guarantees (and limits)

- Messages store only `sender_role` (`santa` / `recipient`) on the assignment pair. They never store a sender participant id. The recipient's thread API returns the Santa's alias and message text only; tests assert the Santa's name, email and id are absent from the recipient's responses.
- Aliases are assigned server-side at draw time from a 20-name pool with a cryptographically secure shuffle, unique per group, immutable (database trigger).
- Assignment emails never contain the recipient's name; message notification emails never contain message text or names, and have no Reply-To (so email replies can't bypass anonymity).
- The organizer dashboard shows, per participant, whether they opened their card and the status of their latest *membership/assignment* email. It deliberately omits message notifications: their timing would let an organizer who also takes part reply to their Santa and watch whose "last email" changes.
- Audit events and logs contain ids and event types only. They never contain names, emails, tokens, message bodies or assignment targets. The emergency-reveal audit records which participant was revealed, not who they drew.
- **Limits:** in small groups, people can sometimes guess their Santa from writing style, timing or the gift itself. SantaElf does not and cannot promise mathematically guaranteed anonymity. The organizer's emergency reveal is a deliberate, logged exception.

## Accountless enrollment: impersonation & unwanted email

Joining requires only a name and email, without verification (a product requirement). Risks and mitigations:

| Risk | Mitigation |
|---|---|
| Someone joins using another person's email | Optional organizer approval; organizer sees every participant and can remove them; the real owner receives a welcome email, so they learn about it. |
| Someone claims an existing profile by re-entering its email | Rejected with `DUPLICATE_EMAIL`; no token is issued. Access can only be recovered by a link sent **to the registered address**. |
| Using SantaElf to spam arbitrary addresses | Per-client and per-invite rate limits on joining, per-email and per-IP limits on recovery, a honeypot field, per-organizer limits on group creation, a global daily email cap, and emails contain no attacker-controlled free text except names/group names. |
| Leaking private data to an unverified address | Welcome emails contain only that person's own private link. Assignments go out only after the organizer draws (and approves people, when approval is on). |
| Account/membership enumeration via recovery | Recovery always returns the same response. (Joining with an already-registered email does reveal that it is registered in *that* group — an accepted trade-off for a clear user message.) |

### Rate limits and client IPs

Rate limits are Postgres fixed windows keyed by a hash (no raw IPs/emails stored). The "client" part of a key comes **only** from `TRUSTED_IP_HEADER`, a header the hosting platform overwrites (default `x-real-ip` on Vercel). `X-Forwarded-For` is never trusted by default because any client can set it to get a fresh quota per request. Without a trusted header (self-hosting behind an unknown proxy) all clients share one bucket: limits can't be bypassed, but one noisy client can exhaust e.g. the join limit (10 per 10 minutes) for everyone, so configure the header for your proxy.

## Data integrity

- Postgres enforces: one email per group, ≤ 20 approved participants (trigger serialized by locking the group row, safe under concurrent joins/approvals), valid membership transitions, membership locked after the drawing, one recipient per giver and one giver per recipient, no self-assignment, no cross-group assignments/exclusions (composite foreign keys), immutable assignments and aliases.
- Drawings run in a single transaction holding the group row lock; repeated or concurrent draw requests are idempotent. Email delivery is decoupled: failures never redraw.
- Supabase: Row Level Security is enabled on every table with no policies (including the runner's own `schema_migrations`, since migration 0002; a test asserts no table lacks RLS), so the public `anon`/`authenticated` API roles can read nothing. The app connects server-side only; no database keys reach the browser.

## Emergency reveal

Organizer chooses one participant → server emails a 6-digit code to the organizer's address (generated at send time, stored hashed, 10-minute expiry, 5 attempts, single use, 5 challenges/hour/group) → on success the server returns only that participant's recipient and writes an audit event. There is no "reveal all".

## Retention

Groups and all associated personal data are deleted automatically 60 days after the exchange date (or 180 days after creation if no date was set) by the scheduled cleanup. Organizers can delete a group immediately at any time. Simulated emails (demo mode) are purged after 7 days; sent email job records after 30 days.

## Local demo outbox

In simulate mode every email is stored in `dev_outbox` and shown at `/dev/outbox`, including private links and emergency codes. The page is therefore only served outside production builds, or with the explicit `ENABLE_DEV_OUTBOX=true` opt-in (used by E2E tests). A production deployment that forgot `RESEND_API_KEY` silently simulates email but does **not** publish the outbox.

## Secrets

No secrets are committed (`.env*` is git-ignored; `.env.example` holds placeholders only). `DATABASE_URL`, `RESEND_API_KEY` and `CRON_SECRET` are server-only and never exposed to client bundles (`server-only` guards on env/db/auth modules; verified by grepping the production client bundle). At the last review (2026-11-17) `npm audit --omit=dev` reported no advisories for production dependencies; the remaining advisories (a picomatch ReDoS) affect dev tooling only (ESLint, Vite/Vitest). The cron endpoint requires `Authorization: Bearer $CRON_SECRET` (constant-time comparison).
