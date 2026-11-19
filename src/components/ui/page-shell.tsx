import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/brand/logo";
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
      <main id="main" tabIndex={-1} className={cn("mx-auto w-full flex-1 px-4 py-8 outline-none sm:px-8 sm:py-12", max, className)}>
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
      className="sr-only z-[60] rounded-lg border-2 border-brass bg-oxblood px-4 py-3 font-bold text-buttercream focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:inline-flex focus:min-h-12 focus:items-center focus:px-4 focus:py-3"
    >
      Skip to content
    </a>
  );
}

export function SiteHeader({ action, tone = "light" }: { action?: React.ReactNode; tone?: "light" | "felt" }) {
  return (
    <header className={cn("on-dark bg-oxblood text-buttercream", tone === "felt" && "bg-oxblood-deep")}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-8">
        <Logo tone="light" />
        {action ?? (
          <Link href="/recover" className="inline-flex min-h-11 items-center rounded-lg px-2 font-bold text-buttercream underline decoration-brass/70 underline-offset-4 hover:decoration-brass">
            Recover link
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ showHome = true }: { tone?: "light" | "felt"; showHome?: boolean }) {
  // One footer everywhere: evergreen ground, paper text (8.9:1).
  return (
    <footer className="on-dark mt-auto bg-oxblood-deep text-buttercream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-prose">SantaElf is free and needs no account. Groups are deleted automatically 60 days after the exchange.</p>
        <nav aria-label="Footer" className="shrink-0">
          <ul className="flex flex-wrap gap-x-5">
            {showHome ? (
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                  Home
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/recover" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                Recover link
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
