import * as React from "react";
import { cn } from "@/lib/utils";

/** OWNER: design agent. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-white p-6", className)} {...props} />;
}
