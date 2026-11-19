import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/ui/page-shell";
import { BuildingLink } from "@/components/village/building-link";
import { ParticipantHeader } from "@/components/village/participant-header";
import { GiftHouseArt, MailboxArt, PathBand, PostOfficeArt } from "@/components/village/scenes";
import { SnowLayer } from "@/components/village/snow";
import { VillageFooter } from "@/components/village/village-chrome";
import { previewPlaces } from "./places";

export const metadata: Metadata = { title: "Preview · Your village" };

const h2 = "font-display text-[clamp(1.75rem,4.5vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]";

export default async function ParticipantVillagePreview({ searchParams }: PageProps<"/preview/participant">) {
  // ?sealed=1: names are drawn but the envelope is still closed, so the recipient stays generic.
  const sealed = (await searchParams).sealed === "1";
  const q = sealed ? "?sealed=1" : "";
  return (
    <div className="flex min-h-full flex-col bg-snow text-midnight">
      <SkipLink />
      <ParticipantHeader places={previewPlaces(sealed)} />

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* ───────── Your cottage: the envelope's own place ───────── */}
        <section aria-labelledby="home-title" className="relative bg-sky">
          <SnowLayer className="top-0 right-0 h-64 w-full lg:w-1/2" density={0.5} />
          <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end lg:gap-14 lg:pt-12">
            <div className="lg:pb-16">
              <h1 id="home-title" className="font-display text-[clamp(2.25rem,7vw,3.5rem)] leading-[1] font-extrabold tracking-[-0.035em]">
                Hi, <span className="font-hand text-cranberry">Priya</span>
              </h1>
              <p className="mt-2 text-lg text-midnight-soft">
                <strong className="text-midnight">Maple Street Cousins</strong> · organized by Priya Raman
              </p>
              <p className="mt-5 max-w-[36ch] rounded-xl border-2 border-midnight bg-paper px-4 py-3 leading-snug">
                {sealed
                  ? "The names are drawn. Your envelope is waiting in your post-box."
                  : "The names are drawn and your envelope is open. Read it again any time from your post-box."}
              </p>
            </div>
            <BuildingLink
              href={sealed ? "/preview/envelope" : "/preview/envelope?opened=1"}
              name="Your post-box"
              purpose="Envelope"
              art={<MailboxArt className="-mt-2 h-auto w-full" />}
              className="mx-auto w-full max-w-[30rem]"
            />
          </div>
        </section>

        {/* ───────── Post Office ───────── */}
        <section aria-labelledby="post-title" className="relative bg-snow">
          <PathBand className="absolute inset-x-0 top-0 h-20 w-full" />
          <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-14 lg:pb-20">
            <BuildingLink
              id="post-office"
              href={`/preview/participant/post-office${q}`}
              name="Post Office"
              purpose="Messages"
              art={<PostOfficeArt className="-mt-2 h-auto w-full" />}
              className="mx-auto w-full max-w-[30rem] scroll-mt-28"
            />
            <div>
              <h2 id="post-title" className={h2}>
                Two mail slots wait for you
              </h2>
              <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight-soft">
                {sealed ? (
                  "Write to your person, or answer the Santa who drew you."
                ) : (
                  <>
                    Write to Tomás as <span className="font-hand font-bold text-evergreen">Dasher</span>, or answer the Santa who drew
                    you.
                  </>
                )}{" "}
                Your recipient sees your alias. The Santa who drew you sees your name.
              </p>
            </div>
          </div>
        </section>

        {/* ───────── Gift House ───────── */}
        <section aria-labelledby="gift-title" className="relative bg-snow">
          <PathBand flip className="absolute inset-x-0 top-0 h-20 w-full" />
          <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-14 lg:pb-20">
            <div className="lg:order-1">
              <h2 id="gift-title" className={h2}>
                Your wishlist has four ideas
              </h2>
              <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight-soft">
                Only your Santa reads it. Add sizes, links, or things to skip.
              </p>
            </div>
            <BuildingLink
              id="gift-house"
              href={`/preview/participant/gift-house${q}`}
              name="Gift House"
              purpose="Wishlist"
              art={<GiftHouseArt className="-mt-2 h-auto w-full" />}
              className="mx-auto w-full max-w-[28rem] scroll-mt-28 lg:order-2"
            />
          </div>
        </section>

        {/* ───────── The noticeboard by the road ───────── */}
        <section aria-labelledby="facts-title" className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
          <div className="village-paper p-5 sm:p-7">
            <h2 id="facts-title" className="font-display text-xl font-bold">
              About this exchange
            </h2>
            <dl className="mt-3 grid gap-2.5 text-[0.9375rem] sm:grid-cols-2">
              {[
                ["Budget", "$40 – $60 CAD"],
                ["Exchange", "Sunday, December 20"],
                ["Names drawn", "Tuesday, December 1"],
                ["Organizer", "Priya Raman"],
              ].map(([t, d]) => (
                <div key={t} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
                  <dt className="text-midnight-soft">{t}</dt>
                  <dd>{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-6 flex gap-3 text-[0.9375rem] leading-relaxed text-midnight-soft">
            <Lock className="mt-1 size-4 shrink-0" aria-hidden />
            <span>
              There’s no login. This page stays open on this device; anywhere else, use the private link in your email. Lost it?{" "}
              <Link href="/recover" className="font-bold text-evergreen underline decoration-2 underline-offset-4">
                Recover my link
              </Link>
              .
            </span>
          </p>
        </section>
      </main>
      <VillageFooter />
    </div>
  );
}
