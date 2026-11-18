# Product

<!-- impeccable:product-schema 1 -->

> Written by the design agent from the project brief and repository (`ARCHITECTURE.md`, `src/lib/contracts.ts`). No live interview was possible (subagent run); facts below come from the written brief and are marked *(inferred)* where they are interpretation rather than quotation.

## Platform

web

## Users

- **Organizers** — one person per group (a family member, a friend, a team lead) setting up a Secret Santa for 3–20 people. Often on a laptop or desktop, planning ahead of the holidays. Job: get everyone in, set rules (exclusions, approval, a draw date), and let the drawing happen fairly without seeing who has whom.
- **Participants** — everyone else. Mostly on phones, arriving cold from an email or a chat link someone pasted in a group thread. Job: join in under a minute, add a wishlist, later find out who they are buying for, and optionally message their recipient (or their own Santa) anonymously.
- Neither group creates an account. Many participants will use the product once a year. *(inferred)* A meaningful share are non-technical relatives.

## Product Purpose

SantaElf runs a Secret Santa exchange end to end: invite, draw, reveal, wishlists, anonymous chat. It exists so a small group can do the exchange online without anyone signing up, without the organizer peeking, and without a paper hat. Success: every participant learns their recipient privately, buys something they actually wanted, and nobody had to remember a password.

## Positioning

- **Free and accountless.** Access is by private links (capability links emailed to each person), never by passwords. Lost links are recovered by email at `/recover`.
- **The elves draw the names**, manually by the organizer or automatically at a scheduled time — the organizer never sees the full assignment.
- **Christmas aliases.** Each Santa is given a secret alias from a fixed pool of 20 (Rudolph, Dasher, … Northstar), so a recipient can chat with "Dasher — your Secret Santa" without learning who it is.
- **The reveal is a Christmas card** the participant opens, not a table row.

## Operating Context

- Flow: organizer creates a group (`/new`) → shares an invite link (`/j/<code>`) → people join (optionally approved by the organizer) → exclusions set ("these two shouldn't draw each other") → draw (manual or scheduled) → each participant opens their card (`/p/...`) → wishlists with gift ideas and links → anonymous chat until the exchange → group closes and is auto-deleted (60 days after the exchange date).
- Emails carry private links; links expire after 180 days or can be revoked. Expired/invalid links land on `/expired`.
- Season: mostly November–December. *(inferred)* Usage spikes at evening and weekends, on phones, in the middle of a group chat.

## Capabilities and Constraints

- Groups of **3 to 20** approved participants.
- Optional organizer approval of joiners; exclusions between pairs; scheduled draws in the group's time zone.
- Organizer emergency reveal of one participant's recipient, gated by an emailed 6-digit code and audited.
- Privacy invariants: no page may link a Santa's real identity to their alias or recipient, except the giver seeing their own recipient.
- Anonymity is not absolute: in a small group people can still guess from writing style or gifts. Copy must not promise guaranteed anonymity.
- Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, Postgres. No accounts, no analytics claims.

## Brand Commitments

- Name: **SantaElf**. Personality: friendly, playful, magical, cozy, trustworthy, simple.
- Colour direction pinned by the brief: deep Christmas green, warm cream, muted festive red, subtle gold accents, dark readable text; WCAG AA contrast.
- Visual elements pinned by the brief: original friendly elf illustrations / lightweight inline SVG (drawn in-house, no copied or stock art), Christmas cards, gift boxes, seasonal details, soft transitions, small meaningful celebrations.
- Explicit anti-references: generic SaaS dashboards, purple gradients, oversized glassmorphism, clutter, heavy background animation, carousels, generic AI marketing copy, competing CTAs.

## Evidence on Hand

- No testimonials, user counts, press, ratings or customer logos exist. Do not fabricate any.
- No photography. All imagery is in-house SVG (`src/components/brand/`).
- Pricing: free. No paid tier exists; do not imply one.

## Product Principles

1. **One link, one person.** Every screen should make it obvious whose view this is and what this private link lets them do.
2. **Kind to the once-a-year user.** Plain words, few steps, nothing to remember.
3. **Secrecy is the product.** Never show what a person should not see; be honest about the limits.
4. **Ceremony where it matters, calm everywhere else.** The reveal and the draw get magic; forms and settings stay quiet and fast.

## Accessibility & Inclusion

WCAG 2.1 AA. Keyboard operable with visible focus; 44×44 px minimum touch targets; every input labelled; `prefers-reduced-motion` respected (the card reveal must have a non-animated path). Mobile-first; verified at 375 / 768 / 1024 / 1440 px.
