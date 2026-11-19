"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The Workshop's rooms: plain links (each room is its own page), the current one in wine with a brass
 * underline. They wrap on phones, so no label is cut off. The emergency reveal stays locked until the draw.
 */
export function OrganizerNav({ groupId, drawn }: { groupId: string; drawn: boolean }) {
  const pathname = usePathname();
  const base = `/o/${groupId}`;
  const items = [
    { href: base, label: "Workbench" },
    { href: `${base}/draw`, label: "Draw names" },
    { href: `${base}/exclusions`, label: "Exclusions" },
    { href: `${base}/settings`, label: "Settings" },
    { href: `${base}/emergency`, label: "Emergency reveal", locked: !drawn },
  ];

  return (
    <nav aria-label="Workshop rooms">
      <ul className="flex flex-wrap gap-x-1 gap-y-0">
        {items.map((item) => {
          const current = pathname === item.href;
          if (item.locked) {
            return (
              <li key={item.href}>
                <span className="inline-flex min-h-12 items-center gap-1.5 px-3 text-[0.9375rem] font-bold text-ink-500">
                  <Lock className="size-3.5" aria-hidden /> {item.label}
                  <span className="sr-only"> (available after the draw)</span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-12 items-center px-3 text-[0.9375rem] font-bold transition-colors duration-200",
                  current ? "text-oxblood" : "text-teal underline decoration-1 underline-offset-4 hover:text-teal-deep",
                )}
              >
                {item.label}
                {current && <span aria-hidden className="absolute inset-x-3 bottom-1 h-[3px] rounded-full bg-brass" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
