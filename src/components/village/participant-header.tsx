"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SnowToggle } from "./snow";
import { VillageLogo } from "./village-chrome";

/**
 * Participant chrome: logo, "Private page", and ordinary navigation links to the same places the
 * village buildings lead to (REDESIGN_BRIEF.md §3). The current place is marked with aria-current.
 */
export function ParticipantHeader({
  places,
}: {
  /** e.g. [{ href: "/p/…", label: "Your village" }, { href: "/p/…/messages", label: "Post Office · Messages" }] */
  places: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <header className="relative z-20 border-b-[2.5px] border-midnight bg-sky">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <VillageLogo href={places[0]?.href ?? "/"} />
        <div className="flex items-center gap-1">
          <SnowToggle className="hidden sm:inline-flex" />
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-midnight bg-paper px-3 py-1 text-sm font-bold">
            <Lock className="size-3.5" aria-hidden /> Private page
          </span>
        </div>
      </div>
      <nav aria-label="Your village" className="mx-auto max-w-6xl">
        <ul className="flex flex-wrap gap-x-1 px-2 sm:px-4">
          {places.map((p) => {
            const current = pathname === p.href.split(/[?#]/)[0];
            return (
              <li key={p.href} className="shrink-0">
                <Link
                  href={p.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-12 items-center px-3 text-[0.9375rem] font-bold",
                    current ? "text-midnight" : "text-evergreen underline decoration-2 underline-offset-4",
                  )}
                >
                  {p.label}
                  {current && <span aria-hidden className="absolute inset-x-3 bottom-1.5 h-1 rounded-full bg-cranberry" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
