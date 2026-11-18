import { CalendarClock, KeyRound, Link2, ShieldCheck, Trash2, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChristmasCardReveal } from "@/components/brand/christmas-card";
import { Elf } from "@/components/brand/elf";
import { GiftBox } from "@/components/brand/gift-box";
import { Logo } from "@/components/brand/logo";
import { Holly, Sparkle, Star, Thread } from "@/components/brand/motifs";
import { NameHat } from "@/components/brand/name-hat";
import { HandName, PaperSlip } from "@/components/brand/paper-slip";
import { Button } from "@/components/ui/button";
import { SiteFooter, SkipLink } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: { absolute: "SantaElf — free Secret Santa, drawn by elves" },
};

const STEPS = [
  {
    title: "Start a group",
    body: "Give it a name, a budget and an exchange date. You get a private organizer link. No password to make up.",
    tilt: -2,
  },
  {
    title: "Share one invite link",
    body: "Paste it in the family chat. People join with a name and email, and you can approve each one if you like.",
    tilt: 1.5,
  },
  {
    title: "The elves draw names",
    body: "Draw now or set a date and time. Add exclusions so partners don’t draw each other. Nobody sees the full list, you included.",
    tilt: -1,
  },
  {
    title: "Unwrap and chat",
    body: "Everyone opens a Christmas card with their person and a secret alias, adds a wishlist, and can message their Santa anonymously.",
    tilt: 2,
  },
] as const;

const ALIASES = ["Rudolph", "Dasher", "Tinsel", "Sugarplum", "Cocoa", "Northstar"];

const PROMISES = [
  { icon: KeyRound, title: "Your link is your key", body: "Each person gets a private link by email. Lost it? We send a fresh one to the same address." },
  { icon: Users, title: "Free, for 3 to 20 people", body: "No accounts, no app to install, no paid tier." },
  {
    icon: ShieldCheck,
    title: "The organizer can’t peek",
    body: "Organizers run the group but never see the pairings. If someone vanishes, they can look up that one person’s match with a code sent to their email, and it’s logged.",
  },
  { icon: Trash2, title: "Gone after the gifts", body: "Groups and everything in them are deleted automatically 60 days after the exchange." },
] as const;

export default function Home() {
  return (
    <>
      <SkipLink />

      <header className="felt on-pine relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
          <Logo tone="light" />
          <Link
            href="/recover"
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-pine-200 underline decoration-gold-400/60 underline-offset-4 hover:text-cream-50 hover:decoration-gold-400"
          >
            Lost your link?
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* ───────── Hero: felt, the hat, the slip ───────── */}
        <div className="felt on-pine relative -mt-px overflow-hidden text-cream-50">
          <section
            aria-labelledby="hero-title"
            className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-6 pb-0 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-4 lg:pt-14"
          >
            {/* scattered stars on the felt */}
            <Star className="absolute top-4 right-[8%] size-4 text-gold-400 motion-safe:animate-twinkle" />
            <Sparkle className="absolute top-[30%] right-[44%] hidden size-3 text-gold-400/80 lg:block" />
            <Star className="absolute bottom-[38%] left-[2%] hidden size-3 text-gold-400/70 sm:block" />

            <PaperSlip tilt={-1.5} className="relative z-10 mb-2 max-w-2xl p-6 sm:p-9 lg:mb-16">
              <span aria-hidden className="absolute -top-3 left-8 h-6 w-16 -rotate-3 rounded-sm bg-gold-200/90 shadow-sm" />
              <h1
                id="hero-title"
                className="font-display text-[clamp(2.5rem,7.5vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-pine-900 [text-wrap:balance]"
              >
                Secret Santa, drawn by <span className="text-berry-600">elves</span>.
              </h1>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-700 sm:text-xl">
                Invite your group with one link. The elves draw names, give every Santa a secret Christmas alias, and keep
                who-has-whom off everyone’s screen. The organizer’s too.
              </p>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button asChild variant="festive" size="lg" className="w-full sm:w-auto">
                  <Link href="/new">Start a group</Link>
                </Button>
                <p className="text-sm text-ink-500">
                  Free · No accounts · <span className="whitespace-nowrap">3 to 20 people</span>
                </p>
              </div>
            </PaperSlip>

            <div className="relative mx-auto -mt-2 w-full max-w-md lg:mx-0 lg:mt-0 lg:max-w-none" aria-hidden>
              <div className="relative ml-auto w-[88%] translate-y-[8%] lg:w-full lg:translate-y-[6%]">
                <NameHat />
              </div>
              <Elf pose="hold" className="absolute bottom-[6%] left-[-2%] h-[58%] lg:left-[-14%]" />
            </div>
          </section>
        </div>

      {/* ───────── How it works: tags on a gold thread ───────── */}
      <section aria-labelledby="how-title" className="relative bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:pb-28">
          <div className="max-w-2xl">
            <h2 id="how-title" className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900">
              How it works
            </h2>
            <p className="mt-3 text-lg text-ink-700">Four steps, and the elves do the fiddly one.</p>
          </div>

          <ol className="relative mt-10 grid gap-6 pl-10 sm:pl-12 lg:mt-16 lg:grid-cols-4 lg:gap-5 lg:pt-6 lg:pl-0">
            {/* the thread: vertical on phones, a garland on desktop */}
            <Thread orientation="vertical" className="absolute top-0 bottom-0 left-1 text-gold-500 lg:hidden" />
            <Thread className="absolute -top-2 right-0 left-0 hidden text-gold-500 lg:block" />
            {STEPS.map((s, i) => (
              <li key={s.title} className={`relative lg:pt-6 ${i % 2 ? "lg:[--drop:2rem]" : ""}`}>
                {/* the knot that ties the tag to the thread */}
                <span aria-hidden className="absolute top-7 -left-[2.1rem] h-0.5 w-[2.1rem] bg-gold-500 sm:-left-[2.6rem] sm:w-[2.6rem] lg:-top-3 lg:left-10 lg:h-[calc(1.5rem+0.75rem+var(--drop,0rem))] lg:w-0.5" />
                <span aria-hidden className="absolute top-[1.45rem] -left-[2.45rem] size-3 rounded-full border-2 border-gold-500 bg-cream-50 sm:-left-[2.95rem] lg:-top-4 lg:left-[2.2rem]" />
                <PaperSlip
                  tilt={s.tilt}
                  className={`h-full p-5 transition-[rotate] duration-300 ease-[var(--ease-out-quint)] hover:rotate-0 ${i % 2 ? "lg:mt-8" : ""}`}
                >
                  <p className="font-hand text-2xl font-bold text-berry-600" aria-hidden>
                    {i + 1}.
                  </p>
                  <h3 className="mt-1 font-display text-xl leading-tight font-bold tracking-[-0.015em] text-pine-900">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink-700">{s.body}</p>
                  {i === 2 && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                      <CalendarClock className="size-4 text-pine-700" aria-hidden /> Manual or scheduled
                    </p>
                  )}
                  {i === 1 && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                      <Link2 className="size-4 text-pine-700" aria-hidden /> One link for everyone
                    </p>
                  )}
                  {i === 3 && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                      <GiftBox tone="berry" className="size-5" /> Wishlists with links
                    </p>
                  )}
                  {i === 0 && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                      <Holly className="h-4" /> Takes about two minutes
                    </p>
                  )}
                </PaperSlip>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── The reveal: try the card ───────── */}
      <section aria-labelledby="reveal-title" className="felt on-pine text-cream-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="reveal-title" className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              No spreadsheet. A card with your name on it.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-pine-200">
              When the names are drawn, everyone gets an email. Their link opens a sealed Christmas card: who they’re buying for,
              and the alias they’ll sign messages with.
            </p>
            <div className="mt-8">
              <p className="text-sm font-bold text-pine-300">Each Santa gets one of 20 aliases, like</p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Example aliases">
                {ALIASES.map((a, i) => (
                  <li key={a}>
                    <PaperSlip tilt={i % 2 ? 2 : -2} className="px-3 py-1.5">
                      <HandName className="text-lg text-pine-900">{a}</HandName>
                    </PaperSlip>
                  </li>
                ))}
              </ul>
            </div>

            {/* sample chat */}
            <figure className="mt-10 max-w-md">
              <figcaption className="text-sm font-bold text-pine-300">Then ask anything, anonymously</figcaption>
              <div className="mt-3 space-y-2">
                <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-cream-50 px-4 py-2.5 text-ink-900">
                  <span className="block text-xs font-bold text-berry-700">Dasher · your Secret Santa</span>
                  Is your mug collection complete, or is there room for one more?
                </p>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-pine-700 px-4 py-2.5 text-cream-50">
                  <span className="block text-xs font-bold text-gold-200">You</span>
                  Always room. Something green, please!
                </p>
              </div>
            </figure>
          </div>

          <div className="text-gold-200">
            <ChristmasCardReveal recipientName="Grandma Rosie" alias="Dasher" label="Example card" />
          </div>
        </div>
      </section>

      {/* ───────── Promise: honest privacy ───────── */}
      <section aria-labelledby="promise-title" className="bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <h2 id="promise-title" className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900">
                No accounts. No passwords. Just your link.
              </h2>
              <PaperSlip tilt={-1} className="mt-8 max-w-md p-5">
                <p className="font-display text-lg font-bold text-pine-900">An honest note about secrets</p>
                <p className="mt-2 leading-relaxed text-ink-700">
                  SantaElf never shows your name to the person you’re buying for. But in a small group, people can still
                  guess: from how you write, what you give, or a knowing smile at dinner.
                </p>
              </PaperSlip>
            </div>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {PROMISES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="border-t-2 border-pine-800/15 pt-5">
                  <Icon className="size-6 text-berry-600" aria-hidden />
                  <h3 className="mt-3 font-display text-lg font-bold tracking-[-0.01em] text-pine-900">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-700">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Close ───────── */}
      <section aria-labelledby="close-title" className="felt on-pine relative overflow-hidden text-cream-50">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
          <Elf pose="wave" className="h-32 sm:h-36" />
          <h2 id="close-title" className="mt-4 font-display [text-wrap:balance] text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
            The elves are ready when you are.
          </h2>
          <p className="mt-3 max-w-md text-lg text-pine-200">Set up your group now and send the link tonight.</p>
          <Button asChild variant="festive" size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/new">Start a group</Link>
          </Button>
        </div>
      </section>

      </main>

      <SiteFooter />
    </>
  );
}
