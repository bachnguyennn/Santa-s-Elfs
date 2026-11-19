import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/ui/page-shell";
import { BuildingLink } from "@/components/village/building-link";
import { PathBand, PostOfficeArt, SquareSceneNarrow, SquareSceneWide, WorkshopArt } from "@/components/village/scenes";
import { SnowLayer, SnowToggle } from "@/components/village/snow";
import { VillageFooter, VillageLogo, villageButton as vb } from "@/components/village/village-chrome";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "SantaElf: free Secret Santa, drawn by elves" },
};

const WORKSHOP_STEPS = [
  { title: "Start a group", body: "Name it, set a budget and pick the exchange date. We email you a private organizer link." },
  { title: "Share one invite link", body: "Paste it in the group chat. You can approve each person before they’re in." },
  { title: "Add exclusions", body: "Keep partners or housemates from drawing each other." },
  { title: "Let the elves draw", body: "Draw now or schedule it. Nobody sees the full list of who drew whom, you included." },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-snow text-midnight">
      <SkipLink />

      {/* ───────── Village Square ───────── */}
      <header className="relative z-20 bg-sky">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
            <VillageLogo />
            <SnowToggle />
          </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
          <section aria-labelledby="square-title" className="relative bg-sky lg:h-[44rem]">
            <SnowLayer className="top-0 right-0 hidden h-[24rem] w-[48%] lg:block" />

            <div className="relative z-10 mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6 lg:pt-16">
              <div className="max-w-[36rem]">
                <h1
                  id="square-title"
                  className="font-display text-[clamp(2.6rem,8vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.035em] [text-wrap:balance]"
                >
                  Secret Santa, drawn by <span className="text-cranberry">elves</span>.
                </h1>
                <p className="mt-4 max-w-[32rem] text-lg leading-snug sm:mt-5 sm:text-xl sm:leading-relaxed">
                  Start a group and share one invite link. The elves draw names, and everyone opens a sealed envelope with their
                  person inside.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center">
                  <Link href="/new" className={cn(vb.base, vb.primary, vb.lg, "w-full sm:w-auto")}>
                    Start a group
                  </Link>
                  <Link href="/recover" className={cn(vb.base, vb.secondary, vb.lg, "w-full sm:w-auto")}>
                    Recover my link
                  </Link>
                </div>
                <p className="mt-3 text-[0.9375rem] font-bold text-midnight-soft sm:mt-4">Free · No accounts · 3 to 20 people</p>
                <p className="mt-3 inline-block rounded-xl border-2 border-midnight bg-paper px-3.5 py-2 text-[0.9375rem] leading-snug sm:mt-5 sm:px-4 sm:py-3">
                  <span className="sm:hidden">Already invited? Open your invite link.</span>
                  <span className="hidden sm:inline">
                    Invited to a group? Open the invitation link you were sent. It takes you straight to the welcome desk.
                  </span>
                </p>
              </div>
            </div>

            {/* the square itself */}
            <div className="relative -mt-2 lg:hidden">
              <SnowLayer className="inset-x-0 top-0 h-1/2" density={0.5} />
              <SquareSceneNarrow className="block h-auto w-full" />
            </div>
            <SquareSceneWide className="absolute inset-x-0 bottom-0 hidden h-[32.5rem] w-full lg:block" />
          </section>

      {/* ───────── Workshop Lane ───────── */}
      <section aria-labelledby="workshop-title" className="relative bg-snow">
        <PathBand className="absolute inset-x-0 top-0 h-24 w-full" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-14 lg:pt-0 lg:pb-24">
          <BuildingLink
            href="/new"
            name="Workshop"
            purpose="Start a group"
            art={<WorkshopArt className="-mt-3 h-auto w-full" />}
            className="mx-auto w-full max-w-[34rem] lg:order-1 lg:-mt-28"
          />
          <div className="lg:order-2 lg:pt-10">
            <h2 id="workshop-title" className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]">
              Organizers work in the Workshop
            </h2>
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight-soft">
              Set up your group on the workbench. It takes about two minutes.
            </p>
            <ol className="village-paper mt-6 divide-y-2 divide-dashed divide-snow-shadow px-5 py-2 sm:px-6">
              {WORKSHOP_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4 py-4">
                  <span aria-hidden className="font-hand text-2xl leading-none font-bold text-cranberry">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg leading-tight font-bold">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.title}
                    </h3>
                    <p className="mt-1 leading-relaxed text-midnight-soft">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────── Post Office ───────── */}
      <section aria-labelledby="post-title" className="relative bg-snow">
        <PathBand flip className="absolute inset-x-0 top-0 h-24 w-full" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end lg:gap-14 lg:pb-24">
          <div className="lg:pb-6">
            <h2 id="post-title" className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]">
              Letters signed with a secret alias
            </h2>
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight-soft">
              Each Santa gets an alias like Dasher or Tinsel. Ask your person about sizes or favourite colours, and they only see
              the alias.
            </p>
            <figure className="mt-6 max-w-md">
              <div className="space-y-2">
                <p className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md border-2 border-midnight bg-paper px-4 py-2.5">
                  <span className="block text-xs font-bold text-evergreen">You, signed as Dasher</span>
                  Is there room on your shelf for one more mug?
                </p>
                <p className="w-fit max-w-[88%] rounded-2xl rounded-bl-md border-2 border-midnight bg-sky px-4 py-2.5">
                  <span className="block text-xs font-bold text-cranberry-deep">Grandma Rosie</span>
                  Always. Something green, please!
                </p>
              </div>
              <figcaption className="mt-3 text-[0.9375rem] text-midnight-soft">
                Example conversation. In a small group, people can still guess from your messages or your gift.
              </figcaption>
            </figure>
          </div>
          <BuildingLink
            href="/recover"
            name="Post Office"
            purpose="Recover my link"
            art={<PostOfficeArt className="-mt-3 h-auto w-full" />}
            className="mx-auto w-full max-w-[32rem]"
          />
        </div>
      </section>
      </main>

      <VillageFooter />
    </div>
  );
}
