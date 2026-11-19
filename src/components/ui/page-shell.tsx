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
      className="sr-only z-50 rounded-lg border-2 border-golden bg-midnight px-4 py-3 font-bold text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:inline-flex focus:min-h-12 focus:items-center focus:px-4 focus:py-3"
    >
      Skip to content
    </a>
  );
}

export function SiteHeader({ action, tone = "light" }: { action?: React.ReactNode; tone?: "light" | "felt" }) {
  return (
    <header className={cn("border-b-[2.5px] border-midnight", tone === "felt" ? "felt on-pine" : "bg-sky")}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Logo tone={tone === "felt" ? "light" : "dark"} />
        {action}
      </div>
    </header>
  );
}

export function SiteFooter({ showHome = true }: { tone?: "light" | "felt"; showHome?: boolean }) {
  // One footer everywhere: evergreen ground, paper text (8.9:1).
  return (
    <footer className="on-pine mt-auto border-t-[2.5px] border-midnight bg-evergreen text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-prose">SantaElf is free and needs no account. Groups are deleted automatically 60 days after the exchange.</p>
        <nav aria-label="Footer" className="shrink-0">
          <ul className="flex flex-wrap gap-x-5">
            {showHome ? (
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                  Village Square
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/recover" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                Recover my link
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
