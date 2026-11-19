"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The Workshop's rooms, as signs hanging from the beam. Plain links (each room is its own page),
 * the current one marked. The emergency reveal is shown, locked, until names are drawn.
 */
export function OrganizerNav({ groupId, drawn }: { groupId: string; drawn: boolean }) {
  const pathname = usePathname();
  const listRef = React.useRef<HTMLUListElement>(null);
  // On narrow screens the signs scroll sideways: keep the current one in view.
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  const base = `/o/${groupId}`;
  const items = [
    { href: base, label: "Workbench" },
    { href: `${base}/settings`, label: "Settings" },
    { href: `${base}/exclusions`, label: "Exclusions" },
    { href: `${base}/draw`, label: "Draw names" },
    { href: `${base}/emergency`, label: "Emergency reveal", locked: !drawn },
  ];

  return (
    <nav aria-label="Workshop rooms" className="-mx-4 mt-6 sm:mx-0">
      <ul ref={listRef} className="relative flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const current = pathname === item.href;
          if (item.locked) {
            return (
              <li key={item.href} className="shrink-0">
                <span className="inline-flex min-h-12 items-center gap-1.5 px-4 text-[0.9375rem] font-bold text-midnight-soft">
                  <Lock className="size-3.5" aria-hidden /> {item.label}
                  <span className="sr-only"> (available after the draw)</span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative -mb-[2.5px] inline-flex min-h-12 items-center rounded-t-xl border-[2.5px] border-b-0 px-4 text-[0.9375rem] font-bold transition-colors duration-200",
                  current
                    ? "border-midnight bg-[#F6EBD6] text-midnight"
                    : "border-transparent text-evergreen underline decoration-2 underline-offset-4 hover:bg-paper/60",
                )}
              >
                {item.label}
                {current && <span aria-hidden className="absolute inset-x-3 top-1.5 h-1 rounded-full bg-golden" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
