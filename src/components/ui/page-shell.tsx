import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/brand/logo";
import { Holly } from "@/components/brand/motifs";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Site chrome for every app screen (not the landing page, which draws its own felt header).
 *
 *   <PageShell width="narrow" headerAction={<Badge tone="green">Organizer</Badge>}>…</PageShell>
 *
 * width: narrow (forms, 36rem) | default (app screens, 48rem) | wide (organizer dashboard, 72rem).
 * Renders <header>, <main id="main"> and <footer> landmarks plus a skip link.
 */
export function PageShell({
  children,
  width = "default",
  headerAction,
  className,
}: {
  children: React.ReactNode;
  width?: "narrow" | "default" | "wide";
  headerAction?: React.ReactNode;
  className?: string;
}) {
  const max = { narrow: "max-w-xl", default: "max-w-3xl", wide: "max-w-6xl" }[width];
  return (
    <>
      <SkipLink />
      <SiteHeader action={headerAction} />
      <main id="main" tabIndex={-1} className={cn("mx-auto w-full flex-1 px-4 py-8 outline-none sm:px-6 sm:py-12", max, className)}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-lg bg-pine-900 px-4 py-3 font-bold text-cream-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Skip to content
    </a>
  );
}

export function SiteHeader({ action, tone = "light" }: { action?: React.ReactNode; tone?: "light" | "felt" }) {
  return (
    <header className={cn(tone === "felt" ? "felt on-pine" : "border-b border-line bg-cream-50")}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Logo tone={tone === "felt" ? "light" : "dark"} />
        {action}
      </div>
    </header>
  );
}

export function SiteFooter({ tone = "light", showHome = true }: { tone?: "light" | "felt"; showHome?: boolean }) {
  const felt = tone === "felt";
  return (
    <footer className={cn("mt-auto", felt ? "felt on-pine text-pine-200" : "border-t border-line bg-cream-100 text-ink-700")}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Holly className="h-6 shrink-0" />
          <p>
            SantaElf is free and needs no account. Groups are deleted automatically after the exchange.
          </p>
        </div>
        <nav aria-label="Footer" className="shrink-0">
          <ul className="flex flex-wrap gap-x-5">
            {showHome ? (
              <li>
                <Link href="/" className={cn("inline-flex min-h-11 items-center underline", felt ? "text-cream-50" : "text-pine-800")}>
                  Home
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/recover" className={cn("inline-flex min-h-11 items-center underline", felt ? "text-cream-50" : "text-pine-800")}>
                Lost your link?
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
