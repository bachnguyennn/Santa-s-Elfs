import * as React from "react";
import { cn } from "@/lib/utils";

/** OWNER: design agent. tone: info | success | warning | error. */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-pine-100 bg-pine-100/50 text-pine-900",
    success: "border-pine-100 bg-pine-100 text-pine-900",
    warning: "border-gold-200 bg-gold-200/50 text-ink-900",
    error: "border-berry-100 bg-berry-100 text-berry-700",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
    </div>
  );
}
