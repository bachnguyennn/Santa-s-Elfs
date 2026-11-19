---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/new/page.tsx","src/app/o/[groupId]/layout.tsx","src/app/p/[participantId]/page.tsx","src/app/j/[code]/page.tsx"]
---

# Village Square (/) and the village routes

Mode: Persuade on `/`; Operate inside buildings (Workshop, Post Office, Gift House, welcome desk). Audience: organizers deciding to run their Secret Santa here, participants arriving from an invite or private link. Action on `/`: Start a group (cranberry), Recover my link (evergreen secondary).

## Direction contract

THESIS: SantaElf is a bright, illustrated Christmas village: scrolling walks you down the street, a building is a door you tap to go inside and do something. Refuses the hero-over-three-cards landing and the generic dashboard.

OWN-WORLD: Winter-daytime sky #BDEBFA over fresh snow #F7FCFF; evergreen #175541 signs and secondary actions; cranberry #B52F46 for the one main action per area and the wax seal; golden #FFD166 lit windows and brass; warm paper #FFF7E8 reading surfaces with 2.5px midnight #172D38 outlines and a short blue (#A8CDDF) shadow down-right (light from the upper left). Bricolage Grotesque signs and headings, Atkinson Hyperlegible Next body, Shantell Sans only for names and aliases. Original chunky SVG buildings with crooked chimneys.

STORY: Visitors see Santa loading the sleigh, understand the elves draw names and every Santa writes under an alias, and start a group or recover their link. Participants find their post-box, Post Office and Gift House; organizers work in the Workshop.

FIRST VIEWPORT: Sky; headline left, Start a group + Recover my link under it, short invite note; the square right/bottom (tree, Santa loading the sleigh, an elf with letters, snowman); the Workshop roof and sign peeking at the bottom. Phones stack text then the square, with Santa and the sleigh on the first screen.

FORM: seed: none (pinned) — "Redesign the entire SantaElf web application as a bright, illustrated Christmas village… Scrolling takes you farther into the village. Clicking a building takes you inside to do something." (REDESIGN_BRIEF.md, approved by the user with previews on 2026-11-18/19). Signature interactions: building entrance (one link, windows brighten, sign lifts 2px, door swings ~200ms, Back returns to the doorstep) and the sealed envelope (seal button, flap 220ms, letter 360ms, Skip, focus to result).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
