import * as React from "react";
import { SceneBanner, type ArtName } from "@/components/workshop/art";
import { SiteFooter, SiteHeader, SkipLink } from "./page-shell";

/**
 * OWNER: design agent. Dead ends (not found, error, expired or denied link, closed group): restrained
 * scenery, a cream reading panel with a short heading, a plain explanation and one useful next action.
 */
export function StatusPage({
  title,
  children,
  actions,
  art = "post-office",
  position = "84% 74%",
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** Which room frames the message. Defaults to the Post Office, near the stamp. */
  art?: ArtName;
  position?: string;
}) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 bg-parchment pb-16 outline-none">
        <SceneBanner name={art} position={position} className="h-[clamp(8rem,20vw,14rem)]" />
        <div className="mx-auto -mt-10 w-full max-w-xl px-4 sm:-mt-14 sm:px-8">
          <div className="rounded-lg border border-paper-line bg-cream-50 p-6 text-center shadow-[var(--shadow-lifted)] sm:p-9">
            <h1 className="font-display text-[clamp(2.25rem,7vw,3rem)] leading-[0.98] font-bold text-oxblood [text-wrap:balance]">{title}</h1>
            {children && <div className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-700">{children}</div>}
            {actions && <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
