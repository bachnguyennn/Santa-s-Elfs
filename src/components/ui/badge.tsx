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
    neutral: "border-paper-line bg-cream-50 text-ink",
    green: "border-pine-300 bg-teal-wash text-teal-deep",
    red: "border-cherry bg-cherry-wash text-cherry",
    gold: "border-gold-500 bg-gold-200 text-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs leading-5 font-bold whitespace-nowrap [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
