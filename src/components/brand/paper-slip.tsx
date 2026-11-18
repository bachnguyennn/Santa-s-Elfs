import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A folded paper slip: cream sheet, soft centre crease, slight tilt. The page's text carrier
 * (names, short notes, step labels). Text inside stays real, selectable text.
 * tilt: degrees, keep within ±4 for anything longer than a word.
 */
export function PaperSlip({
  tilt = 0,
  as: Comp = "div",
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLElement> & { tilt?: number; as?: React.ElementType }) {
  return (
    <Comp
      className={cn("slip rotate-(--tilt) text-ink-900", className)}
      style={{ ["--tilt" as string]: `${tilt}deg`, ...style }}
      {...props}
    />
  );
}

/** A handwritten name, as written on a slip. */
export function HandName({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("font-hand font-semibold tracking-[-0.01em]", className)} {...props} />;
}
