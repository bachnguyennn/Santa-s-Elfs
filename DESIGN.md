---
name: SantaElf
description: Free, accountless Secret Santa for groups of 3–20, set in a lamplit miniature toy workshop.
colors:
  oxblood: "#430c15"
  oxblood-deep: "#2c0810"
  oxblood-soft: "#5c1a24"
  persimmon: "#c45a39"
  persimmon-light: "#df7950"
  persimmon-dark: "#a7462f"
  buttercream: "#fff0cc"
  teal: "#145851"
  teal-deep: "#0e403b"
  teal-wash: "#e3eddd"
  brass: "#eebc65"
  brass-deep: "#b98431"
  gold-200: "#f8e2b5"
  walnut: "#60371e"
  ink: "#301c22"
  ink-soft: "#5a3e40"
  ink-500: "#6e5355"
  cherry: "#962e40"
  cherry-wash: "#f8e1e4"
  parchment: "#f5e8cc"
  cream-50: "#fff6df"
  cream-100: "#f9ecd0"
  field-paper: "#fffdf5"
  paper-line: "#cbb690"
  line: "#e3d2ad"
  line-strong: "#8c776b"
typography:
  display:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 8vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "0em"
  headline:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0em"
  title:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.4
  hand:
    fontFamily: "Shantell Sans, Comic Sans MS, ui-rounded, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  slip: "0.375rem"
  panel: "0.5rem"
  tile: "0.75rem"
  sheet: "1.25rem"
  pill: "9999px"
spacing:
  gutter-phone: "16px"
  gutter-desktop: "32px"
  panel: "20px"
  panel-lg: "28px"
  field-gap: "6px"
  form-max: "36rem"
  page-max: "48rem"
  wide-max: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.buttercream}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.oxblood-soft}"
    textColor: "{colors.buttercream}"
  button-light:
    backgroundColor: "{colors.buttercream}"
    textColor: "{colors.oxblood}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-light-hover:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.oxblood}"
  button-secondary:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.teal}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.cream-100}"
    textColor: "{colors.teal}"
  button-ghost:
    textColor: "{colors.teal}"
    rounded: "{rounded.panel}"
    padding: "0 8px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.cherry}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.cherry-wash}"
    textColor: "{colors.cherry}"
  input:
    backgroundColor: "{colors.field-paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.slip}"
    padding: "12px 16px"
    height: "48px"
  card-paper:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  card-felt:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.buttercream}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  badge-neutral:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-green:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.teal-deep}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-red:
    backgroundColor: "{colors.cherry-wash}"
    textColor: "{colors.cherry}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  site-header:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.buttercream}"
    padding: "8px 16px"
  building-sign:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.buttercream}"
    rounded: "{rounded.slip}"
    padding: "6px 12px"
---

# Design System: SantaElf

## Overview

**Creative North Star: "Through the Door"**

SantaElf is a lamplit miniature toy workshop. Outside is a deep oxblood night where cream type sits beside supplied paintings of Santa, the elf, the teal parcel and the village street. Inside, every task happens at a cream desk under steady light: forms, rosters, letters and lists sit on opaque paper panels with a soft walnut contact shadow. You walk the village by scrolling, and you go through a persimmon door with a brass knob to do the work. One fixed light theme, lit from above and to the left.

The paintings are scenery, never interface. Every room (workshop plate, village street, threshold, writing desk, post office, gift house) is a decorative background shipped as WebP at 640, 1024 and 1672 px wide, 1672×941 intrinsic, `alt=""`, `aria-hidden`, explicit width and height, and only the first scene of a page loads eagerly. All headings, links, statuses, fields and buttons are real HTML laid over or beside the art, so the app works with the art missing, slow, or zoomed. The concept image's mock text is never shipped as a flattened hero.

Motion is choreography for a few signature moments (the doorway, the scroll route, the parcel tug, the envelope, the invite copy, the postmark), each with exact timings, a skip or a static fallback, and no product state that depends on an animation finishing. Working rooms are quiet.

**Key Characteristics:**
- Oxblood exterior, cream paper interior, petrol-teal ink, brass light and focus, persimmon only on the door.
- Painted rooms as backgrounds; all text and controls in HTML.
- Barlow Condensed signs and titles, Atkinson Hyperlegible Next for everything you read or operate, Shantell Sans handwriting only where a person's name is written.
- Pill buttons with a pressed-flat contact edge; paper panels with a tonal ledge and walnut shadow.
- Signature motion on deliberate actions only; reduced motion and direct links always land at the result.

## Colors

A warm, low-key palette of wine, cream and petrol teal, with brass as the only light source and persimmon kept for the door.

### Primary
- **Oxblood** (`oxblood`): the exterior backdrop (home, header bar, scene-banner scrims, the doorway overlay), headings on cream, and the fill of the main action inside rooms. Deep (`oxblood-deep`) is the footer and the pressed edge under buttons; Soft (`oxblood-soft`) is the button hover.
- **Buttercream** (`buttercream`): type on oxblood and teal, the primary action outside (Start a group), and invitation paper.

### Secondary
- **Petrol Teal** (`teal`): the parcel, the mail cabinet, links and ghost actions on cream, the focus ring on light grounds, completed stepper steps, building signs, and the one felt panel a screen may carry. Deep (`teal-deep`) is success text and the mail-slot cubbies; Wash (`teal-wash`) is the info and success alert fill.
- **Brass** (`brass`): lamplight. The focus ring on dark grounds, the current-page underline in participant navigation, the knob, the mailbox flag, sparkles. `gold-200` is the warning fill and the text selection colour. `brass-deep` is the darker metal.

### Tertiary
- **Persimmon** (`persimmon`, light `persimmon-light`, dark `persimmon-dark`): the painted door panel and its gradient; `persimmon-dark` also numbers the "how it works" steps on the home page. It is a material, not a UI accent.
- **Cherry** (`cherry`): errors, destructive outlines, and the wax seal on the envelope. `cherry-wash` is the error fill. Status always pairs cherry with text and an icon.

### Neutral
- **Letter Ink** (`ink`): primary text on paper. `ink-soft` for secondary prose, `ink-500` for hints, placeholders and to-do steps.
- **Parchment** (`parchment`): the page background behind panels.
- **Cream Paper** (`cream-50`): every reading panel, card, secondary and danger button. `cream-100` for hover fills and the participant nav strip. `field-paper` is the near-white inside of inputs.
- **Paper Line** (`paper-line`): panel borders and stepper connectors. `line` is a soft divider; `line-strong` the input border.
- **Walnut** (`walnut`): painted shelves and edges, envelope linework, the ledge under building signs.

Legacy token names are kept as aliases so older markup paints into the same world: `pine-*` is teal, `cream-*` is paper, `berry-*` is cherry, `gold-*` is brass, `ink-900/700/500` is letter ink; the village names `sky`, `snow`, `paper`, `evergreen`, `golden`, `timber`, `midnight` map to parchment, paper, teal, brass, walnut and ink. Watch two: `cranberry` is oxblood, but `cranberry-deep` is cherry. New markup uses the workshop names.

Measured contrast (WCAG 2.1): buttercream on oxblood 14.3:1; ink on paper 14.8:1; ink-soft on paper 8.9:1; ink-500 on paper 6.4:1 and on parchment 5.7:1; teal on paper 7.7:1; cherry on paper 7.1:1; paper on teal 7.7:1; brass on oxblood 9.2:1.

### Named Rules
**The Lamplight Rule.** Brass is light, never text on paper. It appears as focus on dark grounds, small glints and the current-page underline. Persimmon is never text on paper either.

**The Door Is Persimmon Rule.** Persimmon belongs to the door and its echoes. Calls to action are oxblood (inside) or buttercream (outside), never persimmon.

**The One Wine Action Rule.** Each area has one main action in the wine pill (the `festive` variant, painted the same as `primary`: Draw names, Send letter, Create group). Everything else is a cream secondary pill or a teal text action.

## Typography

**Display Font:** Barlow Condensed 700 (600 loaded), with ui-sans-serif fallback
**Body Font:** Atkinson Hyperlegible Next 400/700, with ui-sans-serif fallback
**Hand Font:** Shantell Sans 600, with Comic Sans MS / ui-rounded fallback

**Character:** A narrow, upright workshop-sign face for short titles against a typeface built for low-vision legibility, so the warmth lives in the headings and nothing the user has to read or operate is decorative. Shantell's handwriting appears only where a name is written by hand.

### Hierarchy
- **Display** (700, `clamp(3.5rem, 8vw, 5.5rem)`, line-height 0.92, balanced): the home headline "Secret Santa starts here." On phones `clamp(2.75rem, 11vw, 3.5rem)`.
- **Headline** (700, `clamp(2.25rem, 5vw, 3.25rem)` up to `clamp(2.5rem, 6vw, 4.5rem)` for room titles, line-height 0.95): section and room titles, scene-banner headings, status-page headings (`clamp(2.25rem, 7vw, 3rem)`).
- **Title** (700, 1.6–1.9rem, line-height 1.25): card headers, oxblood on cream.
- **Body** (400, 16–18px, line-height 1.5, `text-wrap: pretty`): all prose, inside panels capped near 40–65ch.
- **Label** (700, 15px): field labels, nav links, button text (buttons 14/16/18px by size).
- **Hand** (600, ~18px+): the invitation's group name, the revealed recipient name in the envelope, the giver's alias in the mailroom, the join welcome.

### Named Rules
**The Hand Is For Names Rule.** Shantell Sans sets a person's or group's name on paper and nothing else: never a heading, button or paragraph.

**The Short Sign Rule.** Barlow Condensed sets short titles and signage only. Body copy, labels, fields and buttons are Atkinson.

## Layout

Mobile first, checked at 375, 768, 1024 and 1440 px. Gutters are 16px on phones and 32px from 640px up. Page widths: forms 36rem, app screens 48rem, organizer dashboard and chrome 72rem. Panels pad 20px, 28px from 640px. Fields stack label, hint, control and error with 6px gaps; forms cap at 560px.

Rooms compose in one of three ways:
- **Full scene** (home, village route, doorway): the painting and its HTML layers share one aspect-ratio box (1672/941) so overlaid hotspots, the elf (feet at 84% across, 61% down, pivot at the boots) and the door panel (left 36%, top 27.8%, 28% × 63%, knob at 90%) stay registered. On phones copy comes first, then a separately cropped painting.
- **Scene banner** (working rooms, create, status pages): a shallow `object-cover` crop of a room (`clamp(9rem, 24vw, 17rem)` tall) with an oxblood bottom scrim carrying the page heading in buttercream, and content below on opaque paper. Status pages lift their single cream panel over the banner's lower edge.
- **Painted street plus list** (village, participant home): buildings are absolutely placed link hotspots on the painting from 640px up; below that, and always as an alternative, an ordinary labelled list of destinations.

The home scroll route is a sticky stage inside a tall track (125vh phone, 175vh from 640px); under reduced motion the track collapses to normal height and the stage is static.

## Elevation & Depth

Depth is lamplight on paper: a hybrid of tonal grounds (oxblood outside, parchment under cream panels) and a small set of warm shadows that read as paper thickness on wood. Every shadow is a short zero-blur tonal ledge directly below (no sideways offset, never black) plus a soft, diffuse walnut or ink shadow. The painted rooms carry the real depth; the UI stays shallow.

### Shadow Vocabulary
- **Paper** (`box-shadow: 0 3px 0 #d6c4a5, 0 10px 22px -14px rgb(96 55 30 / 0.45)`): every resting reading panel, card, slip and the village paper.
- **Lifted** (`box-shadow: 0 4px 0 #d6c4a5, 0 22px 40px -18px rgb(48 28 34 / 0.55)`): the single panel on a status page and dialogs.
- **Wine button** (`box-shadow: 0 2px 0 var(--color-oxblood-deep), 0 8px 16px -10px rgb(48 28 34 / 0.6)`): primary and festive buttons; flattens to none when pressed.
- **Cream button** (`box-shadow: 0 2px 0 #d9c49b, 0 10px 20px -12px rgb(0 0 0 / 0.6)`): the light button on oxblood.
- **Sign** (`box-shadow: 0 3px 0 var(--color-walnut)`): teal building signs on the painted street.
- **Cubby** (`box-shadow: inset 0 6px 10px rgb(0 0 0 / 0.35)`): the recessed teal mail slots.

### Named Rules
**The Paper On Wood Rule.** Panels are opaque cream with a paper-line border and the Paper shadow. Never glass, blur or translucent panels over art; text never sits directly on a painting without the oxblood scrim.

## Shapes

Soft but crafted. Buttons, badges and stepper tokens are full pills. Reading panels and cards round gently (`panel`, 0.5rem); slips, fields and signs a little less (`slip`, 0.375rem); selectable tiles, checkbox rows and mail cubbies a little more (`tile`, 0.75rem). Dialogs are bottom sheets on phones and centred panels from 640px, rounded `sheet` (1.25rem). Paper objects (invitation, door panel) keep near-square corners (2–4px) because they are cut sheets and boards. The invitation is tilted −1° and carries a thin cherry/buttercream/teal airmail stripe along its top edge. Lucide icons only, at 1.1em inside buttons, always beside a text label.

## Components

### Buttons
Tactile pills that press flat.
- **Shape:** full pill; heights 44px (sm), 48px (md, default), 56px (lg); padding 16/24/32px.
- **Primary / Festive:** oxblood fill, buttercream bold label, Wine button shadow. Festive is the same paint, used for the one main action of an area.
- **Light:** buttercream on oxblood for actions outside (Start a group, the draw result link on teal).
- **Secondary:** cream-50 fill, 2px paper-line border, teal label; hover turns the border teal.
- **Ghost:** teal underlined text (2px decoration, 4px offset), min-height 44px, for secondary actions.
- **Danger:** cream with a 2px cherry outline and cherry label; always confirmed in an AlertDialog and kept apart from other actions.
- **States:** hover lifts 1px over 200ms on `--ease-workshop`; active drops back in 75ms and removes the shadow; disabled at 55% opacity; `loading` shows a spinner before the label and sets `aria-busy`.

### Chips (Badges)
- **Style:** pill, 1px border, 12px bold text, tones neutral (cream/ink), green (teal-wash/teal-deep), red (cherry-wash/cherry), gold (gold-200/ink). Text is always ≥4.5:1 on its fill.

### Cards / Containers
- **Corner Style:** 0.5rem.
- **Background:** cream-50 with a paper-line border; `plain` drops the shadow for dense lists; `felt` is a teal panel with buttercream text, at most one per screen.
- **Shadow Strategy:** Paper (see Elevation).
- **Internal Padding:** 20px, 28px from 640px.
- Cards never nest; use dividers inside.

### Inputs / Fields
- **Style:** near-white field paper, 1px line-strong border, 0.375rem radius, 12×16px padding, min-height 48px; textareas 112px+. Selects carry an inline ink chevron.
- **Focus:** border turns teal plus the global 3px teal outline at 2px offset.
- **Error / Disabled:** `aria-invalid` turns the border cherry over a cherry-wash tint, with a bold cherry message (`role="alert"`) linked by `aria-describedby`; disabled fields go cream-100 with ink-500 text.
- **CopyField:** a read-only monospace value with an inline wine Copy button. "Copied" and a teal-wash fill appear the moment the clipboard resolves; then a miniature cream envelope folds (220ms), slides into the tray (200ms) and the brass mailbox flag lifts (120ms), held, then lowers. If the clipboard fails, the value is focused and selected with plain manual-copy instructions.

- **Checkboxes:** native inputs with `accent-teal` (approved in place of Radix Checkbox): the label is bound with `for`, so the whole label toggles; the description is linked by `aria-describedby`; keyboard focus shows the global 3px teal outline.

### Transactional Email
One shared layout (`src/server/email/templates/layout.tsx`), inline styles only and no images, so it reads the same with images off: parchment page, buttercream `#FFF0CC` paper with a paper-line border, an oxblood bar with a persimmon rule and the SantaElf wordmark in text, oxblood Barlow Condensed headings, ink `#301C22` body text, an oxblood pill button with buttercream text, a pasteable fallback link under every button, and the cherry "please don't forward" warning on emails that carry a private link. Plain-text versions are generated from the same markup. Assignment notifications never contain a name.

### Navigation
- **Site header:** oxblood bar, buttercream logo, "Recover link" as an underlined buttercream link with a brass underline. Skip link to `#main` on every page (oxblood with brass border when focused).
- **Participant header:** oxblood "Private page" bar, then a cream-100 strip of role-scoped place links: teal underlined links, the current page oxblood with a 3px brass bar underneath.
- **Footer:** oxblood-deep, buttercream text, Home and Recover link.
- **Stepper:** numbered 32px pill tokens joined by lines; current is oxblood, done is teal with a check, to-do is cream with ink-500. On phones it reads "Step n of m: label".
- **Back:** a doorstep memory writes the scroll position into history before same-origin navigation and restores it on Back, so returning from a room lands on the same building.

### Focus
Global: 3px teal outline, 2px offset. On dark grounds (`.on-dark`, oxblood, teal) the ring turns brass. On artwork hotspots (`.focus-art`) it is two-colour: 3px brass outline at 3px offset with a 6px oxblood halo, so it reads on any painted pixel. Programmatic focus targets (`tabindex="-1"` headings) show no ring.

### Dialogs
Radix Dialog for small tasks (title, description, close, focus return). Destructive confirmations use Radix AlertDialog with Title, Description, Cancel and Action; initial focus goes to Cancel, and cancelling returns focus to the opener.

### Workshop Doorway (signature)
The persimmon door is composed over the threshold painting in paint order: room behind the opening, warm light spill, door panel with raised panels and a brass knob. Every Workshop entrance is a real link to `/new` that also marks the arrival as deliberate (single-use, 15s freshness, preloads the threshold painting). Only that arrival plays the doorway over the desk:
- 0–300ms the brass latch turns 12° and the light spill fades in (`--ease-workshop`).
- 300–1000ms the door swings 95° inward from the left jamb (`--ease-camera`) while the camera scales forward 8% on desktop or 3% at ≤640px.
- The overlay holds until 910ms, then fades by 1300ms; at 1000ms it stops taking pointer events and hands over to the desk.
- The cream invitation slides 16px up onto the desk and settles (500ms), and the group-name field takes focus.
- **Skip to form** is focused at the start and ends the sequence at once. Playback waits for the painting to decode, but never more than 350ms.
- Direct visits, reloads, Back and reduced motion open straight at the desk. Nothing in the sequence creates a group.

### Invitation (signature)
A tilted cream card mirrors the group name in Shantell Sans as it is typed. Later step changes move it 8px and settle in 160ms. It is `aria-hidden`; the form is the source of truth.

### Village Route (signature)
On the home page a sticky stage maps scroll progress through the track to 0–100%. 0–40% the teal parcel rides the painted ribbon; 45–55% a bell swings ±12°; 65–90% the elf catches the parcel; at 100% the Post Office sign is lit. An IntersectionObserver activates the scene and requestAnimationFrame renders only while it is on screen. Upward scroll reverses it; there is no scroll lock. Under reduced motion it is a static scene. Each building is a semantic link with a real teal HTML sign (Barlow Condensed, uppercase, 0.06em, walnut ledge) and a purpose line, plus a conventional link list.

### Hero Parcel (signature)
A short gold ribbon (SVG, brass gradient matched to the painted band, one narrow highlight) runs from the parcel's band into the elf's fists and sits under the elf, so the tug has a visible cause; the bow stays painted. Tapping the parcel tugs the elf: the ribbon pulls taut, losing its sag and narrowing (180ms), the bow snaps with a brass sparkle (160ms), the elf tips back 5° and settles (280ms), pivoting at its boots. It is an optional, replayable button with a screen-reader label; the page's actions never depend on it. Off under reduced motion.

### Envelope (signature)
Rear sheet, hinged flap, letter, front pocket and a cherry wax-seal button, in that paint order. "Open my envelope" requests the assignment and swings the flap fully back over 220ms. The full 180° opening is an approved decision (SPEC's 105° was a proposed motion detail, not a product requirement): the opened flap settles behind the letter (flap z 5, letter z 20), so the name reads clearly; once the server answers, the letter slides up 32px over 360ms and focus moves to the result heading. Skip finishes both animations. A slow request shows a loading state after 620ms; an error re-seals the flap, shows the message and returns focus to the seal. The recipient's name is not in the DOM before the authorized answer. Replay re-runs the motion over the letter already on screen and never fetches or draws again.

### Post Office Entrance (signature)
Tapping a Post Office link (the painted building or the phone sign card, marked `data-enter="post-office"`) is an ordinary link: navigation starts at once. A root-layout `RoomEntrance` lays a copy of the street painting exactly over the original, holds it while the room loads, then, once the room's painting has held still for three frames, carries the door's brass letter slot onto the first fully visible brass name plate of the interior mail cabinet over 260ms (`--ease-workshop`), widening its clip to the viewport and dissolving into the room from 45%. From a phone card, the slot starts 72px wide, centred in the card. It is `aria-hidden`, never takes focus or pointer events, gives up after 2.5s or on Back, and does nothing under reduced motion or a modified click: the room simply appears.

### Mailroom (signature)
Exactly two mail slots as Radix Tabs, recessed teal-deep cubbies in a cabinet, mirrored into `?thread=` with `replace`. Each thread keeps its own desk: draft, sending state, error and confirmation, so switching mid-send loses nothing. On a server-confirmed send, a cherry postmark lands on the letter: falls 150ms, compresses 5% for 50ms, settles in 60ms (`stamp-in`, 260ms). A failed send keeps the text and shows an inline cherry error in that thread.

### Rooms
Organizer pages share the writing-desk painting on purpose: a consistent desk for organizing. The village's distinct destinations are the Post Office and Gift House, each under its own painting; dead ends use calm Post Office crops.

### Deferred
The frosted window (SPEC, optional) is deferred.

### Motion Grammar
Default ease `--ease-workshop` `cubic-bezier(0.22, 1, 0.36, 1)`; doorway camera `--ease-camera` `cubic-bezier(0.45, 0, 0.15, 1)`. Transforms and opacity only. Interruptible sequences use the Web Animations API. When a WAAPI animation uses keyframe offsets to hit exact segment times, the animation runs on `linear` timing and each keyframe carries its own easing, so the offsets are real milliseconds. The global reduced-motion rule collapses every animation and transition to 0.01ms; components also skip their sequences and show the end state.

## Do's and Don'ts

### Do:
- **Do** keep every heading, link, field, status and button in HTML; paintings are `alt=""` decoration with explicit dimensions.
- **Do** put text over a painting only on the oxblood scrim (`rgb(44 8 16 / 0.6–0.92)`) or on opaque cream paper.
- **Do** give every control a 44px minimum target; buttons default to 48px.
- **Do** keep one wine action per area and make the rest cream secondary pills or teal text actions.
- **Do** use the two-colour brass-on-oxblood focus ring on any hotspot laid over artwork.
- **Do** confirm only after the server succeeds: the postmark, Saved, and the revealed name follow the response, never an animation callback.
- **Do** give every signature motion a skip or a static fallback, and open direct links, reloads, Back and reduced motion at the result.
- **Do** run segmented WAAPI keyframes on `linear` timing with per-keyframe easing.
- **Do** use the workshop token names (`oxblood`, `teal`, `cream-50`, `cherry`) in new markup.

### Don't:
- **Don't** ship a painting with baked-in text or controls, or a flattened concept image as the hero.
- **Don't** set brass or persimmon as text on paper.
- **Don't** use persimmon for buttons or links; it is the door.
- **Don't** set Shantell Sans on anything but a written name.
- **Don't** use translucent, blurred or glass panels over art.
- **Don't** use black or sideways hard-offset shadows; depth is a tonal ledge directly below plus a soft walnut shadow.
- **Don't** put a recipient's name in markup, labels, props or art before the authorized reveal, and never animate real name pairings.
- **Don't** let an animation create, submit or redraw anything.
- **Don't** add new values from the retired village palette (`#172d38`, `#b52f46`, `#ffd166`, `#2e7a5c`).
