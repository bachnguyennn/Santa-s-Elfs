import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/ui/page-shell";
import { SnowLayer, SnowToggle } from "@/components/village/snow";
import { VillageFooter, VillageLogo } from "@/components/village/village-chrome";
import { EnvelopeDemo } from "./envelope-demo";

export const metadata: Metadata = { title: "Preview · Your envelope" };

const PLACES = [
  { label: "Your envelope", current: true },
  { label: "Post Office · Messages" },
  { label: "Gift House · Wishlist" },
  { label: "Your village" },
];

export default async function EnvelopePreview({ searchParams }: PageProps<"/preview/envelope">) {
  const sp = await searchParams;
  const opened = sp.opened === "1";
  const delay = Number(sp.delay ?? 450);
  const fail = sp.fail === "1";

  return (
    <div className="flex min-h-full flex-col bg-snow text-midnight">
      <SkipLink />
      <header className="relative z-20 bg-sky">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <VillageLogo />
          <div className="flex items-center gap-1">
            <SnowToggle className="hidden sm:inline-flex" />
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-midnight bg-paper px-3 py-1 text-sm font-bold">
              <Lock className="size-3.5" aria-hidden /> Private page
            </span>
          </div>
        </div>
        <nav aria-label="Your village" className="mx-auto max-w-6xl">
          <ul className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4">
            {PLACES.map((p) => (
              <li key={p.label} className="shrink-0">
                <Link
                  href="#"
                  aria-current={p.current ? "page" : undefined}
                  className={
                    p.current
                      ? "relative inline-flex min-h-12 items-center px-3 text-[0.9375rem] font-bold text-midnight"
                      : "inline-flex min-h-12 items-center px-3 text-[0.9375rem] font-bold text-evergreen underline decoration-2 underline-offset-4"
                  }
                >
                  {p.label}
                  {p.current && <span aria-hidden className="absolute inset-x-3 bottom-1.5 h-1 rounded-full bg-cranberry" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="relative bg-sky pb-2">
          <SnowLayer className="inset-x-0 top-0 h-40" density={0.5} />
          <div className="relative mx-auto max-w-3xl px-4 pt-8 text-center sm:px-6 sm:pt-10">
            <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]">
              {opened ? "Your envelope, Priya" : "Priya, your envelope has arrived"}
            </h1>
            <p className="mx-auto mt-2 max-w-[38ch] text-lg text-midnight-soft">
              Maple Street Cousins · names drawn Tuesday, December 1
            </p>
          </div>
          {/* the snowbank the envelope rests on */}
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full" aria-hidden focusable="false">
            <path d="M0 40c240-30 480-34 720-20s480 20 720-6V80H0z" fill="#F7FCFF" />
            <path d="M-4 40c240-30 484-34 724-20s480 20 724-6" fill="none" stroke="#172D38" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="h-16" />
        </div>
        <div className="relative mx-auto -mt-2 max-w-3xl px-4 pb-16 sm:px-6">
          <EnvelopeDemo opened={opened} delay={Number.isFinite(delay) ? delay : 450} fail={fail} />
        </div>
      </main>
      <VillageFooter />
    </div>
  );
}
