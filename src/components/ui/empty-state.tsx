import * as React from "react";
import { ElfFigure } from "@/components/workshop/art";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Friendly empty/zero state: small illustration, one heading, one sentence,
 * at most one action. art: "elf" (waving), "gift", "none".
 */
export function EmptyState({
  title,
  children,
  action,
  art = "elf",
  headingLevel: Heading = "h2",
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  art?: "elf" | "gift" | "none";
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      {art !== "none" && <ElfFigure className="w-24" />}
      <Heading className="mt-4 font-display text-xl font-bold tracking-normal text-midnight">{title}</Heading>
      {children && <div className="mt-2 max-w-sm text-midnight-soft">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
