"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { C, line } from "./art";

export interface EnvelopeLetter {
  recipientName: string;
  alias: string;
}

type Phase = "sealed" | "lifting" | "sliding" | "open";

const FLAP_MS = 220;
const LETTER_MS = 360;
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const FLAP_CLOSED = "perspective(900px) rotateX(0deg)";
const FLAP_OPEN = "perspective(900px) rotateX(180deg)";
/** Where the letter's bottom edge rests inside the pocket, as a share of the envelope height. */
const LETTER_FOOT = 0.1;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The personal envelope (REDESIGN_BRIEF.md §4). The seal is the button. On press the flap lifts from
 * its fold (~220ms), then the letter slides up out of the pocket (~360ms) once the authorized data is
 * in. Until then the letter is not in the DOM, so nothing can leak. "Skip animation", slow and failed
 * requests, reduced motion and focus on the result heading are all handled here. A returning
 * participant passes `initial` and reads the open letter immediately. Replaying reuses the same data.
 */
export function Envelope({
  participantName,
  initial,
  requestLetter,
  errorMessage,
  children,
  className,
}: {
  participantName: string;
  initial: EnvelopeLetter | null;
  /** Asks the server for this participant's own letter. Called once. */
  requestLetter: () => Promise<EnvelopeLetter>;
  errorMessage?: (err: unknown) => string;
  /** What follows an opened letter (the recipient's wishlist, the next actions). */
  children?: (letter: EnvelopeLetter) => React.ReactNode;
  className?: string;
}) {
  const [letter, setLetter] = React.useState<EnvelopeLetter | null>(initial);
  const [phase, setPhase] = React.useState<Phase>(initial ? "open" : "sealed");
  const [slow, setSlow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [room, setRoom] = React.useState(0);

  const envRef = React.useRef<HTMLDivElement>(null);
  const flapRef = React.useRef<HTMLDivElement>(null);
  const letterRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const sealRef = React.useRef<HTMLButtonElement>(null);
  const skipRef = React.useRef<HTMLButtonElement>(null);
  const skipped = React.useRef(false);
  const focusResult = React.useRef(false);

  /** How far the open letter stands above the envelope, so the page reserves room for it. */
  const measure = React.useCallback(() => {
    const env = envRef.current;
    const sheet = letterRef.current;
    const envH = env?.offsetHeight ?? 0;
    if (!sheet) return { lift: 0, envH };
    const lift = Math.max(0, sheet.offsetHeight - envH * (1 - LETTER_FOOT));
    return { lift, envH, sheetH: sheet.offsetHeight };
  }, []);

  // Keep the reserved room right when the letter is open (fonts load, the window resizes).
  React.useLayoutEffect(() => {
    if (phase === "sealed") return;
    // The lifted flap stands 62% of the envelope's height above it; the letter may stand taller.
    const update = () => {
      const { lift, envH } = measure();
      setRoom(Math.max(envH * 0.62, lift) + 20);
    };
    update();
    const ro = new ResizeObserver(update);
    if (letterRef.current) ro.observe(letterRef.current);
    if (envRef.current) ro.observe(envRef.current);
    return () => ro.disconnect();
  }, [phase, measure]);

  // The letter slides up out of the pocket.
  React.useLayoutEffect(() => {
    if (phase !== "sliding") return;
    const sheet = letterRef.current;
    const { lift, envH } = measure();
    if (!sheet) return;
    // Start with the letter's top just below the envelope's top edge, hidden by the pocket.
    const start = lift + envH * 0.3;
    const anim = sheet.animate([{ transform: `translateY(${start}px)` }, { transform: "translateY(0)" }], {
      duration: LETTER_MS,
      easing: EXPO,
    });
    anim.onfinish = () => {
      focusResult.current = true;
      setPhase("open");
    };
    return () => anim.cancel();
  }, [phase, measure]);

  React.useEffect(() => {
    if (phase === "lifting" || phase === "sliding") skipRef.current?.focus();
    if (phase === "open" && focusResult.current) {
      focusResult.current = false;
      headingRef.current?.focus();
    }
  }, [phase]);

  function animateFlap(opening: boolean) {
    const el = flapRef.current;
    if (!el || reducedMotion() || skipped.current) return Promise.resolve();
    const frames = opening
      ? [
          { transform: FLAP_CLOSED, zIndex: 40 },
          { transform: FLAP_OPEN, zIndex: 5 },
        ]
      : [
          { transform: FLAP_OPEN, zIndex: 5 },
          { transform: FLAP_CLOSED, zIndex: 40 },
        ];
    const anim = el.animate(frames, { duration: FLAP_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    return anim.finished.then(
      () => undefined,
      () => undefined,
    );
  }

  async function open() {
    setError(null);
    skipped.current = false;
    setPhase("lifting");
    setAnnouncement("Opening your envelope…");

    const result = requestLetter().then(
      (value) => ({ ok: true as const, value }),
      (err: unknown) => ({ ok: false as const, err }),
    );
    const slowTimer = window.setTimeout(() => setSlow(true), FLAP_MS + 400);
    await animateFlap(true);
    const r = await result;
    window.clearTimeout(slowTimer);
    setSlow(false);

    if (!r.ok) {
      setPhase("sealed");
      void animateFlap(false);
      setError(errorMessage?.(r.err) ?? "Your envelope didn’t open. Check your connection and try again.");
      setAnnouncement("");
      window.setTimeout(() => sealRef.current?.focus(), 30);
      return;
    }
    setLetter(r.value);
    setAnnouncement(`You’re the Secret Santa for ${r.value.recipientName}.`);
    if (reducedMotion() || skipped.current) {
      focusResult.current = true;
      setPhase("open");
    } else {
      setPhase("sliding");
    }
  }

  function skip() {
    skipped.current = true;
    flapRef.current?.getAnimations().forEach((a) => a.finish());
    letterRef.current?.getAnimations().forEach((a) => a.finish());
  }

  /** Replays the motion over the letter already on screen. Never asks for, or draws, a name again. */
  function replay() {
    if (!letter) return;
    skipped.current = false;
    if (reducedMotion()) return;
    setPhase("lifting");
    void animateFlap(true).then(() => setPhase("sliding"));
  }

  const sealed = phase === "sealed";
  const animating = phase === "lifting" || phase === "sliding";
  const showLetter = !!letter && (phase === "sliding" || phase === "open");

  return (
    <div className={cn("relative", className)}>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div
        className={cn(
          "relative mx-auto w-full max-w-[25rem]",
          animating && "motion-safe:transition-[padding] motion-safe:duration-300 motion-safe:ease-[var(--ease-out-expo)]",
        )}
        style={{ paddingTop: sealed ? 0 : room }}
      >
        <div
          ref={envRef}
          className="relative aspect-[7/5] w-full [clip-path:inset(-400%_-12%_0_-12%)]"
        >
          {/* inside back, lined in evergreen */}
          <div className="absolute inset-0 rounded-[14px] border-[2.5px] border-midnight bg-evergreen">
            <svg viewBox="0 0 700 500" className="size-full" aria-hidden focusable="false">
              {Array.from({ length: 9 }).map((_, i) => (
                <circle key={i} cx={60 + i * 72} cy={60 + (i % 2) * 40} r={6} fill={C.golden} opacity={0.6} />
              ))}
            </svg>
          </div>

          {/* the flap: paper outside, lining inside; hinged on the top fold */}
          <div
            ref={flapRef}
            aria-hidden
            className="absolute inset-x-0 top-0 h-[62%] origin-top [transform-style:preserve-3d]"
            style={{ transform: sealed ? FLAP_CLOSED : FLAP_OPEN, zIndex: sealed ? 40 : 5 }}
          >
            <svg viewBox="0 0 700 310" preserveAspectRatio="none" className="absolute inset-0 size-full [backface-visibility:hidden]">
              <path d="M4 4 H696 L380 292 Q350 316 320 292 Z" fill={C.paper} {...line} />
              <path d="M40 18 H660" stroke={C.paperDeep} strokeWidth={6} />
            </svg>
            <svg
              viewBox="0 0 700 310"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full [backface-visibility:hidden] [transform:rotateX(180deg)]"
            >
              <path d="M4 4 H696 L380 292 Q350 316 320 292 Z" fill={C.evergreenSoft} {...line} />
            </svg>
          </div>

          {/* the letter: exists only once the authorized answer is in */}
          {showLetter && letter && (
            <div
              ref={letterRef}
              // The foot (bottom padding) stays tucked in the pocket: 60% of the width ≈ 0.85 of the envelope's height.
              className="absolute inset-x-[6%] z-20 rounded-lg border-[2.5px] border-midnight bg-paper px-5 pt-5 pb-[60%] text-center text-midnight sm:px-7 sm:pt-6"
              style={{ bottom: `${LETTER_FOOT * 100}%` }}
            >
              <h2 ref={headingRef} tabIndex={-1} className="outline-none">
                <span className="block text-[0.9375rem] font-bold text-midnight-soft">You’re the Secret Santa for</span>
                <span className="mt-1 block font-hand text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.05] font-bold break-words text-cranberry">
                  {letter.recipientName}
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-[26ch] border-t-2 border-dashed border-snow-shadow pt-3 text-[0.9375rem] leading-snug text-midnight-soft">
                Your messages to them are signed{" "}
                <span className="font-hand text-xl font-bold whitespace-nowrap text-evergreen">{letter.alias}</span>
              </p>
            </div>
          )}

          {/* the pocket front, with its V notch at the top */}
          <svg viewBox="0 0 700 500" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-30 size-full" aria-hidden focusable="false">
            <path d="M4 10 L350 300 L696 10 V488 Q696 496 688 496 H12 Q4 496 4 488 Z" fill={C.paper} {...line} />
            <path d="M8 492 L300 262 M692 492 L400 262" fill="none" stroke={C.paperDeep} strokeWidth={5} />
          </svg>

          {/* Addressed to the participant (their own name). Sealed, it sits on the flap's upper left, clear of the
              seal and its label; opened, it moves down to the pocket. Plus a postmark. */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute font-hand leading-tight font-bold break-words text-midnight",
              // Sealed: centred high on the flap, where the paper is widest and no fold line crosses it.
              sealed
                ? "top-[8%] left-1/2 z-[45] max-w-[54%] -translate-x-1/2 text-center text-[clamp(1rem,3.8vw,1.3rem)]"
                : "bottom-[9%] left-[7%] z-30 max-w-[46%] text-[clamp(1.05rem,4.2vw,1.4rem)]",
            )}
          >
            For {participantName}
          </span>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[9%] z-30 flex items-end justify-end px-[7%]">
            <svg viewBox="0 0 60 60" className="size-12 -rotate-12 sm:size-14">
              <circle cx={30} cy={30} r={25} fill="none" stroke={C.snowShadow} strokeWidth={3} />
              <circle cx={30} cy={30} r={18} fill="none" stroke={C.snowShadow} strokeWidth={1.5} />
              <path d="M30 18l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill={C.snowShadow} />
            </svg>
          </div>

          {/* the wax seal is the button */}
          {sealed && (
            <button
              ref={sealRef}
              type="button"
              onClick={open}
              className="group absolute top-[62%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl p-1 focus-visible:outline-offset-4"
            >
              <span
                aria-hidden
                className="grid size-[4.5rem] place-items-center rounded-full border-[2.5px] border-midnight bg-cranberry shadow-[3px_4px_0_rgb(23_45_56/0.25)] transition-transform duration-200 ease-[var(--ease-out-quint)] group-hover:-translate-y-0.5 group-active:translate-y-0"
              >
                <svg viewBox="0 0 40 40" className="size-9">
                  <circle cx={20} cy={20} r={15} fill="none" stroke={C.cranberryDeep} strokeWidth={2.5} />
                  <path d="M20 9l3.2 7 7.6.7-5.8 5 1.8 7.4L20 25.3l-6.8 3.8 1.8-7.4-5.8-5 7.6-.7z" fill={C.golden} stroke={C.cranberryDeep} strokeWidth={1.2} strokeLinejoin="round" />
                </svg>
              </span>
              <span className="rounded-full bg-midnight px-3 py-1 text-sm font-bold whitespace-nowrap text-paper">Open my envelope</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex min-h-11 flex-col items-center gap-3 text-center">
        {sealed && !error && <p className="text-[0.9375rem] text-midnight-soft">Open it somewhere nobody’s peeking.</p>}
        {animating && (
          <button
            ref={skipRef}
            type="button"
            onClick={skip}
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-evergreen underline decoration-2 underline-offset-4 hover:bg-paper"
          >
            Skip animation
          </button>
        )}
        {slow && (
          <p className="inline-flex items-center gap-2 text-[0.9375rem] text-midnight-soft">
            <Spinner className="size-4" /> The elves are fetching your letter…
          </p>
        )}
        {phase === "open" && (
          <button
            type="button"
            onClick={replay}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-evergreen hover:bg-paper motion-reduce:hidden"
          >
            <RotateCcw className="size-4" aria-hidden /> Open it again
          </button>
        )}
      </div>

      {error && (
        <Alert tone="error" title="Your envelope didn’t open" className="mx-auto mt-4 max-w-md text-left">
          {error}
        </Alert>
      )}

      {phase === "open" && letter && children?.(letter)}
    </div>
  );
}
