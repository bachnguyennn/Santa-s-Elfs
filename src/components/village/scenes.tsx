import * as React from "react";
import { cn } from "@/lib/utils";
import { C, Cottage, ElfCourier, Footprints, GiftHouse, line, Mailbox, Pine, PostOffice, Santa, Sleigh, SnowShadow, Workshop } from "./art";

/**
 * Composed scenes. Every scene is one decorative <svg aria-hidden>; all text and controls live in HTML
 * around it. Desktop scenes overlap buildings in depth; mobile scenes recompose vertically.
 */

/** Village Square, desktop: houses in depth, the tree, Santa loading the sleigh, an elf crossing with letters. */
export function SquareSceneWide({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden focusable="false">
      {/* far ridge */}
      <path d="M0 330c120-40 240-60 380-46s250 40 380 20 260-70 400-64 220 30 280 44V520H0z" fill="#E3F5FC" />
      {/* back row of cottages */}
      <Cottage x={840} y={330} s={0.72} wall={C.paper} roof={C.evergreen} chimneyTilt={-7} />
      <Cottage x={1010} y={318} s={0.82} wall="#FCE2C2" roof={C.cranberry} chimneyTilt={5} />
      <Cottage x={1330} y={326} s={0.78} wall={C.paper} roof={C.evergreen} chimneyTilt={-4} />
      <Pine x={1190} y={322} s={0.6} />
      {/* the square: snow ground */}
      <path d="M0 408c160-26 330-34 520-30 140 3 230-20 380-40 160-20 340-20 540-4V520H0z" fill={C.snow} />
      <path d="M-4 408c160-26 330-34 524-30 140 3 230-20 380-40 160-20 340-20 544-4" fill="none" {...line} />
      <path d="M0 450c180-14 340-10 480 2" fill="none" stroke={C.snowShadow} strokeWidth={3} strokeLinecap="round" />
      {/* the path winding down toward the Workshop */}
      <path d="M760 520c-10-40 20-70 60-86 50-20 120-26 150-44" fill="none" stroke="#E3F0F6" strokeWidth={44} strokeLinecap="round" />
      <Footprints points={[[742, 500], [756, 486], [770, 474], [786, 462], [800, 452], [818, 446], [836, 440]]} />
      {/* tree in the square */}
      <Pine x={950} y={430} s={1.25} star baubles />
      {/* the elf crossing the square with letters */}
      <ElfCourier x={858} y={470} s={1} />
      {/* Santa loading the sleigh */}
      <Sleigh x={1230} y={470} s={1.05} />
      <Santa x={1092} y={474} s={1.05} />
      {/* a small discovery: a snowman watching the loading */}
      <g transform="translate(1388 470)">
        <SnowShadow cx={14} cy={0} rx={30} ry={5} />
        <circle cx={0} cy={-24} r={24} fill={C.snow} {...line} />
        <circle cx={0} cy={-62} r={16} fill={C.snow} {...line} />
        <path d="M0 -62l14 3-14 3z" fill={C.goldenDeep} {...line} />
        <circle cx={-5} cy={-67} r={2} fill={C.ink} />
        <path d="M-16 -50h32" stroke={C.cranberry} strokeWidth={6} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Village Square, phones: tree on the left, Santa and the sleigh on the right, the elf in front. */
export function SquareSceneNarrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 84 400 256" className={cn("overflow-visible", className)} aria-hidden focusable="false">
      {/* ridge and ground run far past the frame, so a width-capped scene never shows a hard edge */}
      <path d="M-2000 150H0c80-24 180-30 260-18s110 10 140 2H2400V400H-2000z" fill="#E3F5FC" />
      <Cottage x={300} y={170} s={0.55} roof={C.evergreen} chimneyTilt={6} />
      <Cottage x={150} y={176} s={0.5} wall="#FCE2C2" roof={C.cranberry} chimneyTilt={-6} />
      <path d="M-2000 214H0c90-20 200-26 300-16 40 4 70 4 100 0H2400V400H-2000z" fill={C.snow} />
      <path d="M-2000 214H0c90-20 200-26 300-16 40 4 70 4 100 0H2400" fill="none" {...line} />
      <path d="M196 340c-6-30 10-52 40-64" fill="none" stroke="#E3F0F6" strokeWidth={34} strokeLinecap="round" />
      <Footprints points={[[190, 330], [198, 318], [206, 306], [216, 296]]} />
      <Pine x={64} y={262} s={0.82} star baubles />
      <Sleigh x={300} y={286} s={0.62} />
      <Santa x={218} y={290} s={0.64} />
      <ElfCourier x={128} y={318} s={0.66} />
    </svg>
  );
}

/** The Workshop exterior, for its BuildingLink. */
export function WorkshopArt({ className }: { className?: string }) {
  return (
    <svg viewBox="-240 -330 480 350" className={className} aria-hidden focusable="false">
      <path d="M-240 6c80-14 160-16 240-10s160 4 240-6V20h-480z" fill={C.snow} />
      <path d="M-240 6c80-14 160-16 240-10s160 4 240-6" fill="none" {...line} />
      <Workshop x={0} y={6} />
      <Pine x={-206} y={8} s={0.62} />
    </svg>
  );
}

export function PostOfficeArt({ className }: { className?: string }) {
  return (
    <svg viewBox="-220 -290 440 310" className={className} aria-hidden focusable="false">
      <path d="M-220 6c80-12 160-14 220-8s150 6 220-4V20h-440z" fill={C.snow} />
      <path d="M-220 6c80-12 160-14 220-8s150 6 220-4" fill="none" {...line} />
      <PostOffice x={-10} y={6} />
    </svg>
  );
}

export function GiftHouseArt({ className }: { className?: string }) {
  return (
    <svg viewBox="-200 -280 400 300" className={className} aria-hidden focusable="false">
      <path d="M-200 6c80-12 140-14 200-8s130 6 200-4V20h-400z" fill={C.snow} />
      <path d="M-200 6c80-12 140-14 200-8s130 6 200-4" fill="none" {...line} />
      <GiftHouse x={0} y={6} />
    </svg>
  );
}

/** The participant's own cottage, with the post-box where their envelope waits. */
export function MailboxArt({ className, flagUp = true }: { className?: string; flagUp?: boolean }) {
  return (
    // No ground of its own: the village page lays one full-width snowbank under it.
    <svg viewBox="-200 -200 400 214" className={className} aria-hidden focusable="false">
      <Pine x={-168} y={8} s={0.42} />
      <Cottage x={-40} y={6} s={1.05} wall="#FCE2C2" roof={C.evergreen} chimneyTilt={6} />
      <Mailbox x={128} y={6} s={1.05} flagUp={flagUp} />
    </svg>
  );
}

/** The snowy path continuing between scenes. */
export function PathBand({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={className} aria-hidden focusable="false">
      <path
        d={flip ? "M380 0c20 40 160 50 380 60s320 40 340 60" : "M760 0c-20 40-140 50-300 60S320 96 300 120"}
        fill="none"
        stroke="#E3F0F6"
        strokeWidth={40}
        strokeLinecap="round"
      />
    </svg>
  );
}
