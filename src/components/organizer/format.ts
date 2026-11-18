import { MIN_PARTICIPANTS, type GroupPublicDTO, type GroupStatus } from "@/lib/contracts";
import { formatDateOnly, formatInZone, formatMoney } from "@/lib/time";

/** "$20–$40", "Up to $30", "At least $10", or null when no budget was set. */
export function budgetLabel(g: Pick<GroupPublicDTO, "budgetMinCents" | "budgetMaxCents" | "currency">): string | null {
  const { budgetMinCents: min, budgetMaxCents: max, currency } = g;
  if (min !== null && max !== null) return min === max ? formatMoney(min, currency) : `${formatMoney(min, currency)}–${formatMoney(max, currency)}`;
  if (max !== null) return `Up to ${formatMoney(max, currency)}`;
  if (min !== null) return `At least ${formatMoney(min, currency)}`;
  return null;
}

export function drawLabel(g: Pick<GroupPublicDTO, "drawMethod" | "drawAt" | "timezone">): string {
  if (g.drawMethod === "scheduled" && g.drawAt) return `The elves draw automatically on ${formatInZone(g.drawAt, g.timezone)}`;
  return "You draw names when everyone’s in";
}

export function exchangeLabel(date: string | null): string | null {
  return date ? formatDateOnly(date) : null;
}

export const STATUS_LABEL: Record<GroupStatus, { text: string; tone: "green" | "gold" | "neutral" }> = {
  open: { text: "Open for joining", tone: "green" },
  drawn: { text: "Names drawn", tone: "gold" },
  closed: { text: "Exchange closed", tone: "neutral" },
};

/** Turn a stored scheduled-draw failure into what happened + what to fix. */
export function friendlyDrawError(raw: string): string {
  if (/exclusion/i.test(raw)) return "Your exclusions didn’t leave a fair way to match everyone. Loosen one rule, then draw again or pick a new time.";
  if (/at least|participants/i.test(raw)) return `There weren’t enough people taking part. You need at least ${MIN_PARTICIPANTS} approved people.`;
  return raw;
}
