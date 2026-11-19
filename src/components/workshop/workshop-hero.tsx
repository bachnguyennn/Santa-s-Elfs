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

/**
 * Santa holds the ribbon while the elf pulls it taut around the teal parcel. One coordinate system
 * for the painted plate, the separate elf and the parcel button, so every crop keeps them aligned.
 * Tapping the parcel (optional, replayable): the elf tugs, sparks catch the bow, the elf tips back
 * 5° and settles (180 + 160 + 280 ms). Purely decorative; the page's actions never depend on it.
 */
export function WorkshopScene({ className, children }: { className?: string; children?: React.ReactNode }) {
  const elfRef = React.useRef<HTMLImageElement>(null);
  const sparkRef = React.useRef<HTMLSpanElement>(null);
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
    const spark = sparkRef.current?.animate(
      [
        { opacity: 0, transform: "scale(0.4) rotate(0deg)" },
        { opacity: 0, transform: "scale(0.4) rotate(0deg)", offset: 0.29 },
        { opacity: 1, transform: "scale(1.1) rotate(25deg)", offset: 0.55, easing: EASE },
        { opacity: 0, transform: "scale(0.9) rotate(45deg)" },
      ],
      { duration: 620, easing: "linear" },
    );
    running.current = [elf, spark].filter(Boolean) as Animation[];
  }

  return (
    <div className={cn("relative aspect-[1672/941]", className)}>
      <ArtImage name="workshop-plate" priority sizes="(min-width: 1280px) 100vw, 120vw" className="absolute inset-0 size-full" />
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
