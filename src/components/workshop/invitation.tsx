"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The cream invitation on the Workshop desk. It mirrors the group name the moment it is typed
 * (Shantell Sans: the one handwritten line). `arriveKey` slides it 16 px onto the desk;
 * `settleKey` (the wizard step) moves it 8 px and settles in 160 ms. Decorative copy of the form's
 * value: the field itself is the source of truth, so the card is hidden from assistive tech.
 */
export function Invitation({
  name,
  organizer,
  arriveKey,
  settleKey,
  compact = false,
  className,
}: {
  name: string;
  organizer?: string;
  arriveKey?: number;
  settleKey?: number;
  compact?: boolean;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const firstSettle = React.useRef(true);

  React.useEffect(() => {
    if (!arriveKey || reduced()) return;
    const a = ref.current?.animate(
      [
        { opacity: 0, transform: "translateY(16px) rotate(-1.5deg)" },
        { opacity: 1, transform: "translateY(0) rotate(-1deg)" },
      ],
      { duration: 500, easing: EASE },
    );
    return () => a?.cancel();
  }, [arriveKey]);

  React.useEffect(() => {
    if (firstSettle.current) {
      firstSettle.current = false;
      return;
    }
    if (reduced()) return;
    const a = ref.current?.animate([{ transform: "translateY(8px) rotate(-1deg)" }, { transform: "translateY(0) rotate(-1deg)" }], {
      duration: 160,
      easing: EASE,
    });
    return () => a?.cancel();
  }, [settleKey]);

  const shown = name.trim() || "Your group name";
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative -rotate-1 rounded-[4px] bg-[linear-gradient(120deg,#fff1ce,#eed5a6)] text-oxblood shadow-[0_2px_0_#d6c4a5,4px_14px_26px_-12px_rgb(51_9_20/0.55)]",
        compact ? "px-4 py-3" : "px-6 pt-6 pb-7",
        className,
      )}
    >
      {!compact && <span className="absolute inset-x-0 top-0 h-[5px] rounded-t-[4px] bg-[repeating-linear-gradient(120deg,#962e40_0_8px,#fff0cc_8px_16px,#145851_16px_24px,#fff0cc_24px_32px)]" />}
      <p
        className={cn(
          "font-hand leading-tight font-semibold break-words",
          compact ? "text-xl" : "text-[clamp(1.6rem,3.2vw,2.25rem)]",
          name.trim() ? "text-oxblood" : "text-ink-500",
        )}
      >
        {shown}
      </p>
      <p className={cn("text-ink-700", compact ? "mt-0.5 text-xs" : "mt-1 text-sm")}>A Secret Santa invitation</p>
      {!compact && (
        <p className="mt-4 border-t border-dashed border-[#c89a6b] pt-3 text-sm text-ink-700">
          {organizer?.trim() ? `From ${organizer.trim()}, with a private link for everyone.` : "Everyone gets a private link. Nobody needs an account."}
        </p>
      )}
    </div>
  );
}
