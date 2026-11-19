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
    <nav aria-label="Workshop rooms" className="mt-6 pb-4">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const current = pathname === item.href;
          if (item.locked) {
            return (
              <li key={item.href} className="shrink-0">
                <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-dashed border-midnight-soft/50 px-3.5 text-[0.9375rem] font-bold text-midnight-soft">
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
                  "inline-flex min-h-11 items-center rounded-xl border-2 border-midnight px-3.5 text-[0.9375rem] font-bold transition-[background-color,transform] duration-200 hover:-translate-y-0.5",
                  current ? "bg-golden text-midnight" : "bg-paper text-evergreen underline decoration-2 underline-offset-4",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
