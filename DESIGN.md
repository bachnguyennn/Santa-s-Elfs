---
name: SantaElf
description: Free, accountless Secret Santa for groups of 3–20, set in a bright illustrated Christmas village.
colors:
  cranberry: "#b52f46"
  cranberry-deep: "#8f2236"
  cranberry-wash: "#fbe7ea"
  evergreen: "#175541"
  evergreen-deep: "#0f3d2e"
  evergreen-soft: "#2e7a5c"
  evergreen-wash: "#e1f1e8"
  golden: "#ffd166"
  golden-deep: "#e9a93a"
  golden-wash: "#ffefc2"
  golden-text: "#7a5a17"
  window-lit: "#ffe39e"
  sky: "#bdebfa"
  snow: "#f7fcff"
  snow-shadow: "#a8cddf"
  paper: "#fff7e8"
  paper-deep: "#f4e6c8"
  timber: "#8a5a3c"
  midnight: "#172d38"
  midnight-soft: "#3e5866"
  ink-muted: "#546d7a"
  line: "#d5e5ee"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 8vw, 4.75rem)"
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
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  sign:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body-lead:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
  name:
    fontFamily: "Shantell Sans, Comic Sans MS, ui-rounded, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.05
rounded:
  slip: "6px"
  sm: "8px"
  control: "12px"
  paper: "16px"
  card: "20px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
  section-lg: "96px"
components:
  button-festive:
    backgroundColor: "{colors.cranberry}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-festive-hover:
    backgroundColor: "{colors.cranberry-deep}"
    textColor: "{colors.paper}"
  button-primary:
    backgroundColor: "{colors.evergreen}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.evergreen-deep}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.evergreen}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.snow}"
    textColor: "{colors.evergreen}"
  button-light-hover:
    backgroundColor: "{colors.golden}"
    textColor: "{colors.evergreen}"
  button-ghost:
    textColor: "{colors.evergreen}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cranberry-deep}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.cranberry-wash}"
    textColor: "{colors.cranberry-deep}"
  card-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.card}"
    padding: "24px"
  card-evergreen:
    backgroundColor: "{colors.evergreen}"
    textColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "24px"
  village-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.paper}"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.midnight}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  building-sign:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
    typography: "{typography.sign}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  badge-neutral:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-green:
    backgroundColor: "{colors.evergreen-wash}"
    textColor: "{colors.evergreen-deep}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-red:
    backgroundColor: "{colors.cranberry-wash}"
    textColor: "{colors.cranberry-deep}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-gold:
    backgroundColor: "{colors.golden}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  envelope-seal-label:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: SantaElf

## Overview

**Creative North Star: "The Village on a Bright Snow Day"**

SantaElf is a small illustrated Christmas village seen on a clear winter morning. Scrolling walks you down the street; a building is a door you tap to go inside and do one thing. The Workshop is where organizers set up and run the draw, the Post Office is where Santas and recipients write under aliases, the Gift House holds a participant's wishlist, and a personal envelope holds their assignment. Every screen is a place in that village, not a dashboard with a theme on top.

The world has one time of day and one light. Sky over fresh snow, light from the upper left, every object outlined in midnight ink and casting a short blue shadow down and to the right. Fills are flat and saturated; there are no gradients, no textures, no glows. Reading happens on warm paper sheets laid over the scenery, so text is always real HTML on a calm, high-contrast ground. The illustrations are original chunky SVG with crooked chimneys and soft snowbanks: friendly, a little handmade, never photographic or glossy.

Density is low and generous. Most people visit once a year, on a phone, and need to do one thing; each area offers that one thing in cranberry, and everything else steps back to evergreen or text links. Motion is short and physical: a door swings, a sign lifts, a flap opens, an elf nods once. Snow is the only ambient motion, and it is sparse.

**Key Characteristics:**
- One fixed bright winter daytime theme; no dark mode, no night scene.
- Light from the upper left; a short blue shadow down-right on everything that stands up.
- Even midnight outlines (2.5px structural, 2px for smaller pieces) and flat fills.
- One cranberry action per area; evergreen for everything secondary.
- Buildings are single links: sign and artwork together, one keyboard stop.
- Handwriting (Shantell Sans) only for people's names and Christmas aliases.
- Scenery is decoration only and never encodes who gives to whom.

## Colors

A clear-sky palette: pale sky and snow grounds, midnight ink, and three saturated Christmas colors used with strict roles.

### Primary
- **Cranberry** (#b52f46): the one main action of an area (Start a group, Draw names now, Send letter), the wax seal on the envelope, and names on letters. Paper text on it measures 6.3:1. **Cranberry Deep** (#8f2236) is its hover/pressed state and the color of error text and destructive outlines. **Cranberry Wash** (#fbe7ea) is the error and destructive-hover ground.

### Secondary
- **Evergreen** (#175541): the purpose link on building signs, ordinary actions (Save profile, Approve), the footer ground, completed steps, aliases on letters. Paper text on it measures 8.9:1. **Evergreen Deep** (#0f3d2e) is its hover state and the text color on Evergreen Wash (#e1f1e8), the success ground. **Evergreen Soft** (#2e7a5c) is the lit side of trees in the art and an on-paper link color (4.9:1).

### Tertiary
- **Golden** (#ffd166): lit windows, brass, stars, the current step marker, the focus ring on evergreen grounds. Never text on a light ground. **Window Lit** (#ffe39e) is the brighter window fill a building takes on hover and focus. **Golden Deep** (#e9a93a) is shading inside art only. **Golden Wash** (#ffefc2) is the warning ground and text selection. **Golden Text** (#7a5a17) is the only golden that may be text on paper (6.0:1), used for "Unsaved changes" and warning icons.

### Neutral
- **Sky** (#bdebfa): the outdoor ground at the top of every village page, the app header, info alerts (at 60%). Also the browser theme color.
- **Snow** (#f7fcff): the page body ground and snowbanks.
- **Snow Shadow** (#a8cddf): the one shadow color of the world: cast shadows in art, the offset under paper and cards, input hover, step connectors, dashed dividers inside paper.
- **Paper** (#fff7e8): every reading and working surface, and the text color on cranberry and evergreen. **Paper Deep** (#f4e6c8) is the shaded side of paper in art and the close-button hover.
- **Timber** (#8a5a3c): trunks, doors, and the Post Office mail-slot cabinet.
- **Midnight** (#172d38): all body text, every outline, the focus ring on light grounds. 13.6:1 on paper, 10.9:1 on sky.
- **Midnight Soft** (#3e5866): secondary text and lead paragraphs (7.1:1 on paper).
- **Ink Muted** (#546d7a): hints, placeholders, "(optional)", inactive step labels (5.2:1 on paper).
- **Line** (#d5e5ee): hairlines inside dense lists.

The older token names in the stylesheet (pine, cream, berry, gold, ink) survive only as aliases repainted to these values so legacy screens share the village; new work uses the village names.

### Named Rules
**The One Cranberry Rule.** Each area (a section of the square, the inside of one building, a dialog) shows at most one cranberry action. If two things feel primary, one of them is evergreen.

**The Golden Is Light Rule.** Golden is light falling on things: windows, brass, stars, the current step. It is never text on a light ground; when golden meaning must be read, use Golden Text.

**The Measured Pair Rule.** Every text/ground pair in use has its WCAG ratio recorded beside the token in the stylesheet. A new pair is measured and noted there before it ships, and must reach 4.5:1 (3:1 for large display text and focus rings).

## Typography

**Display Font:** Bricolage Grotesque (with ui-sans-serif, system-ui), optical-size axis on
**Body Font:** Atkinson Hyperlegible Next (with ui-sans-serif, system-ui)
**Name Font:** Shantell Sans (with Comic Sans MS, ui-rounded)

**Character:** A warm, chunky grotesque for signs and headings, like painted lettering on a village sign, paired with a body face built for low-vision legibility, because most readers are once-a-year visitors on phones. A friendly hand appears only where a person is named.

### Hierarchy
- **Display** (800, clamp 2.6–4.75rem, line-height 0.95, -0.035em): the Village Square headline only; balanced wrapping.
- **Headline** (800, clamp 2–3rem, 1.05, -0.03em): section titles on the square and the title inside each building (Workshop, welcome desk, recover, the envelope page).
- **Title** (700, 1.25rem, -0.015em): card and dialog headings.
- **Sign** (800, 1.125rem, -0.01em): the building's name on its sign. The purpose beside it is body at 0.9375rem bold, evergreen, underlined.
- **Body Lead** (400, 1.125rem, 1.625): the paragraph under a headline, in Midnight Soft, capped at 65ch.
- **Body** (400, 1rem, 1.5): everything else. Paragraphs and list items wrap "pretty" to avoid orphans.
- **Label** (700, 0.875rem): field labels (0.9375rem), badges (0.75rem), the seal's "Open my envelope" tag, status lines. Sentence case, no tracking.
- **Name** (Shantell 700, 1.75rem on letters, clamp 1.9–2.6rem for the recipient on the envelope, 1.125–1.25rem inline): a participant's own name, the recipient's name, and Christmas aliases.

### Named Rules
**The Names Are Handwritten Rule.** Shantell Sans marks a person: a participant's name, their recipient, a Santa's alias. It is never used for numbers, headings, buttons or decoration.

**The No Eyebrow Rule.** Headings stand on their own. There are no small uppercase labels or kickers above titles; if context is needed, it goes in the sentence under the heading.

## Layout

Mobile-first, one column on phones, with the village art stacked under the text it illustrates. Content sits in a 72rem container with a 16px side gutter, 24px from 640px. App forms use narrower measures: 36rem for single forms, 48rem for ordinary app screens, 72rem for the organizer's Workshop.

The Village Square is a street you walk down: each section is a sky-or-snow band with a scene and a short text column. From 1024px a section becomes a two-column grid in an uneven split (6fr/5fr, alternating sides) with a 56px gap, and art may tuck up into the band above so buildings peek over the horizon. The first viewport shows sky, the headline at left with Start a group and Recover my link beneath it, and the square to the right; on phones text comes first and Santa with the sleigh still reaches the first screen.

Vertical rhythm: 40px top and 64px bottom per section on phones, 96px bottom from 1024px; 24px between a lead paragraph and the paper or control below it; 12–16px inside lists. Cards pad 20px, 24px from 640px. Sticky action bars (the Gift House save) sit at the bottom of the viewport on phones with safe-area padding, and become a floating paper bar from 640px.

Verified at 375, 768, 1024 and 1440px. Every interactive target is at least 44px tall; primary controls are 48px, large ones 56px.

**The Doorstep Rule.** Going inside a building and pressing Back returns the visitor to the same doorstep, scrolled where they were, with the door closed. Navigation inside a building (switching mail slots) does not add history entries.

## Elevation & Depth

Depth comes from the world's single light source, not from material layers. Everything that stands up (a building, a tree, a paper sheet, a card) casts a short flat shadow down and to the right in Snow Shadow, with no blur. Dialogs, the only thing that floats, add one soft midnight ambient blur under that flat shadow. Controls are the one place the offset turns midnight: buttons sit on a crisp ink shadow like a pressable key, and the shadow collapses when pressed.

### Shadow Vocabulary
- **Paper** (`box-shadow: 5px 6px 0 -1px rgb(168 205 223 / 0.9)`): cards, paper slips, the sticky save bar.
- **Village Paper** (`box-shadow: 6px 8px 0 -2px rgb(168 205 223 / 0.9)`): large reading sheets on the square and inside buildings (the Workshop steps, the Post Office counter).
- **Lifted** (`box-shadow: 6px 8px 0 -1px rgb(168 205 223 / 0.95), 0 18px 36px -16px rgb(23 45 56 / 0.35)`): dialogs.
- **Key** (`box-shadow: 3px 4px 0 rgb(23 45 56 / 0.9)`, pressed `1px 1px 0`): every solid button. The danger button tints it cranberry-deep.
- **Sign Lift** (`box-shadow: 0 6px 0 -2px rgb(23 45 56 / 0.18)`): a building sign while hovered or focused.
- **Cast shadow in art**: a flat Snow Shadow ellipse on the snow, offset to the lower right of each object.

### Named Rules
**The Upper-Left Sun Rule.** Light always comes from the upper left. Shadows fall down-right, the lit sides of trees and roofs are on the left, and nothing casts a shadow in any other direction or in any color but Snow Shadow (controls excepted, in midnight).

## Shapes

Soft-cornered, chunky and outlined. Every surface carries an even midnight outline: 2.5px on structural pieces (buttons, cards, dialogs, headers and footers, the mail-slot cabinet, and every illustration stroke, non-scaling), 2px on smaller pieces (building signs, inputs, badges, alerts, paper slips, speech bubbles). Corners are friendly but not pill-soft: 12px on controls and signs, 16px on reading paper, 20px on cards and dialogs (dialogs are top-rounded sheets on phones), 6px on small slips, full pills for badges, the seal tag and round icon buttons. Speech bubbles pinch one corner (6px) toward the speaker. Illustrations use flat fills, round joins, slightly crooked chimneys and rounded snowbanks; no gradients, no textures.

## Components

### Buttons
Chunky and pressable: outlined, filled, standing on a small ink shadow.
- **Shape:** 12px corners, 2.5px midnight outline, bold body face, at least 44px tall (sm 44px, md 48px, lg 56px), icons at 1.1em.
- **Festive (cranberry):** the one main action of an area. Paper text.
- **Primary (evergreen):** ordinary and secondary steps (Save profile, Approve, Recover my link on the square).
- **Secondary:** paper fill, evergreen text; hovers to snow.
- **Light:** paper on evergreen grounds; hovers to golden.
- **Ghost:** no outline or fill, evergreen text with a 2px underline; a paper wash on hover.
- **Danger:** cranberry-deep outline and text on paper with a cranberry-tinted key shadow; always confirmed in a dialog and kept apart from other actions.
- **Hover / Press:** lifts 2px and deepens its fill over 200ms (ease-out-quint); pressing drops it back and flattens the shadow in 75ms. Loading shows a spinner before the label and sets aria-busy. Disabled fades to 55%.
- **Focus:** a 3px midnight outline offset 2px; golden on evergreen grounds.

### Chips (Badges)
- **Style:** pill, 2px outline, 0.75rem bold label. Neutral (paper/midnight), green (evergreen wash/evergreen deep), red (cranberry wash/cranberry deep), gold (golden/midnight).
- **State:** status only (Pending, Approved, Drawn, Example); never interactive.

### Cards / Containers
- **Corner Style:** 20px (card), 16px (village paper).
- **Background:** paper; at most one evergreen card per screen, for a highlight block. Cards never nest.
- **Shadow Strategy:** Paper or Village Paper shadow (see Elevation & Depth); a plain card drops the shadow for dense lists.
- **Border:** 2.5px midnight (cards), 2px (village paper).
- **Internal Padding:** 20px, 24px from 640px.

### Inputs / Fields
- **Style:** white fill, 2px midnight outline, 12px corners, 48px tall, 16px text. Label above in bold, hint under the label in Ink Muted, error under the control.
- **Focus:** the global midnight ring plus a 3px Snow Shadow offset; the same offset appears on hover.
- **Error / Disabled:** error switches the outline to Cranberry Deep on a faint Cranberry Wash and shows the message in bold Cranberry Deep, announced. Disabled fills warm paper with muted text.

### Alerts
Inline messages with a 2px outline, 12px corners and a leading icon: info on sky, success on Evergreen Wash, warning on Golden Wash, error on Cranberry Wash (announced immediately). The title names what happened; the body says what to do next.

### Navigation
- **Header:** sky ground, 2.5px bottom outline, the elf-hat mark with "Santa" in midnight and "Elf" in cranberry (Bricolage 800, 1.375rem). Village pages place the Pause snow toggle and the visitor's context at right.
- **Footer:** one footer everywhere: evergreen ground, paper text, underlined bold links (Village Square, Recover my link).
- **Stepper:** numbered round tokens joined by a path; current step golden, done steps evergreen with a check, upcoming steps outlined in Snow Shadow. Collapses to "Step n of m" on phones.
- **Skip link:** midnight with a golden outline, appears on focus.

### Dialog
A paper sheet with a 2.5px outline and the Lifted shadow over a 55% midnight scrim. A bottom sheet on phones, centered at 32rem from 640px; enters by rising 16px over 320ms (ease-out-expo). Used only for confirmations that protect something (delete, remove, emergency reveal) or a short focused task.

### Building Link (signature)
A building you can enter is one link: the paper sign above (name in Sign type, a dot, then the purpose underlined in evergreen) and the decorative artwork below, one keyboard stop. On hover and focus the windows brighten to Window Lit and the sign lifts 2px with the Sign Lift shadow (200ms). On activation the door swings open on its left hinge (about 200ms) alongside the route change. Focus draws a 3px midnight ring with 16px rounded corners around the whole building.

### Envelope (signature)
The participant's assignment arrives as a sealed paper envelope. The cranberry wax seal with a golden star is the button, tagged "Open my envelope" in a midnight pill. Pressing it lifts the flap (220ms) and, once the server's authorized answer arrives, slides the letter up out of the pocket (360ms, ease-out-expo). The letter is not in the DOM until that answer exists. "Skip animation" takes focus during the motion; focus then moves to the result heading and a polite status announces it. The recipient's name is in cranberry handwriting, the Santa's alias in evergreen handwriting. "Open it again" replays from the same data without refetching, and is hidden under reduced motion. Slow requests show "The elves are fetching your letter…"; failures reseal and return focus to the seal.

### Post Office (signature)
A timber cabinet of mail slots, one per conversation (to my recipient, from my Santa), beside a paper counter where the active thread is read and answered. Each slot is a link that replaces history, so Back returns to the village. Each conversation keeps its own draft, sending state, error and confirmation, so switching slots never mixes letters. Send letter is the cranberry action; a sent letter receives the elf's postmark, which stamps in (scaling down and turning to -12deg).

### Gift House Save
The wishlist form ends in a sticky paper save bar. Save profile is evergreen. A failed save keeps everything typed and shows the reason in a Cranberry Wash box directly above the action; a successful save shows "Saved" with a small elf that nods once (700ms). "Unsaved changes" reads in Golden Text.

### Snow
A few slow flakes (snow fill, a faint Snow Shadow ring) drifting in sky bands, outdoors only, placed in boxes that exclude text and controls. Paused offscreen and by the Pause snow / Let it snow toggle, which is remembered on the device. Hidden entirely, toggle included, under reduced motion.

## Do's and Don'ts

### Do:
- **Do** give each area exactly one cranberry action and make every other action evergreen, secondary, or a text link.
- **Do** outline every surface and illustration stroke in midnight (2.5px structural, 2px small) and cast its shadow down-right in Snow Shadow.
- **Do** make every building a single link containing its sign and artwork, with brightened windows, a 2px sign lift and a ~200ms door swing.
- **Do** keep reading text on paper sheets as real HTML, never inside the illustration.
- **Do** keep every tap target at least 44px tall and measure every new text/ground pair before it ships.
- **Do** provide a reduced-motion path for every animation: snow disappears, the envelope opens instantly, the elf stays still.
- **Do** move focus to the result after any reveal and announce it politely.

### Don't:
- **Don't** let scenery encode pairings. No illustration, decoration, order, color or animation may reveal or hint at who gives to whom.
- **Don't** render a recipient's name anywhere before the server's authorized answer, and never refetch it to replay an animation.
- **Don't** add a dark mode, a night scene, gradients, glows or photographic textures; the village has one bright winter daytime.
- **Don't** put eyebrow labels or uppercase kickers above headings.
- **Don't** use Shantell Sans for anything but people's names and aliases.
- **Don't** use golden (other than Golden Text) as text on a light ground.
- **Don't** let snow fall behind text or controls, indoors, or for visitors who prefer reduced motion.
- **Don't** nest cards or use more than one evergreen highlight card per screen.
