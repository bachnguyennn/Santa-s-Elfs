import { CalendarClock, Gift, Shuffle, UserCheck, Wallet } from "lucide-react";
import * as React from "react";
import type { GroupPublicDTO } from "@/lib/contracts";
import { formatDateOnly, formatInZone, formatMoney } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent (participant flows). Shared, read-only group summary.
 * Safe for any member of the group and the public invite page (GroupPublicDTO only).
 * Server or client: pure formatting, dates shown in the group's timezone.
 */

/** "$20–$40", "Up to $40", "From $20" or null when no budget is set. */
export function formatBudget(g: Pick<GroupPublicDTO, "budgetMinCents" | "budgetMaxCents" | "currency">): string | null {
  const { budgetMinCents: min, budgetMaxCents: max, currency } = g;
  if (min !== null && max !== null) return min === max ? formatMoney(max, currency) : `${formatMoney(min, currency)}–${formatMoney(max, currency)}`;
  if (max !== null) return `Up to ${formatMoney(max, currency)}`;
  if (min !== null) return `From ${formatMoney(min, currency)}`;
  return null;
}

/** One sentence about when names get drawn. */
export function describeDrawing(g: Pick<GroupPublicDTO, "drawMethod" | "drawAt" | "timezone" | "organizerName">): string {
  if (g.drawMethod === "scheduled" && g.drawAt) return `The elves draw names on ${formatInZone(g.drawAt, g.timezone)}.`;
  return `${g.organizerName} will start the drawing when everyone has joined.`;
}

export function GroupFacts({
  group,
  className,
  showApproval = true,
}: {
  group: GroupPublicDTO;
  className?: string;
  /** Hide the "organizer approves each person" row (e.g. for already-approved members). */
  showApproval?: boolean;
}) {
  const budget = formatBudget(group);
  const rows: { icon: React.ElementType; term: string; value: string }[] = [
    { icon: Wallet, term: "Budget", value: budget ?? "No budget set" },
    {
      icon: Gift,
      term: "Gift exchange",
      value: group.exchangeDate ? formatDateOnly(group.exchangeDate) : "Date to be decided",
    },
    {
      icon: Shuffle,
      term: "Drawing names",
      value:
        group.drawMethod === "scheduled" && group.drawAt
          ? formatInZone(group.drawAt, group.timezone)
          : `When ${group.organizerName} starts it`,
    },
  ];
  if (group.signupDeadline) {
    rows.push({ icon: CalendarClock, term: "Signups close", value: formatInZone(group.signupDeadline, group.timezone) });
  }
  if (showApproval && group.requiresApproval) {
    rows.push({ icon: UserCheck, term: "Joining", value: `${group.organizerName} approves each person` });
  }

  return (
    <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {rows.map(({ icon: Icon, term, value }) => (
        <div key={term} className="relative min-h-9 pl-12">
          <dt className="text-sm text-ink-500">
            <span aria-hidden className="absolute top-0.5 left-0 grid size-9 place-items-center rounded-full bg-pine-100 text-pine-800">
              <Icon className="size-[1.1rem]" />
            </span>
            {term}
          </dt>
          <dd className="font-bold text-ink-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The organizer's rules/notes, if any. Preserves line breaks. */
export function GroupRules({ group, className }: { group: Pick<GroupPublicDTO, "rules" | "organizerName">; className?: string }) {
  if (!group.rules) return null;
  return (
    <div className={className}>
      <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-pine-900">Notes from {group.organizerName}</h3>
      <p className="mt-2 leading-relaxed whitespace-pre-line text-ink-700">{group.rules}</p>
    </div>
  );
}
