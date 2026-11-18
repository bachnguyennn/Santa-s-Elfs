/**
 * Timezone helpers (client + server safe, no dependencies).
 * Organizers pick wall-clock times in the group's timezone; we persist UTC.
 */

export function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset (ms) of `tz` from UTC at instant `date`. */
function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convert "YYYY-MM-DDTHH:mm" wall time in `tz` to a UTC Date. */
export function zonedWallTimeToUtc(local: string, tz: string): Date {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  // Two passes handle DST transitions.
  let ts = guess - tzOffsetMs(new Date(guess), tz);
  ts = guess - tzOffsetMs(new Date(ts), tz);
  return new Date(ts);
}

/** Convert a UTC instant to "YYYY-MM-DDTHH:mm" wall time in `tz` (for form inputs). */
export function utcToZonedWallTime(iso: string | Date, tz: string): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const shifted = new Date(date.getTime() + tzOffsetMs(date, tz));
  return shifted.toISOString().slice(0, 16);
}

/** Human-friendly date/time in the group's timezone, e.g. "Fri, Dec 12, 7:00 PM EST". */
export function formatInZone(iso: string, tz: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    ...opts,
  }).format(new Date(iso));
}

/** Format a YYYY-MM-DD date without timezone shifting, e.g. "Wed, Dec 24". */
export function formatDateOnly(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Format cents in a currency, e.g. 2500, "USD" -> "$25". */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
