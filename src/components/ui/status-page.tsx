import * as React from "react";
import { C, LampPost, line, Pine } from "@/components/village/art";
import { PageShell } from "./page-shell";

/** A quiet corner of the village: one lamp, one tree, fresh snow. Decorative. */
function QuietScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 150" className={className} aria-hidden focusable="false">
      <path d="M0 112c70-16 150-20 220-12s130 8 180 0V150H0z" fill={C.snow} />
      <path d="M-4 112c70-16 154-20 224-12s130 8 184 0" fill="none" {...line} />
      <Pine x={98} y={116} s={0.55} />
      <LampPost x={290} y={110} s={0.75} />
    </svg>
  );
}

/**
 * OWNER: design agent. Dead ends (not found, error, expired link, closed groups): quiet scenery,
 * a plain explanation and one clear next action, on a solid paper reading surface.
 */
export function StatusPage({
  title,
  children,
  actions,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <PageShell width="narrow" className="flex flex-col items-center justify-center">
      <div className="w-full">
        <div className="-mx-4 rounded-t-[var(--radius-card)] bg-sky px-4 pt-6 sm:mx-0">
          <QuietScene className="mx-auto block h-auto w-full max-w-sm" />
        </div>
        <div className="slip p-6 text-center sm:p-9">
          <h1 className="font-display text-[clamp(1.75rem,6vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-midnight [text-wrap:balance]">
            {title}
          </h1>
          {children && <div className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-midnight-soft">{children}</div>}
          {actions && <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>}
        </div>
      </div>
    </PageShell>
  );
}
