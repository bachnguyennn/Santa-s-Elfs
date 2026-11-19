"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Elf } from "./elf";
import { NameHat } from "./name-hat";
import { HandName } from "./paper-slip";

/**
 * The landing hero's signature interaction: a folded slip sticks out of the hat; pressing it
 * draws the slip and unfolds it in place. The hat hands out only the alias; who you're buying
 * for stays sealed, and the example envelope further down the page reveals that half.
 * Each draw picks one of the example `aliases`, never the same one twice in a row; "Put it back"
 * (or Escape) returns the slip. Example content only. Under reduced motion the unfold is instant.
 */
export function HatDraw({ aliases, className }: { aliases: readonly string[]; className?: string }) {
  const [drawn, setDrawn] = React.useState(false);
  const [alias, setAlias] = React.useState(aliases[0]);
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
    if (next) setAlias((prev) => pickAlias(aliases, prev));
    setDrawn(next);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative ml-auto w-[80%] pt-[26%] sm:w-[86%] md:mr-[20%] md:w-[76%]">
        <NameHat />
      </div>
      {/* Phones: the elf stands at the hat's mouth. From md up the hat tucks under the hero slip,
          so the elf moves out beside the pompom where it stays in view. */}
      <Elf pose="hold" className="absolute bottom-[4%] left-0 h-[46%] md:right-0 md:left-auto md:h-[44%]" />

      {!drawn ? (
        <button
          ref={drawRef}
          type="button"
          onClick={() => toggle(true)}
          className="slip group absolute top-[33%] left-[44%] z-10 md:left-[32%] inline-flex min-h-12 -translate-x-1/2 -rotate-12 items-center gap-2 px-4 py-2 font-bold whitespace-nowrap text-pine-900 transition-[translate,rotate] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-2 hover:-rotate-6 active:translate-y-0"
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
          onKeyDown={(e) => {
            if (e.key === "Escape") toggle(false);
          }}
          className="slip slip-plain absolute top-0 right-0 z-20 w-[64%] -rotate-2 animate-unfold px-3 py-4 text-center sm:top-[2%] sm:right-auto sm:left-[10%] sm:w-[min(18rem,84%)] sm:p-6"
        >
          <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-14 -translate-x-1/2 rotate-2 rounded-sm bg-gold-200/90 shadow-sm" />
          <p ref={resultRef} tabIndex={-1} className="text-sm text-ink-700">
            The elves named you
            <HandName className="block text-[1.75rem] leading-tight font-bold text-berry-700 sm:text-[2rem]">{alias}</HandName>
          </p>
          <p className="mt-1 text-sm text-ink-700 [text-wrap:balance]">Sign your messages with it. Who you’re buying for stays sealed.</p>
          <p className="mt-1 text-xs text-ink-500">An example draw.</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3">
            <a
              href="#reveal-title"
              className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-bold text-pine-700 underline decoration-gold-500 underline-offset-4 hover:text-pine-900"
            >
              See the sealed card
            </a>
            <button
              type="button"
              onClick={() => toggle(false)}
              className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-bold text-pine-700 underline decoration-gold-500 underline-offset-4 hover:text-pine-900"
            >
              Put it back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A different example alias from last time. Decorative only, so no fairness or secrecy rides on it. */
function pickAlias(aliases: readonly string[], previous: string): string {
  const others = aliases.filter((a) => a !== previous);
  const pool = others.length ? others : aliases;
  return pool[crypto.getRandomValues(new Uint32Array(1))[0] % pool.length];
}
