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
    neutral: "border-midnight bg-paper text-midnight",
    green: "border-evergreen bg-pine-100 text-evergreen-deep",
    red: "border-cranberry-deep bg-berry-100 text-cranberry-deep",
    gold: "border-midnight bg-golden text-midnight",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs leading-5 font-bold whitespace-nowrap [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
