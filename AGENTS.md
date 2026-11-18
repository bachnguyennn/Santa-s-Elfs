# SantaElf — Agent & Contributor Guidelines

These rules apply to **every** contributor and coding agent working in this repository.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Engineering principles (adapted from Karpathy-inspired guidelines)

1. **Think before coding.** Read the relevant code, `ARCHITECTURE.md` and `src/lib/contracts.ts` first. State assumptions. If two interpretations exist, surface them instead of picking silently.
2. **Simplicity first.** Minimum code that solves the problem. No speculative abstractions, no new dependencies without a demonstrated need, no microservices. One Next.js app, one Postgres database.
3. **Surgical changes.** Touch only what the task needs. Match existing style. Don't refactor or reformat unrelated code; mention dead code instead of deleting it.
4. **Goal-driven execution.** Define a verifiable success criterion (usually a test), implement, then verify: `npm run typecheck && npm run lint && npm test`.

## Project rules

- **Contracts are the source of truth.** Request schemas and response DTOs live in `src/lib/contracts.ts`. API routes validate with those schemas and return only those DTOs — never raw database rows.
- **Privacy invariants (never break):**
  - No API response, log line, email, audit record or HTML ever links a Santa's real identity (name, email, participant id) to their alias or to their recipient, except: the giver sees their own recipient; the organizer's audited, one-participant emergency reveal.
  - Assignment emails never contain the recipient's name.
  - Capability tokens are only stored hashed (SHA-256). Never log tokens, emails, names, or message bodies.
- **Authorization:** every route under `/api/o/*` calls `requireOrganizer`, every route under `/api/p/*` calls `requireParticipant`. Services receive `OrganizerCtx` / `ParticipantCtx` and must scope every query by `ctx.groupId` / `ctx.participantId`.
- **Database:** schema changes go in a new numbered file in `supabase/migrations/` (never edit an applied migration). Enforce invariants in the database where possible.
- **Randomness:** use `node:crypto` (`randomInt`, `randomBytes`), never `Math.random`, for anything security- or fairness-relevant.
- **Tests:** service logic gets integration tests against a real migrated database (`tests/helpers/db.ts`). Matching logic gets pure unit tests.
- **Design:** UI work follows `DESIGN.md` and the Impeccable skill (shape → build → critique/audit → polish). Mobile-first; verify at 375 / 768 / 1024 / 1440 px; keyboard and reduced-motion support are required.
- **Git:** small, descriptive commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). No AI co-author trailers or agent branding. Never force-push.
