"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The Workshop's rooms, as signs hanging from the beam. Plain links (each room is its own page),
 * the current one golden. They wrap onto a second row on phones, so no sign is ever cut off.
 * The emergency reveal is shown, locked, until names are drawn.
 */
export function OrganizerNav({ groupId, drawn }: { groupId: string; drawn: boolean }) {
  const pathname = usePathname();
  const base = `/o/${groupId}`;
  const items = [
    { href: base, label: "Workbench" },
    { href: `${base}/settings`, label: "Settings" },
    { href: `${base}/exclusions`, label: "Exclusions" },
    { href: `${base}/draw`, label: "Draw names" },
    { href: `${base}/emergency`, label: "Emergency reveal", locked: !drawn },
  ];

  return (
    <nav aria-label="Workshop rooms" className="mt-6 pb-4 md:pb-0">
      <ul className="flex flex-wrap gap-2 md:flex-nowrap">
        {items.map((item) => {
          const current = pathname === item.href;
          if (item.locked) {
            return (
              <li key={item.href} className="shrink-0">
                <span className="inline-flex min-h-11 items-center gap-1.5 px-3.5 text-[0.9375rem] font-bold text-midnight-soft md:min-h-12 md:px-4">
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
                  // Phones: wrapping signs. From md: the approved folder tabs, the current one joined to the room.
                  "relative inline-flex min-h-11 items-center rounded-xl border-2 border-midnight px-3.5 text-[0.9375rem] font-bold transition-colors duration-200",
                  "md:-mb-[2.5px] md:min-h-12 md:rounded-b-none md:rounded-t-xl md:border-[2.5px] md:border-b-0 md:px-4",
                  current
                    ? "bg-golden text-midnight md:border-midnight md:bg-[#F6EBD6]"
                    : "bg-paper text-evergreen md:border-transparent md:bg-transparent md:underline md:decoration-2 md:underline-offset-4 md:hover:bg-paper/60",
                )}
              >
                {item.label}
                {current && <span aria-hidden className="absolute inset-x-3 top-1.5 hidden h-1 rounded-full bg-golden md:block" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
