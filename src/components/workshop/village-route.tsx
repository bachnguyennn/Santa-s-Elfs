"use client";

import Link from "next/link";
import * as React from "react";
import { SnowLayer } from "@/components/village/snow";
import { cn } from "@/lib/utils";
import { ArtImage } from "./art";
import { WorkshopEntranceLink } from "./door-entry";

/*
 * The village street (art/village-street: building centres near 19%, 54%, 85% across).
 * Coordinates below are percentages of the 1672×941 painting, measured on the painted ribbon.
 */
const ROUTE = "M420 662 C 500 690, 590 662, 680 650 S 840 628, 886 621";

export interface StreetStop {
  key: "workshop" | "post-office" | "gift-house";
  name: string;
  purpose: string;
  /** Destination. Omit for a sign that only explains (e.g. a room this visitor can't enter yet). */
  href?: string;
  /** True for the public Workshop entrance to /new: the arrival plays the doorway. */
  door?: boolean;
  /** Hit area over the painted building (percent of the painting). */
  area: { left: number; top: number; width: number; height: number };
  /** Where the sign hangs (centre x, top y, percent). */
  sign: { x: number; y: number };
}

const PUBLIC_STOPS: StreetStop[] = [
  { key: "workshop", name: "Workshop", purpose: "Start a group", href: "/new", door: true, area: { left: 4, top: 20, width: 28, height: 52 }, sign: { x: 18, y: 16 } },
  { key: "post-office", name: "Post Office", purpose: "Recover link", href: "/recover", area: { left: 38, top: 16, width: 31, height: 54 }, sign: { x: 54, y: 11 } },
  { key: "gift-house", name: "Gift House", purpose: "Wishlists, once you join", area: { left: 74, top: 26, width: 24, height: 46 }, sign: { x: 85, y: 20 } },
];

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Ordinary vertical scrolling carries a parcel down the painted ribbon (SPEC "Scroll past the
 * Workshop"): 0–40% it rides from the Workshop to the Post Office steps; 45–55% the Post Office bell
 * tilts 12°; 65–90% an elf steps out and catches it; by 100% the Post Office door is lit. It reverses
 * on upward scroll, never locks scrolling, and only listens while the scene is on screen. Reduced
 * motion shows the scene still. Buildings are real links with HTML signs. On phones the painting is wider
 * than the screen and pans to keep the active landmark centred; large sign-style links follow below.
 */
export function VillageRoute({ stops = PUBLIC_STOPS, heading, intro }: { stops?: StreetStop[]; heading: React.ReactNode; intro?: React.ReactNode }) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const parcelRef = React.useRef<SVGGElement>(null);
  const bellRef = React.useRef<HTMLSpanElement>(null);
  const elfRef = React.useRef<HTMLImageElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [lit, setLit] = React.useState(false);

  React.useEffect(() => {
    const track = trackRef.current;
    const path = pathRef.current;
    if (!track || !path) return;
    const length = path.getTotalLength();
    let frame = 0;
    let active = false;

    const render = () => {
      frame = 0;
      const still = reduced();
      const rect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = still ? 0 : clamp(-rect.top / travel);
      const ride = clamp(p / 0.4);
      const catchT = clamp((p - 0.65) / 0.25);
      const pt = path.getPointAtLength(ride * length);
      // After the ride, the parcel lifts into the elf's arms.
      const x = pt.x + catchT * 48;
      const y = pt.y - catchT * 70;
      parcelRef.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-6 + 6 * catchT).toFixed(1)})`);
      const bellT = clamp((p - 0.45) / 0.1);
      if (bellRef.current) bellRef.current.style.transform = `rotate(${(Math.sin(bellT * Math.PI * 2) * 12).toFixed(2)}deg)`;
      if (elfRef.current) {
        elfRef.current.style.opacity = String(catchT);
        elfRef.current.style.transform = `translateX(${((1 - catchT) * 30).toFixed(1)}%)`;
      }
      setLit(p >= 0.98);
      // Phones: the painting is wider than the screen; keep the active landmark centred
      // (Workshop at 19% → Post Office at 54% while the parcel rides, then hold on the Post Office).
      const box = boxRef.current;
      if (box) {
        const vw = box.parentElement?.clientWidth ?? window.innerWidth;
        const bw = box.offsetWidth;
        if (bw > vw + 1) {
          const focus = 19 + (54 - 19) * ride;
          const x = Math.max(-(bw - vw), Math.min(0, vw / 2 - (focus / 100) * bw));
          box.style.transform = `translateX(${x.toFixed(1)}px)`;
        } else {
          box.style.transform = "";
        }
      }
    };
    const onScroll = () => {
      if (active && !frame) frame = requestAnimationFrame(render);
    };
    const io = new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) onScroll();
    });
    io.observe(track);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    render();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section aria-labelledby="street-title" className="on-dark relative bg-oxblood text-buttercream">
      <div ref={trackRef} className="relative h-[140vh] sm:h-[150vh] motion-reduce:h-auto">
        <div className="sticky top-0 flex min-h-[100svh] flex-col justify-start gap-6 overflow-hidden py-10 sm:justify-center motion-reduce:static motion-reduce:min-h-0">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
            <h2 id="street-title" className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] font-bold">
              {heading}
            </h2>
            {intro && <div className="mt-3 max-w-[46ch] text-lg text-buttercream/90">{intro}</div>}
          </div>

          <div className="relative mx-auto w-full max-w-[1672px] overflow-hidden">
            <SnowLayer className="inset-x-0 top-0 h-[22%]" density={0.5} />
            <div ref={boxRef} className="relative aspect-[1672/941] w-[260%] sm:w-full">
              <ArtImage name="village-street" sizes="(min-width: 1672px) 1672px, 100vw" className="absolute inset-0 size-full" />
              <svg viewBox="0 0 1672 941" className="pointer-events-none absolute inset-0 size-full" aria-hidden focusable="false">
                <path ref={pathRef} d={ROUTE} fill="none" stroke="none" />
                {/* the teal parcel with its brass ribbon */}
                <g ref={parcelRef} transform="translate(420 662)">
                  <g transform="translate(-26 -46)">
                    <rect x="0" y="6" width="52" height="40" rx="4" fill="#145851" stroke="#0e403b" strokeWidth="2" />
                    <rect x="21" y="6" width="10" height="40" fill="#eebc65" />
                    <rect x="0" y="20" width="52" height="8" fill="#eebc65" />
                    <path d="M26 6c-10-14-24-8-14 0M26 6c10-14 24-8 14 0" fill="none" stroke="#eebc65" strokeWidth="5" strokeLinecap="round" />
                    <rect x="2" y="8" width="18" height="10" fill="#ffffff" opacity="0.12" />
                  </g>
                </g>
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized transparent WebP layer */}
              <img
                ref={elfRef}
                src="/art/ribbon-elf-320.webp"
                width={1312}
                height={1199}
                alt=""
                aria-hidden
                loading="lazy"
                className="pointer-events-none absolute w-[8%] opacity-0 select-none"
                style={{ left: `${58 - 0.45 * 8}%`, top: `${67 - 0.97 * 8 * (1199 / 1312) * (1672 / 941)}%` }}
              />
              {stops.map((s) => (
                <StreetBuilding key={s.key} stop={s} lit={lit && s.key === "post-office"} bellRef={s.key === "post-office" ? bellRef : undefined} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The conventional way: large, labelled links (the only way on phones, a shortcut elsewhere). */}
      <nav aria-label="Village stops" className="mx-auto max-w-6xl px-4 pb-14 sm:hidden">
        <ul className="grid gap-3">
          {stops.map((s) => (
            <li key={s.key}>
              <StopLink stop={s} />
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

function StopLink({ stop }: { stop: StreetStop }) {
  const body = (
    <>
      <span className="block font-display text-2xl leading-tight font-bold">{stop.name}</span>
      <span className="block text-[0.9375rem] text-buttercream/85">{stop.purpose}</span>
    </>
  );
  // Teal enamel, like the hanging signs on the painted street.
  const cls = "block min-h-16 rounded-md bg-teal px-4 py-3 text-buttercream shadow-[0_3px_0_var(--color-walnut)]";
  if (!stop.href) return <div className={cn(cls, "bg-teal/60")}>{body}</div>;
  const linkCls = cn(cls, "transition-colors hover:bg-teal-deep");
  return stop.door ? (
    <WorkshopEntranceLink className={linkCls}>{body}</WorkshopEntranceLink>
  ) : (
    <Link href={stop.href} className={linkCls} data-enter={stop.key === "post-office" ? "post-office" : undefined}>
      {body}
    </Link>
  );
}

/** A painted building with a hanging HTML sign: one link, one keyboard stop. Signs hide on phones. */
function StreetBuilding({ stop, lit, bellRef }: { stop: StreetStop; lit: boolean; bellRef?: React.Ref<HTMLSpanElement> }) {
  const { area } = stop;
  // The link covers just its building; the sign is placed relative to that area (it may hang above it).
  const signLeft = ((stop.sign.x - area.left) / area.width) * 100;
  const signTop = ((stop.sign.y - area.top) / area.height) * 100;
  const box = { left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%` };
  const sign = (
    <span
      className={cn(
        "building-sign absolute inline-flex items-center gap-2 rounded-md bg-teal px-3 py-1.5 whitespace-nowrap text-buttercream shadow-[0_3px_0_var(--color-walnut)]",
        lit && "ring-2 ring-brass",
      )}
      // Signs near the right edge hang from their right end so they never run off the painting.
      style={{ left: `${signLeft}%`, top: `${signTop}%`, translate: stop.sign.x > 75 ? "-88% 0" : "-50% 0" }}
    >
      {bellRef && (
        <span ref={bellRef} aria-hidden className="inline-block origin-top">
          <svg viewBox="0 0 16 18" className="size-4">
            <path d="M8 1v2M3 13c0-6 2-9 5-9s5 3 5 9z" fill="#eebc65" stroke="#7a5417" strokeWidth="1.2" />
            <circle cx="8" cy="15" r="1.6" fill="#b98431" />
          </svg>
        </span>
      )}
      <span className="font-display text-lg leading-none font-bold tracking-[0.06em] uppercase">{stop.name}</span>
      <span aria-hidden className="text-brass">
        ·
      </span>
      <span className="text-sm font-bold">{stop.purpose}</span>
    </span>
  );
  if (!stop.href) {
    return (
      <div aria-hidden className="pointer-events-none absolute" style={box}>
        {sign}
      </div>
    );
  }
  // The id is the doorstep: rooms link back to it ("Back to the village").
  const cls = "building-link focus-art absolute block scroll-mt-24 rounded-2xl transition-[background-color] duration-200 hover:bg-[rgb(255_214_140/0.12)]";
  return stop.door ? (
    <WorkshopEntranceLink id={stop.key} className={cls} style={box}>
      {sign}
    </WorkshopEntranceLink>
  ) : (
    <Link id={stop.key} href={stop.href} className={cls} style={box} data-enter={stop.key === "post-office" ? "post-office" : undefined}>
      {sign}
    </Link>
  );
}
