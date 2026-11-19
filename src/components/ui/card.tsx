import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. A cream reading surface on the workshop's wood (DESIGN.md).
 * tone: "paper" (default, lamplit contact shadow), "plain" (no shadow: dense lists),
 * "felt" (petrol-teal panel, buttercream text: one per screen at most).
 * Never nest Cards; use dividers or PaperSlip inside.
 */
export function Card({
  className,
  tone = "paper",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "paper" | "plain" | "felt" }) {
  const tones = {
    paper: "border border-paper-line bg-cream-50 shadow-[var(--shadow-paper)]",
    plain: "border border-paper-line bg-cream-50",
    felt: "on-dark bg-teal text-buttercream shadow-[var(--shadow-paper)]",
  };
  return <div className={cn("rounded-lg p-5 sm:p-7", tones[tone], className)} {...props} />;
}

/** Card heading row: title + optional action on the right. */
export function CardHeader({
  title,
  description,
  action,
  className,
  as: Heading = "h2",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading className="font-display text-[1.6rem] leading-tight font-bold tracking-normal text-oxblood">{title}</Heading>
        {description && <p className="mt-1 text-sm text-midnight-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
