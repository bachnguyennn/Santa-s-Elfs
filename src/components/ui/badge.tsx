import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Status labels (Pending, Approved, Drawn, Example…).
 * tone: neutral | green | red | gold. Text is always ≥4.5:1 on its fill.
 */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "green" | "red" | "gold" }) {
  const tones = {
    neutral: "bg-cream-200 text-ink-700",
    green: "bg-pine-100 text-pine-900",
    red: "bg-berry-100 text-berry-700",
    gold: "bg-gold-200 text-ink-900",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs leading-5 font-bold whitespace-nowrap [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
