"use client";

import { MessageCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Sparkle } from "@/components/brand/motifs";
import { HandName, PaperSlip } from "@/components/brand/paper-slip";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import type { RecipientViewDTO } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { CARD_SIZE, CardBack, CardFront } from "./cards";
import { RecipientProfile } from "./recipient-profile";

type Phase = "intro" | "shuffling" | "flipping" | "result";

/** Resting fan of the deck (deg, px). Fixed so server and client render the same. */
const FAN = [
  { r: -9, x: -14, y: 6 },
  { r: -4.5, x: -7, y: 3 },
  { r: 0, x: 0, y: 0 },
  { r: 4, x: 7, y: 2 },
  { r: 8.5, x: 14, y: 5 },
];
const rest = (i: number) => `translate(${FAN[i].x}px, ${FAN[i].y}px) rotate(${FAN[i].r}deg)`;

const MIN_SHUFFLE_MS = 2600;
const STEP_MS = 230;
const FLIP_MS = 1100;
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * SantaElf's signature moment. The server already holds the assignment; pressing the button only
 * asks for it. While the request runs, a deck of blank card backs shuffles (no names anywhere in the
 * DOM); when the answer is in, one card flips to show the real name, then the wishlist follows.
 * Reduced motion and "Skip animation" go straight to the result.
 */
export function RevealExperience({
  participantId,
  participantName,
  initialView,
}: {
  participantId: string;
  participantName: string;
  initialView: RecipientViewDTO | null;
}) {
  const [view, setView] = React.useState<RecipientViewDTO | null>(initialView);
  const [phase, setPhase] = React.useState<Phase>(initialView ? "result" : "intro");
  const [celebrate, setCelebrate] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const flipRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const skipRef = React.useRef<() => void>(() => {});
  const focusOnResult = React.useRef(false);
  const controlsRef = React.useRef<HTMLDivElement>(null);

  // Shuffle loop: the bottom card slides out and is tucked back on top, over and over.
  React.useEffect(() => {
    if (phase !== "shuffling") return;
    const els = cardRefs.current;
    const order = [0, 1, 2, 3, 4];
    let n = 0;
    const timers: number[] = [];
    const tick = () => {
      const idx = order.shift()!;
      order.push(idx);
      const el = els[idx];
      if (el) {
        const dir = n % 2 === 0 ? 1 : -1;
        el.animate(
          [
            { transform: rest(idx) },
            { transform: `translate(${dir * 58}%, -7%) rotate(${dir * 16}deg)`, offset: 0.45 },
            { transform: rest(idx) },
          ],
          { duration: 480, easing: EXPO },
        );
        timers.push(window.setTimeout(() => order.forEach((id, z) => els[id]?.style.setProperty("z-index", String(z + 1))), 210));
      }
      n++;
    };
    tick();
    const interval = window.setInterval(tick, STEP_MS);
    return () => {
      window.clearInterval(interval);
      timers.forEach(window.clearTimeout);
      els.forEach((el) => el?.getAnimations().forEach((a) => a.cancel()));
    };
  }, [phase]);

  // The chosen card lifts, turns over and settles.
  React.useEffect(() => {
    if (phase !== "flipping" || !flipRef.current) return;
    const anim = flipRef.current.animate(
      [
        { transform: "translateY(0) rotateY(0deg) scale(1)" },
        { transform: "translateY(-7%) rotateY(0deg) scale(1.06)", offset: 0.28 },
        { transform: "translateY(-3%) rotateY(180deg) scale(1.05)", offset: 0.78 },
        { transform: "translateY(0) rotateY(180deg) scale(1)" },
      ],
      { duration: FLIP_MS, easing: EXPO, fill: "forwards" },
    );
    return () => anim.cancel();
  }, [phase]);

  React.useEffect(() => {
    // Keep keyboard focus on the control that replaced the one just pressed.
    if (phase === "shuffling") controlsRef.current?.querySelector("button")?.focus();
    if (phase === "result" && focusOnResult.current) {
      focusOnResult.current = false;
      headingRef.current?.focus({ preventScroll: false });
    }
  }, [phase]);

  function finish(v: RecipientViewDTO, withCelebration: boolean) {
    focusOnResult.current = true;
    setCelebrate(withCelebration);
    setPhase("result");
    setAnnouncement(`You’re the Secret Santa for ${v.recipient.name}.`);
  }

  async function fetchView(): Promise<RecipientViewDTO | null> {
    try {
      return await apiFetch<RecipientViewDTO>(`/api/p/${participantId}/reveal`, { method: "POST" });
    } catch (err) {
      const e = err instanceof ApiRequestError ? err : null;
      setError(
        e?.code === "NOT_DRAWN"
          ? "The elves haven’t drawn names yet. You’ll get an email as soon as they do."
          : e?.code === "UNAUTHORIZED"
            ? "This private link has expired. Ask for a new one from the “Lost your link?” page."
            : (e?.message ?? "Something went wrong. Please try again."),
      );
      return null;
    }
  }

  async function start(replay: boolean) {
    setError(null);
    setBusy(true);
    setAnnouncement("");
    const known = replay ? view : null;

    if (prefersReducedMotion()) {
      const v = known ?? (await fetchView());
      setBusy(false);
      if (!v) return;
      setView(v);
      finish(v, false);
      return;
    }

    let skipped = false;
    const skip = new Promise<void>((resolve) => {
      skipRef.current = () => {
        skipped = true;
        resolve();
      };
    });
    setPhase("shuffling");
    setAnnouncement("The elves are shuffling the cards…");

    const minTime = new Promise<void>((r) => window.setTimeout(r, MIN_SHUFFLE_MS));
    const v = await (known ? Promise.resolve(known) : fetchView());
    if (!v) {
      setBusy(false);
      setPhase(replay ? "result" : "intro");
      window.setTimeout(() => controlsRef.current?.querySelector("button")?.focus(), 30);
      return;
    }
    await Promise.race([minTime, skip]);
    setView(v);
    setBusy(false);
    if (skipped) return finish(v, false);

    setPhase("flipping");
    await Promise.race([new Promise<void>((r) => window.setTimeout(r, FLIP_MS + 120)), skip]);
    finish(v, !skipped);
  }

  const animating = phase === "shuffling" || phase === "flipping";

  if (phase === "result" && view) {
    const name = view.recipient.name;
    return (
      <>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <section className="felt on-pine relative overflow-hidden rounded-[var(--radius-card)] px-4 pt-8 pb-8 text-cream-50 sm:px-8 sm:pt-10">
          <div className="relative mx-auto w-fit">
            <CardFront recipientName={name} alias={view.myAlias} headingRef={headingRef} className={cn(CARD_SIZE, "rotate-[-2deg]")} />
            {celebrate &&
              ["-left-5 top-4 size-6", "-right-6 top-10 size-5", "left-8 -top-4 size-4", "-right-3 bottom-10 size-4"].map((pos, i) => (
                <Sparkle
                  key={pos}
                  className={cn("pointer-events-none absolute text-gold-400 opacity-0 animate-[sparkle_1600ms_var(--ease-out-expo)_both]", pos)}
                  style={{ animationDelay: `${i * 130}ms` }}
                />
              ))}
          </div>

          <PaperSlip tilt={1.2} className="mx-auto mt-8 max-w-md p-5 text-center sm:p-6">
            <p className="text-ink-700">
              Your secret alias:{" "}
              <HandName className="text-2xl font-bold text-pine-900">{view.myAlias}</HandName>
            </p>
            <p className="mt-1 text-sm text-ink-700">
              This is the name <span className="font-bold text-ink-900">{name}</span> sees when you message them.
            </p>
          </PaperSlip>

          <div className="mt-6 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => start(true)} className="text-pine-200 hover:bg-pine-800 hover:text-cream-50">
              <RotateCcw aria-hidden /> Watch the shuffle again
            </Button>
          </div>
        </section>

        <div className={cn("mt-8", celebrate && "motion-safe:animate-rise")}>
          <RecipientProfile view={view} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/p/${participantId}/messages?thread=recipient`}>
                <MessageCircle aria-hidden /> Ask {name} an anonymous question
              </Link>
            </Button>
            <Link href={`/p/${participantId}`} className="inline-flex min-h-11 items-center justify-center px-2 font-bold text-pine-600 underline">
              Back to your page
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="felt on-pine relative overflow-hidden rounded-[var(--radius-card)] px-4 pt-8 pb-8 text-center text-cream-50 sm:px-8 sm:pt-10">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <h2 className="font-display text-[clamp(1.6rem,6vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em] [text-wrap:balance]">
        {animating ? "The elves are shuffling…" : `${participantName}, your card is in this deck`}
      </h2>
      <p className="mx-auto mt-2 max-w-[34ch] text-pine-200">
        {animating ? "One of these has your person on it." : "The elves already drew it. Turn it over when you’re somewhere nobody’s peeking."}
      </p>

      <div className={cn("relative mx-auto mt-8 mb-2 [perspective:1200px]", CARD_SIZE)}>
        {/* the deck: card backs only */}
        {FAN.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={cn("absolute inset-0 transition-opacity duration-300", phase === "flipping" && "opacity-0")}
            style={{ transform: rest(i), zIndex: i + 1 }}
          >
            <CardBack className="size-full" />
          </div>
        ))}
        {/* the chosen card: its face exists only once the server has answered */}
        {phase === "flipping" && view && (
          <div ref={flipRef} className="absolute inset-0 z-20 [transform-style:preserve-3d]">
            <CardBack className="absolute inset-0 [backface-visibility:hidden]" />
            <CardFront
              recipientName={view.recipient.name}
              alias={view.myAlias}
              className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]"
            />
          </div>
        )}
      </div>

      <div ref={controlsRef} className="mt-8 flex flex-col items-center gap-3">
        {animating ? (
          <Button variant="light" size="sm" onClick={() => skipRef.current()}>
            Skip animation
          </Button>
        ) : (
          <Button variant="festive" size="lg" onClick={() => start(false)} loading={busy} className="w-full sm:w-auto">
            Reveal My Person
          </Button>
        )}
      </div>
      {error && (
        <Alert tone="error" title="Your card didn’t open" className="mx-auto mt-6 max-w-md text-left">
          {error}
        </Alert>
      )}
    </section>
  );
}
