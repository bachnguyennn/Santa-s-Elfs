import * as React from "react";
import { C, line } from "./art";

/**
 * One exterior detail per building, repeated inside so entering feels continuous (REDESIGN_BRIEF.md §3).
 * Decorative.
 */

/** Workshop: the green arched door with its brass bell. */
export function WorkshopDoor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 110" className={className} aria-hidden focusable="false">
      <path d="M8 108V44a37 37 0 0 1 74 0v64z" fill={C.evergreenDeep} {...line} />
      <path d="M14 108V46a31 31 0 0 1 62 0v62z" fill={C.evergreen} {...line} />
      <path d="M30 100V44M45 100V30M60 100V44" stroke={C.evergreenSoft} strokeWidth={5} />
      <circle cx={64} cy={70} r={4} fill={C.golden} {...line} strokeWidth={1.75} />
      <path d="M45 2v8" {...line} strokeWidth={1.75} />
      <path d="M34 26c0-12 4-17 11-17s11 5 11 17z" fill={C.golden} {...line} />
      <circle cx={45} cy={28} r={3} fill={C.goldenDeep} {...line} strokeWidth={1.5} />
    </svg>
  );
}

/** Post Office: the cranberry door with its brass mail slot, and the lamp beside it. */
export function PostOfficeDoor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 120" className={className} aria-hidden focusable="false">
      <path d="M78 14h18v14" fill="none" {...line} />
      <path d="M88 28h16l-3 18h-10z" fill={C.golden} {...line} />
      <rect x={8} y={12} width={70} height={106} rx={4} fill={C.cranberryDeep} {...line} />
      <rect x={13} y={17} width={60} height={101} rx={3} fill={C.cranberry} {...line} />
      <rect x={25} y={56} width={36} height={9} rx={2} fill={C.golden} {...line} />
      <circle cx={63} cy={84} r={4} fill={C.golden} {...line} strokeWidth={1.75} />
    </svg>
  );
}

/** Gift House: the golden door under the ribbon bow. */
export function GiftHouseDoor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden focusable="false">
      <path d="M50 22c-20-20-42-10-31 4 7 7 20 6 31-4zM50 22c20-20 42-10 31 4-7 7-20 6-31-4z" fill={C.golden} {...line} />
      <circle cx={50} cy={22} r={6} fill={C.goldenDeep} {...line} />
      <rect x={16} y={34} width={68} height={84} rx={4} fill={C.goldenDeep} {...line} />
      <rect x={21} y={39} width={58} height={79} rx={3} fill={C.golden} {...line} />
      <path d="M21 76h58" fill="none" {...line} strokeWidth={1.75} />
      <circle cx={66} cy={82} r={4} fill={C.timber} {...line} strokeWidth={1.75} />
    </svg>
  );
}

/** Your post-box: where your own envelope waits. */
export function PostBoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 120" className={className} aria-hidden focusable="false">
      <rect x={45} y={64} width={10} height={54} fill={C.timber} {...line} />
      <path d="M14 66V40a22 22 0 0 1 22-22h28a22 22 0 0 1 22 22v26z" fill={C.cranberry} {...line} />
      <rect x={28} y={34} width={30} height={18} rx={2} fill={C.paper} {...line} transform="rotate(-10 43 43)" />
      <path d="M28 34l15 10 15-10" fill="none" {...line} strokeWidth={1.5} transform="rotate(-10 43 43)" />
      <path d="M86 56V22h16v12H90" fill={C.golden} {...line} />
    </svg>
  );
}
