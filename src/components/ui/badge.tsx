import * as React from "react";
import { cn } from "@/lib/utils";

/** OWNER: design agent. */
export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "green" | "red" | "gold" }) {
  const tones = {
    neutral: "bg-cream-200 text-ink-700",
    green: "bg-pine-100 text-pine-900",
    red: "bg-berry-100 text-berry-700",
    gold: "bg-gold-200 text-ink-900",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)} {...props} />;
}
