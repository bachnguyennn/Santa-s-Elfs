"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArtImage } from "./art";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
 * Elf placement in the plate's coordinate box (ROOMS.md): feet near 84% across, 61% down, pivot at
 * the boots. The elf art is 1312×1199 with its boots centred at ~45% across and ~97% down.
 */
const ELF_W = 16; // % of plate width
const ELF_H = ELF_W * (1199 / 1312) * (1672 / 941); // same size as % of plate height
const ELF_LEFT = 84 - 0.45 * ELF_W;
const ELF_TOP = 61 - 0.97 * ELF_H;

/*
 * The short gold ribbon from the parcel's painted band (right end, ~74% / 52%) to the elf's fists
 * (~81% / 49%), in the plate's 1672×941 space. Drawn along x and rotated onto that line, so the
 * tug can tighten it by squashing the sag, whatever the crop.
 */
const RIBBON_FROM = { x: 1232, y: 490 };
const RIBBON_TO = { x: 1362, y: 459 };
const RIBBON_LEN = Math.hypot(RIBBON_TO.x - RIBBON_FROM.x, RIBBON_TO.y - RIBBON_FROM.y);
const RIBBON_ANGLE = (Math.atan2(RIBBON_TO.y - RIBBON_FROM.y, RIBBON_TO.x - RIBBON_FROM.x) * 180) / Math.PI;

/**
 * Santa holds the ribbon while the elf pulls it taut around the teal parcel. One coordinate system
 * for the painted plate, the separate elf and the parcel button, so every crop keeps them aligned.
 * Tapping the parcel (optional, replayable): the elf tugs and the gold ribbon in its fists snaps taut,
 * sparks catch the bow, the elf tips back 5° and settles (180 + 160 + 280 ms). Purely decorative; the page's actions never depend on it.
 */
export function WorkshopScene({ className, children }: { className?: string; children?: React.ReactNode }) {
  const elfRef = React.useRef<HTMLImageElement>(null);
  const sparkRef = React.useRef<HTMLSpanElement>(null);
  const ribbonRef = React.useRef<SVGGElement>(null);
  const running = React.useRef<Animation[]>([]);

  function tug() {
    if (reduced()) return;
    running.current.forEach((a) => a.cancel());
    const elf = elfRef.current?.animate(
      [
        { transform: "rotate(0deg) translateX(0)", easing: EASE },
        { transform: "rotate(-2deg) translateX(1.5%)", offset: 0.29, easing: EASE }, // pull the ribbon taut, 180 ms
        { transform: "rotate(-5deg) translateX(1.5%)", offset: 0.55, easing: EASE }, // bow snaps, 160 ms
        { transform: "rotate(0deg) translateX(0)" }, // tip back and settle, 280 ms
      ],
      // Linear overall so the offsets above are real times; each segment eases on its own.
      { duration: 620, easing: "linear" },
    );
    // The ribbon is the visible cause: it snaps taut as the elf pulls, then relaxes with the settle.
    const ribbon = ribbonRef.current?.animate(
      [
        { transform: "scale(1, 1)", easing: EASE },
        { transform: "scale(1.02, 0.62)", offset: 0.29, easing: EASE },
        { transform: "scale(1.02, 0.62)", offset: 0.55, easing: EASE },
        { transform: "scale(1, 1)" },
      ],
      { duration: 620, easing: "linear" },
    );
    const spark = sparkRef.current?.animate(
      [
        { opacity: 0, transform: "scale(0.4) rotate(0deg)" },
        { opacity: 0, transform: "scale(0.4) rotate(0deg)", offset: 0.29 },
        { opacity: 1, transform: "scale(1.1) rotate(25deg)", offset: 0.55, easing: EASE },
        { opacity: 0, transform: "scale(0.9) rotate(45deg)" },
      ],
      { duration: 620, easing: "linear" },
    );
    running.current = [elf, ribbon, spark].filter(Boolean) as Animation[];
  }

  return (
    <div className={cn("relative aspect-[1672/941]", className)}>
      <ArtImage name="workshop-plate" priority sizes="(min-width: 1280px) 100vw, 120vw" className="absolute inset-0 size-full" />
      <svg viewBox="0 0 1672 941" className="pointer-events-none absolute inset-0 size-full" aria-hidden focusable="false">
        <defs>
          <linearGradient id="ribbon-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc860" />
            <stop offset="0.5" stopColor="#f2a83a" />
            <stop offset="1" stopColor="#c27a1e" />
          </linearGradient>
        </defs>
        <g transform={`translate(${RIBBON_FROM.x} ${RIBBON_FROM.y}) rotate(${RIBBON_ANGLE})`}>
          <g ref={ribbonRef} style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}>
            {/* tapering from the band's width at the parcel to a gathered end in the fists, with a slight sag */}
            <path
              d={`M0 -17 Q${RIBBON_LEN * 0.5} -3 ${RIBBON_LEN} -7 L${RIBBON_LEN} 7 Q${RIBBON_LEN * 0.5} 15 0 17 Z`}
              fill="url(#ribbon-brass)"
              stroke="#8f6020"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
            <path d={`M2 -12 Q${RIBBON_LEN * 0.5} 0 ${RIBBON_LEN} -3`} fill="none" stroke="#ffe9a8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>
        </g>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized transparent WebP layer */}
      <img
        ref={elfRef}
        src="/art/ribbon-elf-640.webp"
        srcSet="/art/ribbon-elf-320.webp 320w, /art/ribbon-elf-640.webp 640w"
        sizes="(min-width: 1280px) 16vw, 19vw"
        width={1312}
        height={1199}
        alt=""
        aria-hidden
        draggable={false}
        fetchPriority="high"
        className="pointer-events-none absolute origin-[45%_97%] select-none"
        style={{ left: `${ELF_LEFT}%`, top: `${ELF_TOP}%`, width: `${ELF_W}%` }}
      />
      <span
        ref={sparkRef}
        aria-hidden
        className="pointer-events-none absolute top-[37%] left-[64%] size-[4%] opacity-0"
        style={{ background: "radial-gradient(circle, #fff6c8 0 18%, #eebc65 30%, transparent 62%)" }}
      />
      <button
        type="button"
        onClick={tug}
        className="focus-art absolute top-[38%] left-[59%] h-[24%] w-[16%] cursor-pointer rounded-xl"
      >
        <span className="sr-only">Pull the ribbon tight on the parcel</span>
      </button>
      {children}
    </div>
  );
}
