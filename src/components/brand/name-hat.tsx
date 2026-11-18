import * as React from "react";
import { cn } from "@/lib/utils";
import { artA11y, lineProps, type ArtProps } from "./motifs";

/** Folded name slips spilling out of the hat onto the table. */
const SLIPS: { x: number; y: number; r: number; name: string }[] = [
  { x: 84, y: 150, r: -26, name: "Sam" },
  { x: 58, y: 204, r: -10, name: "Maya" },
  { x: 146, y: 224, r: 5, name: "Jonas" },
  { x: 222, y: 222, r: -4, name: "Priya" },
  { x: 292, y: 230, r: 9, name: "Oma" },
];

/**
 * A berry Santa hat lying on its side: fur brim and open mouth on the left, the body flopping
 * over to a pompom on the right, folded name slips tumbling out onto the table.
 * The names are example names (decorative). Pass `names` (up to 5) to personalise.
 */
export function NameHat({ title, className, names, ...props }: ArtProps & { names?: string[] }) {
  return (
    <svg viewBox="0 0 360 252" className={cn("h-auto w-full", className)} {...artA11y(title)} {...props}>
      {/* body: rises from the brim, flops over to the right */}
      <path
        d="M120 58C172 36 244 44 288 82c26 22 42 52 44 86l-16 6c-5-22-18-36-36-40-14 34-44 60-80 72-24 8-50 10-70 9z"
        fill="#a8383a"
        {...lineProps}
      />
      {/* the fold where the tip flops over, and a soft felt crease */}
      <path d="M280 134c-6-20-20-38-40-50" fill="none" stroke="#6f1f22" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
      <path d="M176 196c22-8 40-22 52-40" fill="none" stroke="#8e2b2c" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {/* pompom */}
      <circle cx="326" cy="186" r="16" fill="#fdf9f0" {...lineProps} />
      {/* fur brim and the open mouth of the hat */}
      <ellipse cx="124" cy="138" rx="32" ry="82" transform="rotate(-8 124 138)" fill="#fdf9f0" {...lineProps} />
      <ellipse cx="118" cy="138" rx="18" ry="66" transform="rotate(-8 118 138)" fill="#6f1f22" {...lineProps} />
      {/* slips */}
      {SLIPS.map((s, i) => (
        <g key={i} transform={`rotate(${s.r} ${s.x} ${s.y})`}>
          <rect x={s.x - 33} y={s.y - 17} width="66" height="34" rx="3" fill={i % 2 ? "#f8f0df" : "#fdf9f0"} {...lineProps} />
          <text
            x={s.x}
            y={s.y + 6}
            textAnchor="middle"
            fontSize="16"
            fontWeight={600}
            fill="#1e1a14"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            {names?.[i] ?? s.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
