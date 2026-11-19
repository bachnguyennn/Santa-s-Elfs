"use client";

import { useRef, useState } from "react";

/** The window sits behind the elf in the same coordinate space as the painted bench. */
export function FrostedWindow() {
  const [clear, setClear] = useState(false);
  const start = useRef<number | null>(null);
  const wiped = useRef(false);

  return (
    <button
      type="button"
      aria-label="Peek through the frosted Workshop window"
      aria-pressed={clear}
      className="workshop-frost focus-art"
      onPointerDown={(event) => {
        start.current = event.clientX;
        wiped.current = false;
      }}
      onPointerMove={(event) => {
        if (start.current === null || Math.abs(event.clientX - start.current) < 16) return;
        start.current = null;
        wiped.current = true;
        setClear(true);
      }}
      onPointerUp={() => { start.current = null; }}
      onPointerCancel={() => { start.current = null; wiped.current = false; }}
      onPointerLeave={() => { start.current = null; }}
      onClick={(event) => {
        if (!wiped.current || event.detail === 0) setClear((previous) => !previous);
        wiped.current = false;
      }}
    >
      <span className="sr-only" role="status">{clear ? "Santa is trying to wrap two long skis with one tiny sheet of paper." : ""}</span>
    </button>
  );
}
