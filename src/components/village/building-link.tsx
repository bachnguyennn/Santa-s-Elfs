"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A building you can enter: the artwork and its sign are ONE link with one keyboard stop.
 * Hover/focus brightens the windows and lifts the sign 2px (globals.css .building-link).
 * Activation navigates immediately; the door swings open (~200ms) alongside the route change.
 * The sign is real HTML text: "Post Office · Messages".
 */
export function BuildingLink({
  href,
  name,
  purpose,
  art,
  className,
  signClassName,
  artClassName,
}: {
  href: string;
  /** The building's name on the sign, e.g. "Post Office". */
  name: string;
  /** What you do inside, e.g. "Messages". */
  purpose: string;
  /** The building's decorative SVG (aria-hidden). */
  art: React.ReactNode;
  className?: string;
  signClassName?: string;
  artClassName?: string;
}) {
  const [entering, setEntering] = React.useState(false);
  return (
    <Link
      href={href}
      data-entering={entering}
      onClick={() => setEntering(true)}
      className={cn("building-link group relative flex flex-col items-center no-underline", className)}
    >
      <span
        className={cn(
          "building-sign relative z-10 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-midnight bg-paper px-4 py-2 text-midnight",
          signClassName,
        )}
      >
        <span className="font-display text-lg leading-tight font-extrabold tracking-[-0.01em]">{name}</span>
        <span aria-hidden className="text-snow-shadow">
          ·
        </span>
        <span className="text-[0.9375rem] font-bold text-evergreen underline decoration-2 underline-offset-4">{purpose}</span>
      </span>
      <span aria-hidden className={cn("block w-full", artClassName)}>
        {art}
      </span>
    </Link>
  );
}
