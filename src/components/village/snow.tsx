"use client";

import { Pause, Play } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const KEY = "santaelf:snow-paused";
const EVENT = "santaelf:snow";

function readPaused() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The remembered "Pause snow" preference (per device, localStorage). */
export function useSnowPaused() {
  return React.useSyncExternalStore(subscribe, readPaused, () => false);
}

function setPaused(paused: boolean) {
  try {
    window.localStorage.setItem(KEY, paused ? "1" : "0");
  } catch {
    /* private mode: the toggle still works for this page view */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** "Pause snow" / "Let it snow". A real toggle button, remembered locally. */
export function SnowToggle({ className }: { className?: string }) {
  const paused = useSnowPaused();
  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-midnight transition-colors duration-200 hover:bg-snow/70 motion-reduce:hidden",
        className,
      )}
    >
      {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
      {paused ? "Let it snow" : "Pause snow"}
    </button>
  );
}

/** Fixed flake positions so server and client render the same markup. */
const FLAKES = [
  { l: 4, s: 6, d: 16, dl: -2, dr: 18 },
  { l: 13, s: 4, d: 21, dl: -9, dr: -14 },
  { l: 22, s: 7, d: 18, dl: -14, dr: 22 },
  { l: 31, s: 5, d: 24, dl: -5, dr: 12 },
  { l: 43, s: 4, d: 19, dl: -16, dr: -20 },
  { l: 52, s: 6, d: 22, dl: -3, dr: 26 },
  { l: 61, s: 5, d: 17, dl: -11, dr: -10 },
  { l: 70, s: 7, d: 23, dl: -7, dr: 16 },
  { l: 79, s: 4, d: 20, dl: -18, dr: -18 },
  { l: 88, s: 6, d: 18, dl: -4, dr: 20 },
  { l: 95, s: 5, d: 25, dl: -12, dr: -12 },
];

/**
 * Sparse, slow snow over an outdoor sky band. Decorative (aria-hidden, no pointer events).
 * Place it in a positioned box that excludes text and controls. Paused offscreen and by the toggle;
 * hidden under prefers-reduced-motion (globals.css).
 */
export function SnowLayer({ className, density = 1 }: { className?: string; density?: number }) {
  const paused = useSnowPaused();
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const flakes = FLAKES.filter((_, i) => density >= 1 || i % 2 === 0);
  return (
    <div
      ref={ref}
      aria-hidden
      data-paused={paused || !visible}
      className={cn("snow-layer pointer-events-none absolute overflow-hidden", className)}
    >
      {!paused &&
        flakes.map((f) => (
          <span
            key={f.l}
            className="snow-flake"
            style={
              {
                left: `${f.l}%`,
                width: f.s,
                height: f.s,
                "--dur": `${f.d}s`,
                "--delay": `${f.dl}s`,
                "--drift": `${f.dr}px`,
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  );
}
