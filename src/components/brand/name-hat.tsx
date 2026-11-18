import * as React from "react";
import { cn } from "@/lib/utils";
import { artA11y, lineProps, type ArtProps } from "./motifs";

const SLIPS: { x: number; y: number; r: number; name: string }[] = [
  { x: 92, y: 66, r: -16, name: "Maya" },
  { x: 150, y: 44, r: 6, name: "Jonas" },
  { x: 204, y: 64, r: 18, name: "Oma" },
  { x: 122, y: 92, r: 4, name: "Sam" },
  { x: 182, y: 96, r: -8, name: "Priya" },
];

/**
 * A berry Santa hat, upturned like a bowl, full of folded name slips.
 * The names are example names (decorative). Pass `names` (up to 5) to personalise.
 */
export function NameHat({ title, className, names, ...props }: ArtProps & { names?: string[] }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 260" className={cn("h-auto w-full", className)} {...artA11y(title)} {...props}>
      <defs>
        <clipPath id={`${id}-in`}>
          <rect x="0" y="0" width="320" height="122" />
          <ellipse cx="160" cy="122" rx="112" ry="17" />
        </clipPath>
      </defs>
      {/* floppy tip + pompom, behind the bowl */}
      <path d="M268 132c22 4 38 22 44 54 3 16 2 32-2 46l-12-2c2-20-2-38-14-52-8-9-18-14-30-16z" fill="#8e2b2c" {...lineProps} />
      <path d="M296 176c4 10 6 22 5 34" fill="none" stroke="#6f1f22" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <circle cx="303" cy="236" r="14" fill="#fdf9f0" {...lineProps} />
      {/* bowl */}
      <path d="M38 124c0 72 50 116 122 116s122-44 122-116z" fill="#a8383a" {...lineProps} />
      <path d="M70 180c20 26 50 38 90 40" fill="none" stroke="#8e2b2c" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {/* fur brim + dark opening */}
      <ellipse cx="160" cy="122" rx="128" ry="26" fill="#fdf9f0" {...lineProps} />
      <ellipse cx="160" cy="122" rx="112" ry="17" fill="#6f1f22" {...lineProps} />
      {/* slips */}
      <g clipPath={`url(#${id}-in)`}>
        {SLIPS.map((s, i) => (
          <g key={i} transform={`rotate(${s.r} ${s.x} ${s.y})`}>
            <rect x={s.x - 34} y={s.y - 17} width="68" height="58" rx="3" fill={i % 2 ? "#f8f0df" : "#fdf9f0"} {...lineProps} />
            <path d={`M${s.x - 33} ${s.y + 12}h66`} stroke="#e3d5b8" strokeWidth={1.5} />
            <text
              x={s.x}
              y={s.y + 4}
              textAnchor="middle"
              fontSize="17"
              fontWeight={600}
              fill="#1e1a14"
              style={{ fontFamily: "var(--font-hand)" }}
            >
              {names?.[i] ?? s.name}
            </text>
          </g>
        ))}
      </g>
      {/* front lip of the brim, over the slips */}
      <path d="M48 122a112 17 0 0 0 224 0" fill="none" {...lineProps} />
      <path d="M32 122a128 26 0 0 0 256 0" fill="none" {...lineProps} />
    </svg>
  );
}
