"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Elf } from "./elf";
import { NameHat } from "./name-hat";
import { HandName } from "./paper-slip";

/**
 * The landing hero's signature interaction: a folded slip sticks out of the hat; pressing it
 * draws the slip and unfolds it in place into an example card (recipient + alias), as the
 * surface brief specifies. "Put it back" returns the slip.
 * Example content only. Under reduced motion the global rule makes the unfold instant.
 */
export function HatDraw({ className }: { className?: string }) {
  const [drawn, setDrawn] = React.useState(false);
  const resultRef = React.useRef<HTMLParagraphElement>(null);
  const groupRef = React.useRef<HTMLDivElement>(null);
  const drawRef = React.useRef<HTMLButtonElement>(null);
  // Move focus only after the visitor draws or puts the slip back, never on page load.
  const moveFocus = React.useRef(false);

  React.useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (drawn ? resultRef.current : drawRef.current)?.focus({ preventScroll: true });
  }, [drawn]);

  function toggle(next: boolean) {
    moveFocus.current = true;
    setDrawn(next);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative ml-auto w-[80%] pt-[26%] sm:w-[86%]">
        <NameHat />
      </div>
      <Elf pose="hold" className="absolute bottom-[4%] left-0 h-[46%]" />

      {!drawn ? (
        <button
          ref={drawRef}
          type="button"
          onClick={() => toggle(true)}
          className="slip group absolute top-[33%] left-[44%] z-10 inline-flex min-h-12 -translate-x-1/2 -rotate-12 items-center gap-2 px-4 py-2 font-bold whitespace-nowrap text-pine-900 transition-[translate,rotate] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-2 hover:-rotate-6 active:translate-y-0"
        >
          <span aria-hidden className="block h-4 w-0.5 rounded-full bg-gold-500" />
          Try a draw
          <span className="sr-only"> (example)</span>
        </button>
      ) : (
        <div
          ref={groupRef}
          role="group"
          aria-label="Example draw"
          // Once unfolded, bring the whole result, including "Put it back", on screen (short phones).
          onAnimationEnd={() => groupRef.current?.scrollIntoView({ block: "nearest" })}
          className="slip slip-plain absolute top-0 left-0 z-20 w-[64%] -rotate-2 animate-unfold p-4 text-center sm:top-[2%] sm:left-[10%] sm:w-[min(18rem,84%)] sm:p-6"
        >
          <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-14 -translate-x-1/2 rotate-2 rounded-sm bg-gold-200/90 shadow-sm" />
          <p ref={resultRef} tabIndex={-1} className="text-sm text-ink-700">
            You’re the Secret Santa for
            <HandName className="block text-[2rem] leading-tight font-bold text-berry-700">Grandma Rosie</HandName>
          </p>
          <p className="mt-1 text-sm text-ink-700">
            Your secret alias: <span className="font-display font-bold text-pine-800">Dasher</span>
          </p>
          <p className="mt-2 text-xs text-ink-500">An example draw. Real names stay sealed until the organizer draws.</p>
          <button
            type="button"
            onClick={() => toggle(false)}
            className="mt-1 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-pine-700 underline decoration-gold-500 underline-offset-4 hover:text-pine-900"
          >
            Put it back
          </button>
        </div>
      )}
    </div>
  );
}
