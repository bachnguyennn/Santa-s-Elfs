import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. A sheet of paper on the page.
 * tone: "paper" (default, cream-50 with a soft shadow), "plain" (white, border only: dense lists/tables),
 * "felt" (pine ground, cream text: one highlight block per screen at most).
 * Never nest Cards; use dividers or PaperSlip inside.
 */
export function Card({
  className,
  tone = "paper",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "paper" | "plain" | "felt" }) {
  const tones = {
    paper: "border-[2.5px] border-midnight bg-paper shadow-[var(--shadow-paper)]",
    plain: "border-[2.5px] border-midnight bg-paper",
    felt: "felt on-pine border-[2.5px] border-midnight text-paper shadow-[var(--shadow-paper)]",
  };
  return <div className={cn("rounded-[var(--radius-card)] p-5 sm:p-6", tones[tone], className)} {...props} />;
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
        <Heading className="font-display text-xl leading-tight font-bold tracking-[-0.015em] text-midnight">{title}</Heading>
        {description && <p className="mt-1 text-sm text-midnight-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
