# Product

<!-- impeccable:product-schema 1 -->

> Product requirements come from the project brief, `ARCHITECTURE.md` and `src/lib/contracts.ts`. Assumptions about users and usage are marked *(inferred)*; they have not been confirmed in interviews.

## Platform

web

## Users

- Organizers: one person per group (a family member, a friend, a team lead) setting up a Secret Santa for 3 to 20 people. Often on a laptop or desktop, planning ahead of the holidays. They invite people, set exclusions and approval rules, and choose a draw date. They need a fair drawing without seeing the assignments.
- Participants: everyone else. They usually arrive on a phone through an email or a link in a group chat. They need to join in under a minute, add a wishlist and find out who they are buying for. They can also message their recipient or their own Santa anonymously.
- Neither group creates an account. Many participants will use the product once a year. *(inferred)* A meaningful share are non-technical relatives.

## Purpose

SantaElf lets small groups organize a Secret Santa exchange online, from invitations and drawing names to wishlists and anonymous chat. People use private links instead of creating accounts. The exchange succeeds when each person learns their recipient privately and has enough gift ideas to buy something they will enjoy.

## Positioning

- SantaElf is free and accountless. Access is by private links (capability links emailed to each person), never by passwords. Lost links are recovered by email at `/recover`.
- The elves draw the names when the organizer starts the draw or at a scheduled time. The organizer never sees the full assignment list.
- Each Santa is given a secret alias from a fixed pool of 20 (Rudolph, Dasher, … Northstar), so a recipient can chat with "Dasher — your Secret Santa" without learning who it is.
- Participants open a Christmas card to see their recipient.

## Usage

- Flow: organizer creates a group (`/new`) → shares an invite link (`/j/<code>`) → people join (optionally approved by the organizer) → exclusions set ("these two shouldn't draw each other") → draw (manual or scheduled) → each participant opens their card (`/p/...`) → wishlists with gift ideas and links → anonymous chat until the exchange → group closes and is auto-deleted (60 days after the exchange date).
- Emails carry private links; links expire after 180 days or can be revoked. Expired/invalid links land on `/expired`.
- Season: mostly November and December. *(inferred)* Usage spikes at evening and weekends, on phones, in the middle of a group chat.

## Capabilities and constraints

- Groups of **3 to 20** approved participants.
- Optional organizer approval of joiners; exclusions between pairs; scheduled draws in the group's time zone.
- Organizer emergency reveal of one participant's recipient, protected by an emailed 6-digit code and recorded in the audit log.
- Privacy invariants: no page may link a Santa's real identity to their alias or recipient, except the giver seeing their own recipient.
- Anonymity is not absolute: in a small group people can still guess from writing style or gifts. Copy must not promise guaranteed anonymity.
- Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, Postgres. No accounts, no analytics claims.

## Brand

- Name: **SantaElf**. Personality: friendly, playful, magical, cozy, trustworthy, simple.
- Colours: deep Christmas green, warm cream, muted festive red, subtle gold accents, dark readable text; WCAG AA contrast.
- Visual elements: original friendly elf illustrations / lightweight inline SVG (drawn in-house, no copied or stock art), Christmas cards, gift boxes, seasonal details, soft transitions, small meaningful celebrations.
- Avoid: generic SaaS dashboards, purple gradients, oversized glassmorphism, clutter, heavy background animation, carousels, generic AI marketing copy, competing CTAs.

## Available assets and evidence

- No testimonials, user counts, press, ratings or customer logos exist. Do not fabricate any.
- No photography. All imagery is in-house SVG (`src/components/brand/`).
- Pricing: free. No paid tier exists; do not imply one.

## Product principles

1. Make it clear whose page is open and what their private link lets them do.
2. Write for people who use SantaElf once a year. Use plain words and keep tasks short.
3. Keep assignments private and explain the limits of anonymity.
4. Give the draw and card reveal a sense of occasion. Keep forms and settings quick to use.

## Accessibility and inclusion

WCAG 2.1 AA. Keyboard operable with visible focus; 44×44 px minimum touch targets; every input labelled; `prefers-reduced-motion` respected (the card reveal must have a non-animated path). Mobile-first; verified at 375 / 768 / 1024 / 1440 px.
