import * as React from "react";
import { Elf } from "@/components/brand/elf";
import { GiftBox } from "@/components/brand/gift-box";
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
      {art === "elf" && <Elf pose="wave" className="h-28" />}
      {art === "gift" && <GiftBox tone="berry" className="size-20" />}
      <Heading className="mt-4 font-display text-xl font-bold tracking-[-0.015em] text-pine-900">{title}</Heading>
      {children && <div className="mt-2 max-w-sm text-ink-700">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
