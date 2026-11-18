"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Section tabs for the organizer area. Plain links (each section is its own page), current one marked. */
export function OrganizerNav({ groupId, drawn }: { groupId: string; drawn: boolean }) {
  const pathname = usePathname();
  const listRef = React.useRef<HTMLUListElement>(null);
  // On narrow screens the tabs scroll sideways: keep the current one in view.
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  const base = `/o/${groupId}`;
  const items = [
    { href: base, label: "Overview" },
    { href: `${base}/settings`, label: "Settings" },
    { href: `${base}/exclusions`, label: "Exclusions" },
    { href: `${base}/draw`, label: "Draw" },
    ...(drawn ? [{ href: `${base}/emergency`, label: "Emergency" }] : []),
  ];

  return (
    <nav aria-label="Organizer sections" className="-mx-4 mt-6 border-b border-line sm:mx-0">
      <ul ref={listRef} className="flex overflow-x-auto px-2 sm:gap-1 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-12 items-center rounded-t-lg px-2.5 text-sm sm:text-[0.9375rem] transition-colors duration-200 sm:px-4",
                  current ? "font-bold text-pine-900" : "text-ink-700 hover:bg-cream-100 hover:text-pine-900",
                )}
              >
                {item.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-[3px] rounded-full transition-colors duration-200",
                    current ? "bg-gold-500" : "bg-transparent",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
