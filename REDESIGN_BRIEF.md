# SantaElf redesign brief

Redesign the entire **SantaElf** web application as a bright, illustrated Christmas village where Santa and his elves are getting ready for gift exchanges. SantaElf is an existing, accountless Secret Santa app for groups of 3–20. Work in the current repository and keep it deployable on Vercel.

**Scrolling takes you farther into the village. Clicking a building takes you inside to do something.** A participant should recognize the Post Office from down the street, tap its door, and find their anonymous messages waiting on the counter. Someone returning just to send a message should also be able to get there in one tap from their participant home.

Use Google Santa Tracker for inspiration on village scale, cheerful silhouettes, and small discoveries. Use Take Me to Christmas 2024 for inspiration on handling a physical object on screen. Create original buildings, characters, compositions, and motion. Use one fixed visual theme. Leave wrapping colors, stamps, sound, and theme pickers out of scope. [Google Santa Tracker](https://santatracker.google.com/intl/en/) · [Take Me to Christmas 2024](https://www.awwwards.com/sites/take-me-to-christmas-2024)

## 1. Show me the direction first

Read `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `src/lib/contracts.ts`, and the relevant Next.js guides in `node_modules/next/dist/docs/`. Inspect the existing pages and components. The current design uses pine felt, paper slips, and a card shuffle. The village and envelope are the new visual direction.

Use the **Impeccable** skill to shape the design, critique the rendered screens, and polish them. Use **Humanizer** for visible copy. Use **ImageGen** if a custom painted landscape would improve the scene. Keep interactive objects independently controllable in the browser.

Your first deliverable is a short route map and **three rendered previews** using fictional data.

1. **Village landing page** at 375 px and 1440 px. Show the first viewport and enough of the next scene for me to judge the scroll.
2. **Organizer Workshop** with a realistic roster, a pending approval, and the next draw action. I want to see whether the design works on a busy screen.
3. **Participant envelope** in its sealed and opened states. Show where the recipient’s name, the participant’s own alias, and the wishlist appear.

Explain the main art and motion decisions in a few sentences. **Wait for my approval of those previews before rolling the design out across the app.**

## 2. Art direction, color, and type

Use a **bright winter daytime** palette. Draw chunky rooflines, rounded snowbanks, slightly crooked chimneys, and simple characters with expressive poses. Choose one light direction, from the upper left, and give objects a short blue shadow on the snow. On desktop, let buildings overlap in depth. On mobile, recompose the street vertically so signs and doors stay large enough to use.

| Color | Hex | Where to use it |
|---|---|---|
| Winter sky | `#BDEBFA` | Daytime sky and open exterior space |
| Fresh snow | `#F7FCFF` | Snowbanks, roofs, and clear space around the scene |
| Snow shadow | `#A8CDDF` | Grounding buildings and separating layers of snow |
| Evergreen | `#175541` | Navigation, signs, and secondary actions |
| Cranberry | `#B52F46` | Primary action, envelope seal, and selected details |
| Golden window | `#FFD166` | Lit windows, brass hardware, and small points of interest |
| Warm paper | `#FFF7E8` | Letters, forms, rosters, and reading surfaces |
| Midnight ink | `#172D38` | Body text, outlines, and headings on light surfaces |

Use the existing **Bricolage Grotesque** for headings and signs, **Atkinson Hyperlegible Next** for body copy and controls, and **Shantell Sans** sparingly for the revealed name or a short handwritten note. Keep instructions and building labels as real HTML text. Use a solid reading surface wherever scenery would interfere with contrast. Reserve the strongest cranberry button for the main action in each area.

## 3. Compose the village around the real routes

| Location | Experience |
|---|---|
| **Village Square** · `/` | Open on Santa loading a sleigh while an elf crosses the square with letters. Keep **Start a group** and **Recover my link** visible immediately. Explain that invited participants join through their invitation link. Let a snowy path and a glimpse of the next roof invite scrolling. |
| **Workshop** · `/new`, `/o/[groupId]` and organizer subpages | Carry one recognizable detail from exterior to interior, such as a green arched door and a brass bell. Inside, use a well-lit workbench for group setup, a noticeboard for the roster, and clearly labeled controls for approvals, exclusions, draw, settings, and emergency reveal. Keep destructive actions visually separate. |
| **Welcome desk** · `/j/[code]` | Put the group name, exchange details, and join form in the first reading area. Someone opening an invitation on a phone can join directly. |
| **Participant village** · `/p/[participantId]` | Show the buildings this participant can use. Label entrances **Post Office · Messages** and **Gift House · Wishlist**. Give the personal envelope its own place. Include ordinary navigation links to the same destinations. |
| **Post Office and Gift House** · participant messages and profile | Carry exterior details into each room. Use mail slots to distinguish the existing message threads and a paper list for wishlist editing. Keep the active thread, message composer, save action, and feedback easy to find. |
| **Personal envelope** · participant reveal | Replace the current card shuffle with a sealed envelope. Preserve the existing reveal request, authorization, and previously revealed state. |
| **Recovery, expired links, errors, and empty states** | Use quiet scenery, a plain explanation, and one clear next action. Give failed email delivery and pending approval the same care as the happy path. |

Public village buildings may explain a feature. Only offer entry to private rooms when the user has the appropriate access. Preserve direct invitation, recovery, organizer, and participant links.

## 4. Build these interactions

- **Scrolling.** Use ordinary vertical scrolling. Arrange the square, workshop lane, and post office along one continuous path. At the bottom of each scene, show part of the next landmark. Keep all content reachable with a keyboard and with animation disabled.
- **Entering a building.** Make the building and its visible sign one semantic link with one keyboard stop. On hover or focus, brighten its window or lift its sign by 2 px. On activation, begin navigation immediately. If practical, overlap a **160–220 ms** door-opening animation with the route change. Match an exterior detail to the interior so entry feels continuous even on a fast connection. Browser Back should return the visitor to the same doorstep and scroll position.
- **Opening the envelope.** Make the seal a real button named **Open my envelope**. On activation, lift the flap from its fold in about **220 ms**, then slide the letter upward over **300–400 ms**. Show the result as soon as the authorized data and transition are ready. Provide **Skip animation**, handle a slow or failed request, and move focus to the result heading. Returning participants can read an already-opened letter immediately. Replaying the motion must never redraw a name.
- **Character reactions.** Give each reaction a reason. An elf can nod once after a successful wishlist save or stamp a letter after a message sends. Keep the ordinary text confirmation. On a failed save, preserve what the person typed and show the error beside the action.
- **Snow and reduced motion.** Use sparse, slow flakes outdoors. Keep snow away from text and controls. Provide a **Pause snow** control and remember the preference locally. Honor `prefers-reduced-motion` by showing static scenery, entering rooms directly, and revealing the letter immediately once its data arrives.

## 5. Implement in the existing stack

Use the repository’s **Next.js App Router, React, TypeScript, Tailwind CSS, Radix UI, and Lucide**. Start with `src/components/brand`, `src/components/ui`, and `src/components/reveal/reveal-experience.tsx`. Reuse the existing buttons, fields, dialogs, navigation, and form behavior. Add only the visual components with distinct jobs, such as a building entrance, snow layer, or envelope.

Use CSS transforms and opacity for doors, signs, snow, and character reactions. Use the Web Animations API if the envelope sequence needs cancellation or replay. Use optimized local SVG or raster assets for the artwork. Keep decorative scene layers out of the accessibility tree. Load below-the-fold art progressively and pause offscreen animation. The landing page’s main action must work while artwork is loading. The design should work within the existing Vercel setup without a paid asset service or animation dependency.

Preserve the existing database, API contracts, email behavior, permissions, and privacy rules. In particular, **never encode real pairings in scenery**. A lit window, gift label, animation order, accessible label, or hidden DOM element must never let someone infer who drew whom. Use only data already authorized for that viewer.

## 6. Verify the finished redesign

After I approve the previews, implement every user-facing route and update `DESIGN.md` to match the approved design. Inspect the rendered app at **375, 768, 1024, and 1440 px**. Test keyboard navigation, touch targets of at least **44 × 44 px**, visible focus, text contrast, reduced motion, slow loading, long names, and error recovery.

Use Playwright to verify three complete journeys: an organizer creates a group and reaches the draw controls, a participant enters the Post Office and returns to the same place in the village, and an authorized participant opens their envelope and sees the same recipient on return. Run `npm run verify`. Use local test data for these checks. Deliver screenshots of the finished desktop and mobile views, the test results, and any remaining issue I should know about.
