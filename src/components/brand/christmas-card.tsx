"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Holly, Sparkle, Star, lineProps } from "./motifs";

/**
 * OWNER: design agent. The Christmas-card reveal: a sealed envelope; pressing the wax seal lifts
 * the flap, the card rises out and settles in front with a small gold sparkle.
 *
 * Privacy: until opened, the card's contents are `inert` and hidden from assistive tech, so nothing
 * leaks before the person chooses to look. Reduced motion: the global rule collapses every duration,
 * so the open state appears instantly.
 */
export function ChristmasCardReveal({
  recipientName,
  alias,
  label,
  children,
  defaultOpen = false,
  onOpen,
  className,
}: {
  /** The recipient's display name, written by hand on the card. */
  recipientName: string;
  /** The viewer's own Santa alias, e.g. "Dasher". */
  alias: string;
  /** Small tag above the envelope, e.g. "Example card". */
  label?: string;
  /** Extra content at the bottom of the card (e.g. a link to the wishlist). */
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const headingRef = React.useRef<HTMLParagraphElement>(null);
  const sealRef = React.useRef<HTMLButtonElement>(null);
  const headingId = React.useId();

  function handleOpen() {
    setOpen(true);
    onOpen?.();
    // Move focus to the card once it is on screen so screen readers announce it.
    window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 50);
  }

  function handleReseal() {
    setOpen(false);
    window.setTimeout(() => sealRef.current?.focus({ preventScroll: true }), 50);
  }

  return (
    <div className={cn("relative mx-auto w-full max-w-[22rem] pt-[36%]", className)} data-open={open || undefined}>
      {/* Reserved space above the envelope: the card rises into it. */}
      {!open && (
        <p className="pointer-events-none absolute inset-x-0 top-[21%] text-center font-bold text-current">Psst… press the seal</p>
      )}

      <div className="relative aspect-[4/3] [perspective:1000px]">
        {/* envelope back */}
        <div className="absolute inset-0 rounded-md bg-cream-300 shadow-[var(--shadow-lifted)]" />

        {/* the card */}
        <div
          role="group"
          aria-labelledby={headingId}
          inert={!open}
          aria-hidden={!open}
          className={cn(
            "absolute inset-x-[6%] bottom-[4%] h-[92%] rounded-md bg-cream-50 p-[5%] text-center text-ink-900 shadow-[var(--shadow-paper)]",
            open ? "z-30 animate-[card-out_1100ms_var(--ease-out-expo)_200ms_both]" : "z-10",
          )}
        >
          <div className="flex h-full flex-col items-center justify-center rounded-sm border-2 border-double border-pine-700/40 px-3 py-2">
            <Holly className="h-6" />
            <p ref={headingRef} id={headingId} tabIndex={-1} className="mt-1 text-sm text-ink-700 outline-none">
              You’re the Secret Santa for
            </p>
            <p className="font-hand text-[clamp(1.75rem,8vw,2.25rem)] leading-tight font-bold text-berry-700">{recipientName}</p>
            <p className="mt-1 text-xs text-ink-500">
              Signed with your secret alias: <span className="font-display text-sm font-bold text-pine-800">{alias}</span>
            </p>
            {children ? <div className="mt-2 text-sm">{children}</div> : null}
          </div>
        </div>

        {/* envelope front pocket */}
        <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-20 size-full" aria-hidden>
          <path d="M0 300V8l200 150L400 8v292z" fill="#f8f0df" {...lineProps} />
          <path d="M0 300l170-130M400 300L230 170" fill="none" stroke="#e3d5b8" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>

        {/* flap */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[56%] origin-top transition-[transform,z-index] duration-500 ease-[var(--ease-out-expo)] [transform-style:preserve-3d]",
            open ? "z-0 [transform:rotateX(180deg)] [transition-delay:0ms,250ms]" : "z-20",
          )}
          aria-hidden
        >
          <svg viewBox="0 0 400 168" preserveAspectRatio="none" className="size-full">
            <path d="M0 0h400L216 160a24 24 0 0 1-32 0z" fill="#efe2c6" {...lineProps} />
          </svg>
        </div>

        {/* wax seal */}
        {!open && (
          <button
            ref={sealRef}
            type="button"
            onClick={handleOpen}
            aria-label={label ? `Open the ${label.toLowerCase()}` : "Open your card"}
            className="group absolute top-[56%] left-1/2 z-30 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-berry-600 text-gold-400 shadow-[0_2px_0_#6f1f22,0_8px_16px_-6px_rgb(11_42_30/0.5)] ring-4 ring-berry-700/40 transition-transform duration-300 ease-[var(--ease-out-quint)] hover:scale-110 hover:-rotate-6 active:scale-95"
          >
            <Star className="size-7 transition-transform duration-500 group-hover:rotate-[72deg]" />
          </button>
        )}

        {/* celebration */}
        {open && (
          <div className="pointer-events-none absolute inset-0 z-40" aria-hidden>
            {[
              "left-[2%] top-[-28%] size-5",
              "right-[4%] top-[-36%] size-4",
              "left-[18%] top-[-46%] size-3",
              "right-[20%] top-[-10%] size-3",
            ].map((pos, i) => (
              <Sparkle
                key={pos}
                className={cn("absolute text-gold-400 opacity-0 animate-[sparkle_1600ms_var(--ease-out-expo)_both]", pos)}
                style={{ animationDelay: `${900 + i * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* An example card stays labelled as one, and can be sealed again to replay. */}
      {label ? (
        <p className="mt-4 flex min-h-11 items-center justify-center gap-3 text-sm text-pine-200">
          <span className="font-bold tracking-wide uppercase">{label}</span>
          {open ? (
            <button
              type="button"
              onClick={handleReseal}
              className="inline-flex min-h-11 items-center rounded-lg px-1 font-bold text-cream-50 underline decoration-gold-400 underline-offset-4"
            >
              Seal it again
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
