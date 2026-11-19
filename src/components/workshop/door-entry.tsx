"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ArtImage, artSrcSet } from "./art";

/*
 * The Workshop entrance (SPEC motion score, "Start a group"). Clicking a Workshop entrance navigates
 * immediately and marks the arrival as deliberate; only that arrival plays the doorway. Direct visits,
 * reloads, Back and reduced motion open straight at the desk. Nothing here ever creates a group.
 */

const KEY = "santaelf:door";
const FRESH_MS = 15_000;
const CAMERA = "cubic-bezier(0.45, 0, 0.15, 1)";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function markDeliberateEntry() {
  try {
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage blocked: the desk simply opens directly */
  }
}

/** Reads and clears the arrival mark. True only once, right after a Workshop entrance was used. */
function consumeDeliberateEntry(): boolean {
  try {
    const at = Number(window.sessionStorage.getItem(KEY));
    window.sessionStorage.removeItem(KEY);
    return Number.isFinite(at) && Date.now() - at < FRESH_MS;
  } catch {
    return false;
  }
}

/** A real link to /new that also marks the arrival as a deliberate entry through the door. */
export function WorkshopEntranceLink({ className, children, ...props }: Omit<React.ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href="/new"
      {...props}
      // Fetch the threshold painting at the first sign of intent (hover, focus, touch), so the doorway
      // never opens on an empty frame, without every page that shows this link downloading it.
      onPointerEnter={(e) => {
        props.onPointerEnter?.(e);
        warmThreshold();
      }}
      onFocus={(e) => {
        props.onFocus?.(e);
        warmThreshold();
      }}
      onTouchStart={(e) => {
        props.onTouchStart?.(e);
        warmThreshold();
      }}
      onClick={(e) => {
        props.onClick?.(e);
        warmThreshold();
        if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) markDeliberateEntry();
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

let warmed = false;
/** Starts the threshold painting downloading into the HTTP cache once (an off-DOM image, not a <link rel=preload>). */
function warmThreshold() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const img = new Image();
  img.sizes = "(min-width: 1100px) 1100px, 100vw";
  img.srcset = artSrcSet("workshop-threshold");
  img.src = "/art/workshop-threshold-1024.webp";
}

/**
 * The persimmon door over the threshold painting. Layers (paint order): room behind the opening,
 * warm light spill, door panel with brass knob. The panel covers the painted opening at
 * left 36%, top 27.8%, 28% × 63%, hinged on the left jamb, knob at 90% across.
 */
export function Doorway({
  className,
  doorRef,
  knobRef,
  lightRef,
  cameraRef,
  priority,
}: {
  className?: string;
  doorRef?: React.Ref<HTMLDivElement>;
  knobRef?: React.Ref<HTMLSpanElement>;
  lightRef?: React.Ref<HTMLDivElement>;
  cameraRef?: React.Ref<HTMLDivElement>;
  priority?: boolean;
}) {
  return (
    <div ref={cameraRef} aria-hidden className={cn("relative aspect-[1672/941] w-full origin-[50%_60%]", className)}>
      <ArtImage name="workshop-threshold" priority={priority} sizes="(min-width: 1100px) 1100px, 100vw" className="absolute inset-0 size-full" />
      <div
        ref={lightRef}
        className="absolute top-[27.8%] left-[36%] h-[63%] w-[28%] bg-[radial-gradient(ellipse_at_50%_60%,rgb(255_214_140/0.85),rgb(255_170_80/0.35)_55%,transparent_80%)] opacity-0 mix-blend-screen"
      />
      <div className="absolute top-[27.8%] left-[36%] h-[63%] w-[28%] [perspective:900px]">
        <div
          ref={doorRef}
          className="absolute inset-0 origin-left rounded-[2px] border-[3px] border-[#873824] bg-[repeating-linear-gradient(90deg,transparent_0_19%,#88382266_19.4%_20%),linear-gradient(105deg,#df7950,#c45a39_52%,#a7462f)] shadow-[inset_2px_0_3px_#ec9a68,inset_-4px_0_6px_#893a29,inset_0_0_14px_#793420] [backface-visibility:hidden]"
        >
          {/* raised panels */}
          <i className="absolute inset-x-[14%] top-[8%] h-[34%] rounded-[3px] border border-[#a7462f] shadow-[inset_1px_1px_0_#ec9a6855,inset_-1px_-1px_0_#7a2f1f55]" />
          <i className="absolute inset-x-[14%] top-[50%] h-[40%] rounded-[3px] border border-[#a7462f] shadow-[inset_1px_1px_0_#ec9a6855,inset_-1px_-1px_0_#7a2f1f55]" />
          {/* brass knob + latch plate */}
          <span
            ref={knobRef}
            className="absolute top-[52%] right-[6%] block aspect-square w-[9%] origin-[30%_50%] rounded-full bg-[radial-gradient(at_30%_24%,#fff1a7,#cc913d_62%,#724316)] shadow-[1px_2px_3px_rgb(60_20_10/0.6)]"
          />
        </div>
      </div>
    </div>
  );
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Plays the doorway once over the desk when the visitor came through a Workshop entrance.
 * 0–300 ms the latch turns 12° and warm light appears; 300–1000 ms the door swings 95° inward while
 * the camera moves forward (8% desktop, 3% phone); then the overlay lifts and `onOpened` lets the
 * desk slide the invitation in and focus the first field. "Skip to form" ends it at once.
 */
export function DoorArrival({ onOpened }: { onOpened: (how: "played" | "skipped" | "direct") => void }) {
  const [state, setState] = React.useState<"checking" | "playing" | "done">("checking");
  const doorRef = React.useRef<HTMLDivElement>(null);
  const knobRef = React.useRef<HTMLSpanElement>(null);
  const lightRef = React.useRef<HTMLDivElement>(null);
  const cameraRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const skipRef = React.useRef<HTMLButtonElement>(null);
  const finished = React.useRef(false);
  const opened = React.useRef(onOpened);
  React.useEffect(() => {
    opened.current = onOpened;
  });

  /** Tells the desk the door is open (once). The overlay itself may still be fading out. */
  const notify = React.useCallback((how: "played" | "skipped" | "direct") => {
    if (finished.current) return;
    finished.current = true;
    opened.current(how);
  }, []);
  const finish = React.useCallback(
    (how: "played" | "skipped" | "direct") => {
      notify(how);
      setState("done");
    },
    [notify],
  );

  // Decide once, on arrival: play only for a fresh deliberate entry with motion allowed. The decision
  // is kept in a ref because development re-runs effects, and the arrival mark is single-use.
  const decided = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (decided.current === null) decided.current = consumeDeliberateEntry() && !prefersReducedMotion();
    if (!decided.current) {
      finish("direct");
      return;
    }
    setState("playing");
  }, [finish]);

  React.useEffect(() => {
    if (state !== "playing") return;
    skipRef.current?.focus({ preventScroll: true });
    const phone = window.matchMedia("(max-width: 640px)").matches;
    let cancelled = false;
    let anims: Animation[] = [];
    const timers: number[] = [];
    // Start once the painting is decoded (usually already fetched on hover/focus/touch), but never wait more than 350 ms.
    const img = rootRef.current?.querySelector("img");
    const ready = Promise.race([img?.decode?.().catch(() => undefined) ?? Promise.resolve(), new Promise((r) => window.setTimeout(r, 350))]);
    void ready.then(() => {
      if (cancelled) return;
      play();
    });
    function play() {
    anims = [
      knobRef.current?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(12deg)" }], { duration: 300, easing: EASE, fill: "forwards" }),
      lightRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: EASE, fill: "forwards" }),
      doorRef.current?.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(95deg)" }], {
        duration: 700,
        delay: 300,
        easing: CAMERA,
        fill: "forwards",
      }),
      cameraRef.current?.animate([{ transform: "scale(1)" }, { transform: `scale(${phone ? 1.03 : 1.08})` }], {
        duration: 1000,
        easing: CAMERA,
        fill: "forwards",
      }),
      // Linear overall, eased per segment: holds fully visible until 910 ms, then fades by 1300 ms.
      rootRef.current?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7, easing: EASE }, { opacity: 0 }], {
        duration: 1300,
        easing: "linear",
        fill: "forwards",
      }),
    ].filter(Boolean) as Animation[];
    // At 1000 ms the desk takes over (invitation slides in, field focused); the overlay fades until 1300 ms.
    timers.push(
      window.setTimeout(() => {
        if (rootRef.current) rootRef.current.style.pointerEvents = "none";
        notify("played");
      }, 1000),
      window.setTimeout(() => setState("done"), 1300),
    );
    }
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      anims.forEach((a) => a.cancel());
    };
  }, [state, notify]);

  if (state !== "playing") return null;
  return (
    <div ref={rootRef} className="on-dark fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-oxblood">
      <p role="status" className="sr-only">
        Opening the Workshop door. Your form is ready below.
      </p>
      <Doorway priority cameraRef={cameraRef} doorRef={doorRef} knobRef={knobRef} lightRef={lightRef} className="w-[175vw] max-w-none shrink-0 sm:w-full sm:max-w-[min(100vw,1100px,160vh)]" />
      <button
        ref={skipRef}
        type="button"
        onClick={() => finish("skipped")}
        className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 inline-flex min-h-12 -translate-x-1/2 items-center rounded-full bg-buttercream px-6 font-bold text-oxblood shadow-[0_10px_20px_-12px_rgb(0_0_0/0.7)]"
      >
        Skip to form
      </button>
    </div>
  );
}
