import * as React from "react";
import { Elf } from "@/components/brand/elf";
import { PaperSlip } from "@/components/brand/paper-slip";
import { PageShell } from "./page-shell";

/**
 * OWNER: design agent. Shared look for not-found, error and expired-link pages:
 * an elf peeking over a paper slip that carries the message and the way out.
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
        <Elf pose="peek" className="relative z-10 mx-auto -mb-1 h-24 sm:h-28" />
        <PaperSlip tilt={-1} className="p-6 text-center sm:p-9">
          <h1 className="font-display text-[clamp(1.75rem,6vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900 [text-wrap:balance]">
            {title}
          </h1>
          {children && <div className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-700">{children}</div>}
          {actions && <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>}
        </PaperSlip>
      </div>
    </PageShell>
  );
}
