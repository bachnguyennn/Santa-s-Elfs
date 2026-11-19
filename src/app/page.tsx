import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { WorkshopEntranceLink } from "@/components/workshop/door-entry";
import { VillageRoute } from "@/components/workshop/village-route";
import { WorkshopScene } from "@/components/workshop/workshop-hero";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "SantaElf: free Secret Santa, drawn by elves" },
};

const STEPS = [
  { title: "Start a group", body: "Name it, set a budget and pick the exchange date. We email you a private organizer link." },
  { title: "Share one invite link", body: "Paste it in the group chat. Approve each person first if you like." },
  { title: "Keep a few people apart", body: "Add exclusions so partners or housemates don’t draw each other." },
  { title: "Let the elves draw", body: "Draw now or at a set time. Everyone opens a sealed envelope with their person inside." },
];

const RULES = [
  { title: "Nobody sees the full list", body: "Not even the organizer. If someone disappears, the organizer can look up that one match with a code sent to their email, and it’s logged." },
  { title: "People may still guess", body: "Your person sees your secret alias, not your name. In a small group they might still work it out from your messages or your gift." },
  { title: "Free, for 3 to 20 people", body: "No accounts, no app to install, no paid tier. Your private link is your key." },
  { title: "Gone after the gifts", body: "Groups and everything in them are deleted automatically 60 days after the exchange." },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* ───────── The Workshop bench: Santa and the elf pull the ribbon tight ───────── */}
        <section aria-labelledby="hero-title" className="on-dark relative overflow-hidden bg-oxblood text-buttercream">
          <div className="relative mx-auto max-w-[1672px]">
            <div className="relative z-10 px-4 pt-6 pb-2 sm:px-8 sm:pt-10 xl:absolute xl:inset-y-0 xl:left-0 xl:flex xl:w-[34%] xl:flex-col xl:justify-start xl:pt-[6.5%] xl:pr-0 xl:pb-0 xl:pl-[4%]">
              <h1 id="hero-title" className="font-display text-[clamp(2.75rem,11vw,3.5rem)] leading-[0.92] font-bold [text-wrap:balance] sm:text-[clamp(3.5rem,8vw,5.5rem)] xl:text-[min(5.6vw,5.5rem)]">
                Secret Santa starts here.
              </h1>
              <p className="mt-4 max-w-[34ch] text-lg leading-snug text-buttercream/90 sm:text-xl">
                Start a group, share one invite link, and the elves draw names. Free, no accounts, for 3 to 20 people.
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <WorkshopEntranceLink className={cn(buttonVariants({ variant: "light", size: "lg" }), "w-full shrink-0 sm:w-auto")}>Start a group</WorkshopEntranceLink>
                <p className="max-w-[26ch] text-[0.9375rem] leading-snug text-buttercream/85">Got an invitation? Open the private link you were sent.</p>
              </div>
            </div>
            <div className="relative overflow-hidden xl:overflow-visible">
              <WorkshopScene className="-ml-[8%] w-[118%] sm:-ml-[4%] sm:w-[108%] xl:ml-0 xl:w-full" />
            </div>
          </div>
        </section>

        {/* ───────── Down the ribbon to the village ───────── */}
        <VillageRoute
          heading="Follow the ribbon"
          intro={
            <p>
              Each building does one job. Organizers start in the Workshop, and the Post Office resends lost links. Once you’re in a group, your
              envelope, letters and wishlist live on your own street.
            </p>
          }
        />

        {/* ───────── The notice on the Workshop door ───────── */}
        <section aria-labelledby="how-title" className="bg-parchment">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-12">
            <div className="rounded-lg border border-paper-line bg-cream-50 p-6 shadow-[var(--shadow-paper)] sm:p-8">
              <h2 id="how-title" className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[0.95] font-bold text-oxblood">
                How it works
              </h2>
              <ol className="mt-5 divide-y divide-line">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4 py-4">
                    <span aria-hidden className="font-display text-3xl leading-none font-bold text-persimmon-dark">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-ink">
                        <span className="sr-only">Step {i + 1}: </span>
                        {s.title}
                      </h3>
                      <p className="mt-1 leading-relaxed text-ink-700">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <WorkshopEntranceLink className={cn(buttonVariants({ variant: "primary" }), "mt-4 w-full sm:w-auto")}>Start a group</WorkshopEntranceLink>
            </div>
            <div className="rounded-lg bg-teal-wash p-6 text-ink sm:p-8">
              <h2 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[0.95] font-bold text-teal-deep">Private by design</h2>
              <ul className="mt-5 divide-y divide-pine-300/60">
                {RULES.map((r) => (
                  <li key={r.title} className="py-4">
                    <h3 className="font-bold">{r.title}</h3>
                    <p className="mt-1 leading-relaxed text-ink-700">{r.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter showHome={false} />
    </div>
  );
}
