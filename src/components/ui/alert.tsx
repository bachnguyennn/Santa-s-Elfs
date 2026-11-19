import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Inline message. tone: info | success | warning | error.
 * role: error -> "alert" (announced immediately); others -> "status".
 * Copy rule: title names what happened, body says what to do next.
 */
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
    info: { box: "border-pine-300 bg-teal-wash text-ink", icon: Info, iconCls: "text-teal" },
    success: { box: "border-pine-300 bg-teal-wash text-teal-deep", icon: CircleCheck, iconCls: "text-teal" },
    warning: { box: "border-gold-500 bg-gold-200 text-ink", icon: TriangleAlert, iconCls: "text-gold-700" },
    error: { box: "border-cherry bg-cherry-wash text-berry-800", icon: CircleAlert, iconCls: "text-cherry" },
  };
  const t = tones[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed", t.box, className)}
    >
      <Icon className={cn("mt-0.5 size-[1.15rem] shrink-0", t.iconCls)} aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
    </div>
  );
}
