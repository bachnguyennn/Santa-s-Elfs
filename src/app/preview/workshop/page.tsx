import { Check, Copy, Gift, Lock, MailCheck, MailWarning, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/ui/page-shell";
import { C, line } from "@/components/village/art";
import { VillageFooter, VillageLogo, villageButton as vb } from "@/components/village/village-chrome";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Preview · Workshop" };

/* Fictional group for the preview. */
const GROUP = {
  name: "Maple Street Cousins",
  organizer: "Priya Raman",
  budget: "$40 – $60 CAD",
  exchange: "Sunday, December 20",
  draw: "Tuesday, December 1 at 7:00 pm (Toronto)",
  signups: "Monday, November 30 at 11:59 pm",
  invite: "https://santaelf.app/j/MAPLE-7QX4",
};

/** Mirrors OrganizerParticipantDTO.lastEmail: the latest email's template and delivery status. */
type Template = "participant_welcome" | "join_approved" | "participant_recovery";
type Person = { name: string; email: string; organizer?: boolean; wishlist: boolean; email_: "sent" | "failed" | "sending"; template: Template };
const PEOPLE: Person[] = [
  { name: "Priya Raman", email: "priya.r@example.com", organizer: true, wishlist: true, email_: "sent", template: "participant_welcome" },
  { name: "Tomás Ortega", email: "tomas.ortega@example.com", wishlist: true, email_: "sent", template: "join_approved" },
  { name: "Margaret Okonkwo-Fitzgerald", email: "auntie.mags@example.com", wishlist: false, email_: "sent", template: "join_approved" },
  { name: "Jonah Lee", email: "jonah@example.com", wishlist: true, email_: "sent", template: "join_approved" },
  { name: "Mei Chen", email: "mei.chen@example.com", wishlist: true, email_: "sent", template: "join_approved" },
  { name: "Sam Whitaker", email: "sam.whitaker@exmaple.com", wishlist: false, email_: "failed", template: "join_approved" },
  { name: "Lina Haddad", email: "lina.h@example.com", wishlist: true, email_: "sent", template: "participant_recovery" },
  { name: "Oskar Nilsson", email: "oskar.n@example.com", wishlist: false, email_: "sending", template: "join_approved" },
  { name: "Rosie Delgado", email: "rosie.d@example.com", wishlist: true, email_: "sent", template: "join_approved" },
];
const PENDING = { name: "Theo Brandt", email: "theo.brandt@example.com", asked: "2 hours ago" };

const ROOMS = [
  { label: "Workbench", current: true },
  { label: "Settings" },
  { label: "Exclusions" },
  { label: "Draw names" },
  { label: "Emergency reveal", locked: true },
];

/** The green arched door and brass bell, carried in from the Workshop's front. */
function DoorAndBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 110" className={className} aria-hidden focusable="false">
      <path d="M8 108V44a37 37 0 0 1 74 0v64z" fill={C.evergreenDeep} {...line} />
      <path d="M14 108V46a31 31 0 0 1 62 0v62z" fill={C.evergreen} {...line} />
      <path d="M30 100V44M45 100V30M60 100V44" stroke={C.evergreenSoft} strokeWidth={5} />
      <circle cx={64} cy={70} r={4} fill={C.golden} {...line} strokeWidth={1.75} />
      <path d="M45 2v8" {...line} strokeWidth={1.75} />
      <path d="M34 26c0-12 4-17 11-17s11 5 11 17z" fill={C.golden} {...line} />
      <circle cx={45} cy={28} r={3} fill={C.goldenDeep} {...line} strokeWidth={1.5} />
    </svg>
  );
}

/** Tools on the bench edge: a parcel, a ball of string, a stack of letters. */
function BenchTools({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 80" className={className} aria-hidden focusable="false">
      <rect x={10} y={22} width={56} height={52} rx={4} fill={C.cranberry} {...line} />
      <rect x={33} y={22} width={10} height={52} fill={C.golden} {...line} strokeWidth={1.75} />
      <path d="M38 22c-10-14-24-8-16 0M38 22c10-14 24-8 16 0" fill={C.golden} {...line} strokeWidth={1.75} />
      <circle cx={100} cy={58} r={16} fill={C.paper} {...line} />
      <path d="M88 52c8-6 18-6 24 0M86 60c10-6 20-6 28 0" fill="none" stroke={C.cranberry} strokeWidth={2} />
      <path d="M116 62c20 4 30 0 40-8" fill="none" stroke={C.cranberry} strokeWidth={2} strokeLinecap="round" />
      <rect x={150} y={50} width={60} height={24} rx={3} fill={C.snow} {...line} />
      <path d="M150 50l30 14 30-14" fill="none" {...line} strokeWidth={1.75} />
      <rect x={156} y={40} width={56} height={22} rx={3} fill={C.paper} {...line} />
      <path d="M156 40l28 12 28-12" fill="none" {...line} strokeWidth={1.75} />
    </svg>
  );
}

function Pin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("absolute size-5", className)} aria-hidden focusable="false">
      <circle cx={10} cy={10} r={7} fill={C.golden} {...line} strokeWidth={2} />
      <circle cx={8} cy={8} r={2} fill={C.paper} />
    </svg>
  );
}

const EMAIL = {
  sent: { icon: MailCheck, text: "sent", cls: "text-midnight-soft" },
  sending: { icon: Send, text: "on its way", cls: "text-midnight-soft" },
  failed: { icon: MailWarning, text: "failed", cls: "font-bold text-cranberry-deep" },
} as const;
const TEMPLATE: Record<Template, string> = {
  participant_welcome: "Welcome email",
  join_approved: "Approval email",
  participant_recovery: "New-link email",
};

export default function WorkshopPreview() {
  const taking = PEOPLE.length;
  return (
    <div className="flex min-h-full flex-col bg-[#F6EBD6] text-midnight">
      <SkipLink />
      <header className="border-b-[2.5px] border-midnight bg-sky">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <VillageLogo />
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-midnight bg-paper px-3 py-1 text-sm font-bold">
            <Lock className="size-3.5" aria-hidden /> Organizer
          </span>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* ───────── Inside the door: name, status, rooms ───────── */}
        <div className="relative border-b-[2.5px] border-midnight bg-[#EFDDBA]">
          {/* the ceiling beam the room signs hang from */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-3 bg-timber" />
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
            <div className="flex items-end gap-4 sm:gap-6">
              <DoorAndBell className="h-20 w-auto shrink-0 sm:h-28" />
              <div className="min-w-0 pb-1">
                <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] break-words [text-wrap:balance]">
                  {GROUP.name}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-midnight-soft">
                  <span className="rounded-full border-2 border-evergreen bg-paper px-2.5 py-0.5 text-sm font-bold text-evergreen">Open for joining</span>
                  <span>Exchange {GROUP.exchange}</span>
                  <span>{taking} taking part</span>
                </p>
              </div>
            </div>

            <nav aria-label="Workshop rooms" className="-mx-4 mt-6 sm:mx-0">
              <ul className="flex gap-2 overflow-x-auto px-4 pb-0 [scrollbar-width:none] sm:px-0">
                {ROOMS.map((r) => (
                  <li key={r.label} className="shrink-0">
                    <Link
                      href="#"
                      aria-current={r.current ? "page" : undefined}
                      aria-disabled={r.locked || undefined}
                      className={cn(
                        "relative -mb-[2.5px] inline-flex min-h-12 items-center gap-1.5 rounded-t-xl border-[2.5px] border-b-0 px-4 text-[0.9375rem] font-bold transition-colors duration-200",
                        r.current
                          ? "border-midnight bg-[#F6EBD6] text-midnight"
                          : r.locked
                            ? "border-transparent text-midnight-soft"
                            : "border-transparent text-evergreen underline decoration-2 underline-offset-4 hover:bg-paper/60",
                      )}
                    >
                      {r.locked && <Lock className="size-3.5" aria-hidden />}
                      {r.label}
                      {r.current && <span aria-hidden className="absolute inset-x-3 top-1.5 h-1 rounded-full bg-golden" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {/* ───────── The workbench: the next step ───────── */}
          <section aria-labelledby="bench-title" className="relative">
            <div className="relative rounded-2xl border-[2.5px] border-midnight bg-paper px-5 pt-5 pb-7 sm:px-8 sm:pt-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 id="bench-title" className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em]">
                    Ready to draw, with one request waiting
                  </h2>
                  <p className="mt-1.5 max-w-[52ch] leading-relaxed text-midnight-soft">
                    The elves draw on <strong className="text-midnight">{GROUP.draw}</strong>. Decide on Theo first, or draw now and
                    leave the request out.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                  <Link href="#" className={cn(vb.base, vb.primary, "w-full sm:w-auto")}>
                    Draw names now
                  </Link>
                  <Link href="#" className={cn(vb.base, vb.secondary, vb.sm, "w-full sm:w-auto")}>
                    Change the draw time
                  </Link>
                </div>
              </div>
              <BenchTools className="pointer-events-none absolute -top-9 right-6 hidden h-12 w-auto lg:block" />
            </div>
            {/* the bench top */}
            <div aria-hidden className="mx-2 h-4 rounded-b-xl border-[2.5px] border-t-0 border-midnight bg-timber" />
          </section>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
            {/* ───────── The noticeboard: people ───────── */}
            <section aria-labelledby="board-title" className="rounded-2xl border-[2.5px] border-midnight bg-timber p-2.5 sm:p-3">
              <div className="rounded-xl bg-[#D9B98C] p-3 sm:p-5">
                <h2 id="board-title" className="sr-only">
                  People
                </h2>

                {/* pending request, pinned on top */}
                <article aria-labelledby="pending-title" className="relative rotate-[-0.6deg] rounded-lg border-[2.5px] border-midnight bg-golden/90 p-4 sm:p-5">
                  <Pin className="-top-2.5 left-1/2 -translate-x-1/2" />
                  <h3 id="pending-title" className="font-display text-lg font-bold">
                    Waiting for you (1)
                  </h3>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold">{PENDING.name}</p>
                      <p className="text-sm break-all text-midnight-soft">
                        {PENDING.email} · asked {PENDING.asked}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={cn(vb.base, vb.evergreen, vb.sm, "flex-1 sm:flex-none")}>
                        <Check aria-hidden /> Approve
                      </button>
                      <button type="button" className={cn(vb.base, vb.secondary, vb.sm, "flex-1 sm:flex-none")}>
                        Decline
                      </button>
                    </div>
                  </div>
                </article>

                {/* the roster sheet */}
                <article aria-labelledby="roster-title" className="relative mt-5 rotate-[0.3deg] rounded-lg border-[2.5px] border-midnight bg-paper">
                  <Pin className="-top-2.5 left-8" />
                  <Pin className="-top-2.5 right-8" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-5 sm:px-5">
                    <h3 id="roster-title" className="font-display text-lg font-bold">
                      Taking part ({taking} of 20)
                    </h3>
                    <p className="text-sm text-midnight-soft">Everyone here goes into the draw.</p>
                  </div>
                  <ul className="mt-2">
                    {PEOPLE.map((p) => {
                      const e = EMAIL[p.email_];
                      return (
                        <li key={p.email} className="flex flex-col gap-2 border-t-2 border-dashed border-snow-shadow px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-x-2 font-bold break-words">
                              {p.name}
                              {p.organizer && (
                                <span className="rounded-full border-2 border-midnight px-2 text-xs font-bold">You · organizer</span>
                              )}
                            </p>
                            <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                              <span className={cn("inline-flex items-center gap-1.5", e.cls)}>
                                <e.icon className="size-4" aria-hidden /> {TEMPLATE[p.template]} {e.text}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-midnight-soft">
                                <Gift className="size-4" aria-hidden /> {p.wishlist ? "Wishlist added" : "No wishlist yet"}
                              </span>
                            </p>
                            {p.email_ === "failed" && (
                              <p className="mt-1 text-sm text-cranberry-deep">
                                We couldn’t deliver to <span className="break-all">{p.email}</span>. Check the spelling with Sam, then resend.
                              </p>
                            )}
                          </div>
                          {!p.organizer && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                className={cn(vb.base, vb.sm, p.email_ === "failed" ? vb.evergreen : vb.quiet)}
                              >
                                Resend link
                              </button>
                              <button type="button" className={cn(vb.base, vb.quiet, vb.sm, "text-midnight-soft")}>
                                Remove<span className="sr-only"> {p.name}</span>
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              </div>
            </section>

            {/* ───────── Shelf: invite, details, emails ───────── */}
            <aside aria-label="Group details" className="flex min-w-0 flex-col gap-6">
              <section aria-labelledby="invite-title" className="village-paper p-5">
                <h2 id="invite-title" className="font-display text-lg font-bold">
                  Invite people
                </h2>
                <label htmlFor="invite" className="mt-3 block text-[0.9375rem] font-bold">
                  Invite link
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="invite"
                    readOnly
                    value={GROUP.invite}
                    className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-midnight bg-white px-3 text-[0.9375rem]"
                  />
                  <button type="button" className={cn(vb.base, vb.secondary, "px-3.5")}>
                    <Copy aria-hidden /> Copy
                  </button>
                </div>
                <p className="mt-2 text-sm text-midnight-soft">You approve each person before they’re in.</p>
              </section>

              <section aria-labelledby="details-title" className="village-paper p-5">
                <div className="flex items-baseline justify-between">
                  <h2 id="details-title" className="font-display text-lg font-bold">
                    The details
                  </h2>
                  <Link href="#" className="inline-flex min-h-11 items-center text-sm font-bold text-evergreen underline decoration-2 underline-offset-4">
                    Edit
                  </Link>
                </div>
                <dl className="mt-1 grid gap-2.5 text-[0.9375rem]">
                  {[
                    ["Budget", GROUP.budget],
                    ["Exchange", GROUP.exchange],
                    ["Signups close", GROUP.signups],
                    ["Drawing", GROUP.draw],
                  ].map(([t, d]) => (
                    <div key={t} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                      <dt className="text-midnight-soft">{t}</dt>
                      <dd>{d}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section aria-labelledby="mail-title" className="village-paper p-5">
                <h2 id="mail-title" className="font-display text-lg font-bold">
                  Emails
                </h2>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Sent", 18, false],
                    ["On their way", 1, false],
                    ["Failed", 1, true],
                  ].map(([t, v, bad]) => (
                    <div key={t as string} className={cn("flex flex-col-reverse rounded-xl border-2 px-2 py-2.5", bad ? "border-cranberry-deep bg-[#FBE7EA]" : "border-snow-shadow bg-snow")}>
                      <dt className={cn("text-xs", bad ? "font-bold text-cranberry-deep" : "text-midnight-soft")}>{t}</dt>
                      <dd className={cn("font-display text-2xl font-bold tabular-nums", bad && "text-cranberry-deep")}>{v as number}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm leading-snug text-midnight-soft">
                  These count single emails, not people. Everyone who joins gets two: one when they ask, one when you approve.
                </p>
              </section>
            </aside>
          </div>

          {/* ───────── The back room: careful tools, kept apart ───────── */}
          <section aria-labelledby="backroom-title" className="mt-14 rounded-2xl border-[2.5px] border-dashed border-cranberry-deep bg-paper/70 p-5 sm:p-6">
            <h2 id="backroom-title" className="font-display text-lg font-bold text-cranberry-deep">
              The back room
            </h2>
            <p className="mt-1 max-w-prose text-[0.9375rem] text-midnight-soft">Tools you can’t undo. Each one asks you to confirm first.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-xl border-2 border-snow-shadow bg-paper p-4">
                <h3 className="inline-flex items-center gap-1.5 font-bold">
                  <Lock className="size-4" aria-hidden /> Emergency reveal
                </h3>
                <p className="text-sm text-midnight-soft">
                  After the draw, look up one person’s match if they disappear. We email you a code and log it.
                </p>
                <p className="text-sm font-bold text-midnight-soft">Available once names are drawn.</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border-2 border-snow-shadow bg-paper p-4">
                <h3 className="font-bold">Delete this group</h3>
                <p className="text-sm text-midnight-soft">Removes everyone’s wishlists and messages right away.</p>
                <button type="button" className={cn(vb.base, vb.danger, vb.sm, "mt-1 self-start")}>
                  Delete group…
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <VillageFooter />
    </div>
  );
}
