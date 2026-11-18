import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. A small spinning star-wreath in currentColor.
 * Decorative by default; pass `label` when the spinner is the only progress cue (renders role="status").
 */
export function Spinner({ label, className }: { label?: string; className?: string }) {
  const svg = (
    <svg viewBox="0 0 24 24" className={cn("size-5 animate-spin-slow", className)} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.25} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
  if (!label) return svg;
  return (
    <span role="status" className="inline-flex items-center gap-2">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  );
}
