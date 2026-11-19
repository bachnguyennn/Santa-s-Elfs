"use client";

import * as React from "react";

const KEY = "__santaelfDoorstepY";

/**
 * Browser Back returns the visitor to the same doorstep (REDESIGN_BRIEF.md §4).
 * Village pages are dynamic (they read private-link cookies), so Next re-renders them on Back and
 * the scroll position is lost. Before any same-origin link navigates, the current scroll position is
 * written into the current history entry. On Back/Forward to that entry, it is restored as soon as
 * the page is tall enough, unless the visitor starts scrolling first. Writes merge into
 * history.state, so Next's own router state is kept.
 */
export function DoorstepMemory() {
  React.useEffect(() => {
    const remember = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.origin !== window.location.origin) return;
      try {
        window.history.replaceState({ ...(window.history.state ?? {}), [KEY]: Math.round(window.scrollY) }, "");
      } catch {
        /* state too large or blocked: Back simply keeps the browser default */
      }
    };

    let cancel: (() => void) | null = null;
    const restore = () => {
      cancel?.();
      const y = (window.history.state as Record<string, unknown> | null)?.[KEY];
      if (typeof y !== "number" || y <= 0) return;
      let stopped = false;
      let settled = 0;
      const started = performance.now();
      const stop = () => {
        stopped = true;
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
      };
      // A visitor who starts scrolling wins over the restore.
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("touchstart", stop, { passive: true });
      window.addEventListener("keydown", stop);
      const tick = () => {
        if (stopped) return;
        if (performance.now() - started > 2000) return stop();
        const reachable = document.documentElement.scrollHeight - window.innerHeight >= y - 2;
        if (reachable) {
          if (Math.abs(window.scrollY - y) > 2) {
            window.scrollTo({ top: y, behavior: "instant" });
            settled = 0;
          } else if (++settled >= 6) {
            return stop(); // held for a few frames: the router is done moving things
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cancel = stop;
    };

    document.addEventListener("click", remember, true);
    window.addEventListener("popstate", restore);
    return () => {
      cancel?.();
      document.removeEventListener("click", remember, true);
      window.removeEventListener("popstate", restore);
    };
  }, []);
  return null;
}
