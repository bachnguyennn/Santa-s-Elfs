import * as React from "react";
import { cn } from "@/lib/utils";
import { artA11y, lineProps, type ArtProps } from "./motifs";

const SKIN = "#f0c8a2";
const SKIN_SHADE = "#dfa47c";

/**
 * The SantaElf elf. Original drawing: floppy pine hat, berry band, pointed ears, cream collar.
 * pose: "wave" (greeting, empty states), "hold" (holding a folded name slip: the draw),
 * "peek" (head and hands only, for peeking over an edge: errors, not-found).
 */
export function Elf({ pose = "wave", title, className, ...props }: ArtProps & { pose?: "wave" | "hold" | "peek" }) {
  const peek = pose === "peek";
  return (
    <svg
      viewBox={peek ? "20 14 128 112" : "20 14 128 196"}
      className={cn(peek ? "h-24 w-auto" : "h-40 w-auto", className)}
      {...artA11y(title)}
      {...props}
    >
      {!peek && (
        <g>
          {/* legs + curled shoes */}
          <path d="M68 184v12M92 184v12" {...lineProps} fill="none" />
          <path d="M70 194H56c-6 0-9-3-10-7 4 2 6 1 7-1 1 4 4 5 7 5h10z" fill="#a8383a" {...lineProps} />
          <path d="M90 194h14c6 0 9-3 10-7-4 2-6 1-7-1-1 4-4 5-7 5H90z" fill="#a8383a" {...lineProps} />
          {/* tunic */}
          <path d="M57 128c-4 20-8 40-10 58h66c-2-18-6-38-10-58z" fill="#1c5c40" {...lineProps} />
          {/* belt + buckle */}
          <path d="M51 160h58v9H50z" fill="#1e1a14" {...lineProps} />
          <rect x="74" y="157.5" width="12" height="14" rx="2" fill="#ddb65a" {...lineProps} />
          {/* arms */}
          {pose === "wave" && (
            <>
              <path d="M58 134c-12 7-17 18-16 30l8 1c0-9 4-16 11-20z" fill="#164a33" {...lineProps} />
              <circle cx="46" cy="168" r="6" fill={SKIN} {...lineProps} />
              <path d="M102 134c11-5 17-15 19-28l8 2c-2 15-10 27-23 35z" fill="#164a33" {...lineProps} />
              <circle cx="126" cy="101" r="6.5" fill={SKIN} {...lineProps} />
            </>
          )}
          {pose === "hold" && (
            <>
              <path d="M58 134c-8 6-11 13-10 20l8 2c0-5 3-9 7-12z" fill="#164a33" {...lineProps} />
              <path d="M102 134c8 6 11 13 10 20l-8 2c0-5-3-9-7-12z" fill="#164a33" {...lineProps} />
              <g transform="rotate(-6 80 152)">
                <rect x="50" y="138" width="60" height="30" rx="3" fill="#fdf9f0" {...lineProps} />
                <path d="M51 153h58" stroke="#e3d5b8" strokeWidth={1.5} />
                <path d="M60 147c6-3 10 2 15-1s9 1 13-1M64 160c5-2 9 1 13-1" fill="none" stroke="#4a4136" strokeWidth={1.6} strokeLinecap="round" />
              </g>
              <circle cx="52" cy="156" r="6" fill={SKIN} {...lineProps} />
              <circle cx="108" cy="150" r="6" fill={SKIN} {...lineProps} />
            </>
          )}
          {/* collar */}
          <path d="M58 126l8 12 7-10 7 12 7-12 7 10 8-12z" fill="#fdf9f0" {...lineProps} />
        </g>
      )}
      {/* ears */}
      <path d="M55 92c-8-3-14-9-19-14 1 12 7 25 19 30z" fill={SKIN} {...lineProps} />
      <path d="M105 92c8-3 14-9 19-14-1 12-7 25-19 30z" fill={SKIN} {...lineProps} />
      {/* head */}
      <circle cx="80" cy="100" r="27" fill={SKIN} {...lineProps} />
      {/* face */}
      <ellipse cx="70.5" cy="101" rx="2.6" ry="3.4" fill="#1e1a14" />
      <ellipse cx="89.5" cy="101" rx="2.6" ry="3.4" fill="#1e1a14" />
      <circle cx="63" cy="109" r="4.5" fill="#c24e4c" opacity={0.35} />
      <circle cx="97" cy="109" r="4.5" fill="#c24e4c" opacity={0.35} />
      <circle cx="80" cy="107" r="3" fill={SKIN_SHADE} />
      <path d="M72 113q8 7 16 0" fill="none" {...lineProps} />
      {/* hat */}
      <path d="M52 86c2-26 20-46 46-56 12-4 24-6 30 0-10 4-20 14-22 26-1 10 1 20 4 30z" fill="#2a7253" {...lineProps} />
      <path d="M49 82c20-6 42-6 62 0v10c-20-6-42-6-62 0z" fill="#a8383a" {...lineProps} />
      <circle cx="130" cy="34" r="5.5" fill="#ddb65a" {...lineProps} />
      {peek && (
        <>
          {/* fingers over the edge */}
          <path d="M40 126c0-8 5-13 11-13s11 5 11 13zM98 126c0-8 5-13 11-13s11 5 11 13z" fill={SKIN} {...lineProps} />
          <path d="M47 118v8M55 118v8M105 118v8M113 118v8" fill="none" {...lineProps} />
        </>
      )}
    </svg>
  );
}
