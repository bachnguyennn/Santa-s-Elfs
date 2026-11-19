"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Participant chrome: the oxblood bar ("Private page"), then ordinary links to the same places the
 * village buildings lead to (role-scoped: only places this participant may use are listed).
 */
export function ParticipantHeader({ places }: { places: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <header className="relative z-20">
      <div className="on-dark bg-oxblood text-buttercream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-8">
          <Logo tone="light" href={places[0]?.href ?? "/"} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-buttercream/30 px-3 py-1 text-sm font-bold">
            <Lock className="size-3.5" aria-hidden /> Private page
          </span>
        </div>
      </div>
      {places.length > 1 && (
        <nav aria-label="Your village" className="border-b border-paper-line bg-cream-100">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-x-1 px-2 sm:px-6">
            {places.map((p) => {
              const current = pathname === p.href.split(/[?#]/)[0];
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-12 items-center px-3 text-[0.9375rem] font-bold",
                      current ? "text-oxblood" : "text-teal underline decoration-1 underline-offset-4 hover:text-teal-deep",
                    )}
                  >
                    {p.label}
                    {current && <span aria-hidden className="absolute inset-x-3 bottom-1 h-[3px] rounded-full bg-brass" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
