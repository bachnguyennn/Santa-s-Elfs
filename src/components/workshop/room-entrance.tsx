"use client";

import * as React from "react";
import { ART_H, ART_W } from "./art";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 260;
/** How long to wait for the room to render before letting the overlay go without the hand-off. */
const WAIT_MS = 2500;

/** The brass letter slot on the Post Office door, as fractions of the village-street painting. */
const SLOT = { x: 0.518, y: 0.511, w: 0.043, h: 0.03 };
/** The cabinet's brass name plates, as fractions of the post-office painting (first visible one wins). */
const PLATES = [
  { x: 0.151, y: 0.388, w: 0.127, h: 0.058 },
  { x: 0.431, y: 0.388, w: 0.127, h: 0.058 },
  { x: 0.151, y: 0.593, w: 0.127, h: 0.058 },
  { x: 0.431, y: 0.593, w: 0.127, h: 0.058 },
  { x: 0.151, y: 0.796, w: 0.127, h: 0.058 },
];
/** On a phone card (no painting under the finger), the slot appears this wide, centred on the card. */
const CARD_SLOT_PX = 72;

type Rect = { left: number; top: number; width: number; height: number };

/** Where a point of a painting lands on screen, for an <img> drawn with object-fit: cover (or unclipped). */
function artToScreen(img: HTMLImageElement, f: { x: number; y: number; w: number; h: number }): Rect {
  const box = img.getBoundingClientRect();
  const scale = Math.max(box.width / ART_W, box.height / ART_H);
  const w = ART_W * scale;
  const h = ART_H * scale;
  const [px, py] = (getComputedStyle(img).objectPosition || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
  const left = box.left + (box.width - w) * (Number.isFinite(px) ? px : 0.5);
  const top = box.top + (box.height - h) * (Number.isFinite(py) ? py : 0.5);
  return { left: left + f.x * w, top: top + f.y * h, width: f.w * w, height: f.h * h };
}

const inside = (r: Rect, c: Rect) => r.left >= c.left && r.top >= c.top && r.left + r.width <= c.left + c.width && r.top + r.height <= c.top + c.height;

function clipFor(c: Rect) {
  const right = Math.max(0, window.innerWidth - (c.left + c.width));
  const bottom = Math.max(0, window.innerHeight - (c.top + c.height));
  return `inset(${Math.max(0, c.top)}px ${right}px ${bottom}px ${Math.max(0, c.left)}px round 8px)`;
}

/**
 * Entering the Post Office (SPEC motion score): the brass slot on the painted door is carried onto the
 * brass plate of the mail cabinet inside, over 260 ms. The tap is an ordinary link, so navigation
 * starts at once; meanwhile a copy of the street painting holds still exactly over the original.
 * When the room has rendered, that copy zooms from the slot onto the plate and fades into the room.
 * Purely visual: nothing waits on it, it never takes focus, and under reduced motion (or a
 * modified click) it does nothing, so the room simply appears.
 */
export function RoomEntrance() {
  React.useEffect(() => {
    let cleanup: (() => void) | null = null;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[data-enter="post-office"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const street = document.querySelector<HTMLImageElement>('img[data-art="village-street"]');
      if (!street?.currentSrc) return;
      cleanup?.();
      cleanup = carry(link, street);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      cleanup?.();
    };
  }, []);
  return null;
}

function carry(link: HTMLAnchorElement, street: HTMLImageElement): () => void {
  const view: Rect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const onPainting = !!street.parentElement?.contains(link);
  let slot = artToScreen(street, SLOT);
  let clip: Rect;
  let paint: Rect; // where the painting copy is drawn

  const box = street.getBoundingClientRect();
  const frame = street.parentElement?.parentElement?.getBoundingClientRect() ?? box; // the overflow-hidden frame
  if (onPainting && inside(slot, view)) {
    paint = box;
    clip = frame;
  } else {
    // A card or a slot scrolled out of view: show the door's slot centred in what was tapped.
    const card = link.getBoundingClientRect();
    const k = CARD_SLOT_PX / (SLOT.w * box.width);
    paint = { left: 0, top: 0, width: box.width * k, height: box.height * k };
    const s = { x: SLOT.x * paint.width, y: SLOT.y * paint.height };
    paint.left = card.left + card.width / 2 - s.x - (SLOT.w * paint.width) / 2;
    paint.top = card.top + card.height / 2 - s.y - (SLOT.h * paint.height) / 2;
    slot = { left: paint.left + s.x, top: paint.top + s.y, width: SLOT.w * paint.width, height: SLOT.h * paint.height };
    clip = card;
  }

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.roomEntrance = "post-office";
  Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "100", pointerEvents: "none", clipPath: clipFor(clip) });
  const img = document.createElement("img");
  img.src = street.currentSrc;
  img.alt = "";
  const originX = slot.left + slot.width / 2 - paint.left;
  const originY = slot.top + slot.height / 2 - paint.top;
  Object.assign(img.style, {
    position: "absolute",
    left: `${paint.left}px`,
    top: `${paint.top}px`,
    width: `${paint.width}px`,
    height: `${paint.height}px`,
    maxWidth: "none",
    transformOrigin: `${originX}px ${originY}px`,
  });
  layer.appendChild(img);
  document.body.appendChild(layer);

  let done = false;
  let raf = 0;
  const anims: Animation[] = [];
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    anims.forEach((a) => a.cancel());
    layer.remove();
    window.removeEventListener("popstate", finish);
  };
  // Back/Forward mid-way: just get out of the way.
  window.addEventListener("popstate", finish);

  const letGo = () => {
    const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "linear" });
    anims.push(a);
    a.onfinish = finish;
  };

  const handOff = (room: HTMLImageElement) => {
    const bounds = room.getBoundingClientRect();
    const visible = { left: bounds.left, top: Math.max(0, bounds.top), width: bounds.width, height: Math.min(bounds.bottom, view.height) - Math.max(0, bounds.top) };
    const plate = PLATES.map((p) => artToScreen(room, p)).find((r) => inside(r, visible)) ?? artToScreen(room, PLATES[0]);
    const k = plate.width / slot.width;
    const dx = plate.left + plate.width / 2 - (slot.left + slot.width / 2);
    const dy = plate.top + plate.height / 2 - (slot.top + slot.height / 2);
    anims.push(
      img.animate([{ transform: "translate(0, 0) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(${k})` }], {
        duration: DURATION,
        easing: EASE,
        fill: "forwards",
      }),
      layer.animate([{ clipPath: clipFor(clip) }, { clipPath: clipFor(view) }], { duration: DURATION, easing: EASE, fill: "forwards" }),
    );
    // Hold the painting while it travels, then dissolve into the room (linear overall; offsets are real times).
    const fade = layer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.45, easing: EASE }, { opacity: 0 }], {
      duration: DURATION,
      easing: "linear",
      fill: "forwards",
    });
    anims.push(fade);
    fade.onfinish = finish;
  };

  const started = performance.now();
  const from = window.location.pathname;
  // The router scrolls the new page into place a frame or two after it mounts: aim only once the
  // room's painting has held still for a few frames.
  let lastTop = NaN;
  let still = 0;
  const wait = () => {
    if (done) return;
    const room = window.location.pathname !== from ? document.querySelector<HTMLImageElement>('img[data-art="post-office"]') : null;
    const r = room?.getBoundingClientRect();
    if (r && r.height > 0) {
      still = Math.abs(r.top - lastTop) < 0.5 ? still + 1 : 0;
      lastTop = r.top;
    }
    if (room && r && r.height > 0 && still >= 3) {
      // Let the room's painting be ready to show through, briefly.
      const ready = room.complete ? Promise.resolve() : Promise.race([room.decode().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
      void ready.then(() => !done && handOff(room));
      return;
    }
    if (performance.now() - started > WAIT_MS) return letGo();
    raf = requestAnimationFrame(wait);
  };
  raf = requestAnimationFrame(wait);

  return finish;
}
