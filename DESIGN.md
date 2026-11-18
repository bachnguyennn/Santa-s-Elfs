---
name: SantaElf
description: Free, accountless Secret Santa for groups of 3–20. Names drawn from the hat by elves.
colors:
  pine-950: "#0b2a1e"
  pine-900: "#103826"
  pine-800: "#164a33"
  pine-700: "#1c5c40"
  pine-600: "#2a7253"
  pine-300: "#9fc3ad"
  pine-200: "#c4dccd"
  pine-100: "#e1ede5"
  cream-50: "#fdf9f0"
  cream-100: "#f8f0df"
  cream-200: "#efe2c6"
  cream-300: "#e4d2ad"
  berry-800: "#6f1f22"
  berry-700: "#8e2b2c"
  berry-600: "#a8383a"
  berry-500: "#c24e4c"
  berry-100: "#f6dedb"
  gold-700: "#7a5a17"
  gold-600: "#b07f26"
  gold-500: "#c99a3a"
  gold-400: "#ddb65a"
  gold-200: "#f1e1b4"
  ink-900: "#1e1a14"
  ink-700: "#4a4136"
  ink-500: "#6b6052"
  line: "#e3d5b8"
  line-strong: "#cdb98f"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7.5vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lg:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.4
  hand:
    fontFamily: "Shantell Sans, ui-rounded, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  slip: "6px"
  control: "12px"
  card: "20px"
  pill: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "24px"
  section-mobile: "64px"
  section-desktop: "96px"
components:
  button-primary:
    backgroundColor: "{colors.pine-800}"
    textColor: "{colors.cream-50}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.pine-900}"
  button-festive:
    backgroundColor: "{colors.berry-600}"
    textColor: "{colors.cream-50}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 20px"
  button-festive-hover:
    backgroundColor: "{colors.berry-700}"
  button-secondary:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.pine-900}"
    rounded: "{rounded.control}"
    height: "48px"
  button-light:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.pine-900}"
    rounded: "{rounded.control}"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.cream-50}"
    rounded: "{rounded.card}"
    padding: "24px"
  slip:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.slip}"
  badge-green:
    backgroundColor: "{colors.pine-100}"
    textColor: "{colors.pine-900}"
    rounded: "{rounded.pill}"
---

# Design System: SantaElf

## Overview

### Names from the hat

SantaElf looks like the Secret Santa draw everybody already knows: names written on folded paper slips, dropped into a red felt hat, pulled out one by one. Elves do the drawing. Screens use pine felt for the hat lining and table, cream paper slips for text, and gold thread to connect steps and mark focus. Use berry red sparingly for the main action on a screen and for errors.

Use felt backgrounds, tilted slips, handwriting and a small gold animation on the landing page, draw, card reveal and join confirmation. Forms, organizer settings, wishlists and chat use cream backgrounds and straight layouts with the same typography and controls. Design for someone using SantaElf once a year on a phone, with large targets and plain instructions.

Avoid (see PRODUCT.md): generic SaaS dashboards, purple gradients, oversized glassmorphism, clutter, heavy background animation, carousels, generic AI marketing copy, competing CTAs.

### Visual rules
- Pine felt grounds for ceremony, cream paper for work.
- Text on paper slips: real, selectable text on a cream sheet with a fold crease and a slight tilt.
- One berry action per screen.
- One even line weight across all illustrations; flat fills; no gradients in art.
- Handwriting only for names and aliases.
- Motion is one authored moment per screen, exponential ease-out, instant under reduced motion.

## Colors

A Christmas palette made of materials: felt green, paper cream, hat red, thread gold. Defined as Tailwind v4 `@theme` tokens in `src/app/globals.css` (utilities: `bg-pine-900`, `text-berry-700`, `border-line`…).

### Primary
- **Felt Pine** (`pine-900` #103826): ceremony grounds (with the `.felt` texture class), theme colour. Cream text on it is 12.4:1.
- **Button Pine** (`pine-800` #164a33): `primary` buttons, headings on cream (`text-pine-900` for headings).
- **Link Pine** (`pine-600` #2a7253): inline links on cream (5.5:1).
- **Mist Pine** (`pine-200` #c4dccd, `pine-300` #9fc3ad): body (9.0:1) and secondary (6.7:1) text on felt. Never use gray or white/opacity on felt.
- **Pine wash** (`pine-100` #e1ede5): success/info backgrounds, `green` badge.

### Secondary
- **Hat Berry** (`berry-600` #a8383a): the `festive` button, the hat, the wax seal. Cream text on it 6.1:1.
- **Deep Berry** (`berry-700` #8e2b2c, `berry-800` #6f1f22): hover, `danger`, error text (6.5:1 on `berry-100`).
- **Berry wash** (`berry-100` #f6dedb): error alert background, `red` badge.

### Tertiary
- **Thread Gold** (`gold-500` #c99a3a): thread lines, step connectors. Decorative only (2.5:1 on cream, never text).
- **Focus Gold** (`gold-600` #b07f26): the global focus outline (3.4:1 on cream, 3.7:1 on felt).
- **Star Gold** (`gold-400` #ddb65a): stars, the bell, accents on felt (6.7:1 on felt).
- **Antique Gold** (`gold-700` #7a5a17): the only gold allowed as text on cream (6.0:1).
- **Gold wash** (`gold-200` #f1e1b4): warning background, `gold` badge, text selection.

### Neutral
- **Paper** (`cream-50` #fdf9f0): page ground, slips, cards. **Cream 100/200/300** step down for footers, tinted panels and the envelope.
- **Ink** (`ink-900` #1e1a14) body text; `ink-700` #4a4136 secondary; `ink-500` #6b6052 hints and meta (5.8:1 on cream-50, 5.4:1 on cream-100, the floor; nothing lighter for text).
- **Line** (`line` #e3d5b8) dividers and card borders; `line-strong` #cdb98f input and secondary-button borders.

### Named Rules
**The One Berry Rule.** A screen has at most one berry (`festive`) button visible at a time. It is the action that moves the exchange forward (Start a group, Join, Draw names, Open your card). Everything else is pine, secondary or ghost.

**The No Gray On Felt Rule.** On pine grounds, secondary text is `pine-200`/`pine-300`, never a gray or `cream/60`.

## Typography

**Display Font:** Bricolage Grotesque (variable, `opsz` axis loaded), CSS var `--font-display`, utility `font-display`.
**Body Font:** Atkinson Hyperlegible Next, CSS var `--font-body`, utility `font-sans` (default on `<body>`).
**Hand Font:** Shantell Sans, CSS var `--font-hand`, utility `font-hand`.

Use the chunky display face for headings and the body face for legibility, including for readers with low vision on phones. Reserve the marker-like hand face for names on slips.

### Hierarchy
- **Display** (800, `clamp(2.5rem,7.5vw,4.75rem)`, lh 0.95, tracking -0.035em): one per page, landing hero / big moments only. Add `[text-wrap:balance]`.
- **Headline** (800, `clamp(2rem,5vw,3rem)`, lh 1.05, tracking -0.03em): section and page titles (`h1` on app screens, `h2` on landing).
- **Title** (700, 1.25rem, lh 1.2, tracking -0.015em): card/dialog titles, step names.
- **Body** (400, 1rem/1.625; lead paragraphs 1.125 to 1.25rem): measure ≤ 65ch (`max-w-[34rem]`–`max-w-xl`).
- **Label** (700, 0.9375rem): form labels. Hints 0.875rem `ink-500`.
- **Hand** (600 to 700, 1.125 to 2.25rem): participant names, aliases, the step numerals on the landing page. Never for sentences or UI labels.

### Named Rules
**The Names Are Handwritten Rule.** Shantell Sans is used only for people's names and Christmas aliases (and decorative numerals). If you are tempted to handwrite a sentence, use the body face.

**No eyebrows.** No small uppercase kicker above headings. The one exception is the tiny `label` on the example card.

## Layout

Mobile-first. Side gutter 16px (`px-4`), 24px from `sm` (`px-6`). Containers: `max-w-xl` (forms), `max-w-3xl` (app screens), `max-w-6xl` (organizer dashboard, landing, header/footer). Section rhythm on landing: 64px mobile / 96px desktop vertical padding, more space above a heading than below it. App screens: `py-8 sm:py-12` inside `PageShell`.

Breakpoints are Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280); verify at 375 / 768 / 1024 / 1440. On phones, multi-column groups stack, buttons go full width (`w-full sm:w-auto`), dialogs become bottom sheets.

## Elevation & Depth

Use shadows to make paper look like it rests on felt. Both shadows have a pine tint, an offset and a soft blur:

- **Paper** (`--shadow-paper`: `0 1px 1px rgb(11 42 30/.08), 0 6px 16px -6px rgb(11 42 30/.22)`): slips, cards, buttons at rest.
- **Lifted** (`--shadow-lifted`: `0 2px 2px rgb(11 42 30/.1), 0 18px 36px -12px rgb(11 42 30/.38)`): dialogs, the envelope.

Solid buttons carry a 2px inset bottom bevel (`inset 0 -2px 0 rgb(0 0 0/.22)`) that flattens on press. No hard zero-blur offset shadows, no glow halos, no glass.

## Shapes

- **Slip** (6px, `--radius-slip`): paper slips, tags. Allowed to tilt ±1 to 2.5° (±4° for one-word slips).
- **Control** (12px, `rounded-xl`): buttons, inputs, alerts.
- **Card** (20px, `--radius-card`): cards and dialogs.
- **Pill** (`rounded-full`): badges, chat bubbles' outer corners, the wax seal.
Cards never nest. Borders are 1px `line`; dividers between list items are `border-t-2 border-pine-800/15`. No coloured side-stripes on cards or alerts.

## Components

All primitives live in `src/components/ui/*`, brand art in `src/components/brand/*` (barrel: `@/components/brand`). Utility `cn` from `@/lib/utils`.

### Buttons: `Button` (`ui/button.tsx`)
Buttons have a raised edge that flattens when pressed. Props (contract): `variant: "primary" | "festive" | "secondary" | "ghost" | "danger" | "light"` (default `primary`), `size: "sm" | "md" | "lg"` (44 / 48 / 56 px tall, all ≥44), `asChild` (Radix Slot: wrap a `<Link>`), `loading` (disables, `aria-busy`, shows `Spinner`), plus every native button prop. `buttonVariants()` is exported for styling non-button elements.
- `festive` = the One Berry action. `light` = cream button for felt grounds. `danger` must sit behind a `Dialog` confirmation.
- Hover: 1px lift + darker fill; active: press (bevel flips). Disabled: 55% opacity. Focus: global gold outline.
- Default `type` is the HTML default (submit inside a form). Pass `type="button"` for non-submit buttons.

### Inputs / Fields: `Field`, `Input`, `Textarea`, `Select` (`ui/field.tsx`)
- `Field({ id, label, hint?, error?, optional?, className?, children: (aria) => control })` wires `htmlFor`, `aria-describedby` (hint + error) and `aria-invalid`. Always spread the render-prop `aria` onto the control. Error text is `role="alert"`, berry-700, bold.
- Controls: white, 1px `line-strong`, 12px radius, ≥48px tall, 16px text (prevents iOS zoom). Hover: pine border; focus: pine border + global gold outline; invalid: berry border + faint berry wash; disabled: cream-100. `Select` has a drawn chevron.

### CopyField (`ui/copy-field.tsx`, client)
`CopyField({ value, label, hint?, id?, className? })`. Read-only value (invite link) + Copy button that flips to "Copied" for ~2s and announces via a polite live region; falls back to selecting the text.

### Cards: `Card`, `CardHeader` (`ui/card.tsx`)
`Card({ tone?: "paper" | "plain" | "felt", ...div })`: paper (cream, border, paper shadow, default), plain (white, border only, for dense lists), felt (pine with texture, cream text; at most one per screen). Padding 20px / 24px from `sm`. `CardHeader({ title, description?, action?, as?: "h1"|"h2"|"h3" })`.

### Alerts: `Alert` (`ui/alert.tsx`)
`Alert({ tone?: "info" | "success" | "warning" | "error", title?, children?, className? })`. Icon + title + body on a tinted wash, full 1px border, 12px radius. `error` uses `role="alert"`, others `role="status"`. Title names what happened; body says what to do.

### Badges: `Badge` (`ui/badge.tsx`)
`Badge({ tone?: "neutral" | "green" | "red" | "gold", ...span })`. Pill, 12px bold. Suggested mapping: Pending → gold, Approved/Drawn → green, Rejected/Removed → red, Example/Organizer → neutral.

### Stepper (`ui/stepper.tsx`)
`Stepper({ steps: string[], current: number /* 0-based */, className? })`. `<nav aria-label="Progress">` with an `<ol>`; current step has `aria-current="step"`. Numbered pine circles joined by thread lines (gold when done). On phones it shows "Step n of m: label" above the numbered circles (labels hidden).

### Dialog (`ui/dialog.tsx`, client, Radix)
`Dialog({ trigger?, title, description?, children?, footer?, open?, onOpenChange?, className? })` plus `DialogClose` (Radix Close; use `asChild`). Bottom sheet on phones, centred 32rem card from `sm`. Footer buttons stack reversed on phones (primary on top). Use only for destructive confirmations, the emergency reveal and short focused tasks.

### Spinner (`ui/spinner.tsx`)
`Spinner({ label?, className? })`. currentColor ring. Decorative unless `label` is given (then `role="status"` with sr-only text).

### EmptyState (`ui/empty-state.tsx`)
`EmptyState({ title, children?, action?, art?: "elf" | "gift" | "none", headingLevel?: "h2" | "h3", className? })`. Small illustration, one heading, one sentence, max one action. E.g. "No one has joined yet" + CopyField of the invite link.

### Page chrome: `PageShell`, `SiteHeader`, `SiteFooter`, `SkipLink` (`ui/page-shell.tsx`)
`PageShell({ children, width?: "narrow" | "default" | "wide", headerAction?, className? })` renders skip link, `<header>` (logo left, `headerAction` right, e.g. a Badge "Organizer" or the group name), `<main id="main">`, `<footer>`. Every app screen uses it; the landing page draws its own felt header but reuses `SkipLink`/`SiteFooter`. `SiteHeader({ action?, tone?: "light" | "felt" })`, `SiteFooter({ tone? })`.

### StatusPage (`ui/status-page.tsx`)
`StatusPage({ title, children?, actions? })`: the peeking elf over a paper slip, inside `PageShell width="narrow"`. Used by `not-found`, `error`, `expired`; reuse for "group deleted", "join closed", etc.

### Brand: `@/components/brand`
- `Logo({ tone?: "light" | "dark", href?: string | null })`, `ElfHatMark` (20px+).
- `Elf({ pose?: "wave" | "hold" | "peek", title?, className })`. wave: greetings/empty states; hold: the draw (holding a folded slip); peek: errors/not found.
- `NameHat({ names?: string[] })`: berry hat full of slips (up to 5 names; defaults are example names).
- `GiftBox({ tone?: "pine" | "berry" | "cream" })`, `Holly`, `Star`, `Sparkle`, `Snowflake`, `Thread({ orientation?: "horizontal" | "vertical" })` (currentColor; use `text-gold-500`).
- `PaperSlip({ tilt?: number, as?, ...html })`: the slip surface (`.slip` class: cream, crease, paper shadow, `rotate(var(--tilt))`). `HandName`: name in the hand face.
- `ChristmasCardReveal`: see below.
All art is decorative (`aria-hidden`) unless `title` is passed, which makes it `role="img"` with that label.

### Christmas-card reveal: `ChristmasCardReveal` (`brand/christmas-card.tsx`, client)
`ChristmasCardReveal({ recipientName, alias, label?, children?, defaultOpen?, onOpen?, className? })`. A sealed cream envelope with a berry wax seal (star). The seal is the button ("Open your card", 64px). On press: the flap lifts (500ms), the card rises out behind the pocket, comes forward and settles over the envelope (1100ms, expo ease-out), four gold sparkles twinkle once. The card reads "You're the Secret Santa for / **{recipientName}** (hand, berry) / Signed with your secret alias: **{alias}**", with `children` below (e.g. a link to their wishlist). The reveal should feel unhurried and private, like opening a card at the table. Keep the animation brief so the participant can read their card. Until opened, the card's contents are `inert` and `aria-hidden` so nothing leaks; on open, focus moves to the card text. Under reduced motion it opens instantly. Place it on a felt section; `text-gold-200` on the wrapper colours the "Psst… press the seal" hint.

## Motion

- Easing: `--ease-out-expo` (cubic-bezier(.16,1,.3,1)) for entrances/reveals; `--ease-out-quint` (cubic-bezier(.22,1,.36,1)) for hovers. No bounce or elastic.
- Durations: hovers 200 to 300ms; dialogs 320ms; the card reveal ~1.3s total. Content is visible by default; nothing important waits on an animation.
- One authored moment per screen (the reveal, the "you're in" slip, the draw confirmation). No scroll-triggered entrances on every section, no background animation, no confetti storms.
- Keyframe utilities available: `animate-unfold` (slip unfolds from its top crease, good for success messages), `animate-rise`, `animate-twinkle` (3 cycles, use `motion-safe:`), `animate-spin-slow`.
- `prefers-reduced-motion: reduce` collapses all durations globally (globals.css). Never rely on motion to convey state.

## Illustration

Original in-house SVG only (no stock, no copied characters). Rules: one even 2px line in `#0b2a1e` with `vector-effect: non-scaling-stroke` (use `lineProps` from `brand/motifs.tsx`; 1.25px for motifs under 32px), flat fills from the palette, no gradients, rounded joins. Characters are friendly and simple (dot eyes, blush, small smile). Keep illustrations small and purposeful: an elf per screen at most. Decorative stars on felt: `gold-400`, a few, irregular, static (one may twinkle).

## Voice & Copy

- Warm, plain, a little playful; the elves are the only running joke. Short sentences. Second person.
- Controls name their action: "Start a group", "Copy invite link", "Draw names now", "Open your card", "Email me a new link". Never "Submit" or "Click here".
- Errors name the problem and the recovery: "This private link has expired or isn't valid. Enter your email and we'll send a new link."
- Say "private link", never "password" or "account". Say "the elves draw names", "your secret alias", "your Santa", "your person".
- Be honest: free, no accounts, groups of 3 to 20, deleted automatically 60 days after the exchange. Never promise perfect anonymity ("small groups can still guess"). No invented stats, testimonials or "trusted by" claims.
- Use real typographic apostrophes and quotes (’ “ ”) and the ellipsis (…).

## Do's and Don'ts

### Do:
- **Do** use `PageShell` for every app route and `StatusPage` for dead ends.
- **Do** keep one `festive` button per screen; make it full width on phones.
- **Do** put names and aliases in `HandName`/`font-hand`; everything else in body/display.
- **Do** use `PaperSlip` for the one or two key messages on a screen (your recipient, your alias, a success), with a tilt of ±1 to 2°.
- **Do** keep touch targets ≥44px, labels on every input (`Field`), and the global gold focus outline visible.
- **Do** use felt sections for ceremony moments and cream for work.

### Don't:
- **Don't** use generic SaaS dashboard layouts, purple gradients, glassmorphism, carousels or background animation.
- **Don't** add a second berry CTA or a competing secondary button next to the primary one; secondary actions are `secondary`/`ghost` or text links.
- **Don't** use gray text on felt, or `gold-500` as text anywhere.
- **Don't** nest cards, add coloured left borders, or use zero-blur offset shadows.
- **Don't** handwrite sentences, or put uppercase eyebrow labels above headings.
- **Don't** show anything that links a Santa's real identity to their alias or recipient (PRODUCT.md privacy invariant), including in example art.
