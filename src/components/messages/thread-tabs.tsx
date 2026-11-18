import Link from "next/link";
import type { Thread } from "@/lib/contracts";
import { cn } from "@/lib/utils";

/** Two conversations as a segmented control. Each tab is a link (?thread=…), so it works without JS. */
export function ThreadTabs({ participantId, current }: { participantId: string; current: Thread }) {
  const tabs: { id: Thread; label: string }[] = [
    { id: "recipient", label: "My recipient" },
    { id: "santa", label: "My Secret Santa" },
  ];
  return (
    <nav aria-label="Conversations" className="mb-6">
      <ul className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-cream-100 p-1">
        {tabs.map((t) => {
          const active = t.id === current;
          return (
            <li key={t.id}>
              <Link
                href={`/p/${participantId}/messages?thread=${t.id}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-xl px-3 text-center text-[0.9375rem] transition-[background-color,color,box-shadow] duration-200",
                  active ? "bg-cream-50 font-bold text-pine-900 shadow-[var(--shadow-paper)]" : "text-ink-700 hover:bg-cream-200/70 hover:text-pine-900",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
