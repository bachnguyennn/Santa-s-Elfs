import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Small seasonal motifs. All decorative (aria-hidden) unless `title` is passed.
 * Line rule: one even stroke (`--line-w`, default 2px, non-scaling) in pine-950, flat fills, no gradients.
 */

export type ArtProps = React.SVGProps<SVGSVGElement> & { title?: string };

/** Shared a11y wiring for brand SVGs. */
export function artA11y(title?: string) {
  return title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const, focusable: "false" as const };
}

export const LINE = "#301C22";
export const lineProps = {
  stroke: LINE,
  strokeWidth: 2,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

/** Five-point star with soft rounded joins. */
export function Star({ title, className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} {...artA11y(title)} {...props}>
      <path
        d="M12 2.5l2.6 6.1 6.6.5-5 4.3 1.6 6.5L12 16.4 6.2 19.9l1.6-6.5-5-4.3 6.6-.5z"
        fill="currentColor"
        strokeLinejoin="round"
        stroke="currentColor"
        strokeWidth={1.2}
      />
    </svg>
  );
}

/** Four-point sparkle, used for tiny celebrations. */
export function Sparkle({ title, className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} {...artA11y(title)} {...props}>
      <path d="M12 1.5c.9 5.4 2.7 7.2 8.5 8.5-5.8 1.3-7.6 3.1-8.5 8.5-.9-5.4-2.7-7.2-8.5-8.5 5.8-1.3 7.6-3.1 8.5-8.5z" fill="currentColor" />
    </svg>
  );
}

/** Simple six-arm snowflake drawn in currentColor. */
export function Snowflake({ title, className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" {...artA11y(title)} {...props}>
      <g>
        {[0, 60, 120].map((r) => (
          <g key={r} transform={`rotate(${r} 12 12)`}>
            <path d="M12 2.5v19" />
            <path d="M9.5 4.8 12 7l2.5-2.2M9.5 19.2 12 17l2.5 2.2" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Two holly leaves and three berries. */
export function Holly({ title, className, ...props }: ArtProps) {
  const lp = { ...lineProps, strokeWidth: 1.25 };
  return (
    <svg viewBox="0 0 64 40" className={cn("h-8 w-auto", className)} {...artA11y(title)} {...props}>
      <path
        d="M31 22c-6-9-16-14-27-12 3 2 3 5 1 7 4 0 6 2 6 5 3-2 6-2 8 1 1-3 4-4 7-3-1-2 1-4 5 2z"
        fill="#1B6A62"
        {...lp}
      />
      <path
        d="M33 22c6-9 16-14 27-12-3 2-3 5-1 7-4 0-6 2-6 5-3-2-6-2-8 1-1-3-4-4-7-3 1-2-1-4-5 2z"
        fill="#3f8a66"
        {...lp}
      />
      <circle cx="27" cy="26" r="5" fill="#962E40" {...lp} />
      <circle cx="37" cy="26" r="5" fill="#962E40" {...lp} />
      <circle cx="32" cy="18" r="5" fill="#B04558" {...lp} />
    </svg>
  );
}

/**
 * The gold thread: a hand-drawn wavy string. Use as a divider or to tie steps together.
 * `orientation="vertical"` draws it top to bottom.
 */
export function Thread({ orientation = "horizontal", className, title, ...props }: ArtProps & { orientation?: "horizontal" | "vertical" }) {
  const horizontal = orientation === "horizontal";
  return (
    <svg
      viewBox={horizontal ? "0 0 400 24" : "0 0 24 400"}
      preserveAspectRatio="none"
      className={cn(horizontal ? "h-6 w-full" : "h-full w-6", className)}
      fill="none"
      {...artA11y(title)}
      {...props}
    >
      <path
        d={horizontal ? "M0 12 C50 2 80 22 130 12 S220 2 270 12 S350 22 400 12" : "M12 0 C2 50 22 80 12 130 S2 220 12 270 S22 350 12 400"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
