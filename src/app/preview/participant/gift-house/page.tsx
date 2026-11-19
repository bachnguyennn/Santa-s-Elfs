import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/ui/page-shell";
import { ParticipantHeader } from "@/components/village/participant-header";
import { GiftHouseArt } from "@/components/village/scenes";
import { VillageFooter } from "@/components/village/village-chrome";
import { previewPlaces } from "../places";

export const metadata: Metadata = { title: "Preview · Gift House" };

/** Placeholder so the walkthrough's Gift House door leads somewhere. The room is designed during rollout. */
export default async function GiftHousePreview({ searchParams }: PageProps<"/preview/participant/gift-house">) {
  const sealed = (await searchParams).sealed === "1";
  return (
    <div className="flex min-h-full flex-col bg-snow text-midnight">
      <SkipLink />
      <ParticipantHeader places={previewPlaces(sealed)} />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-xl flex-1 px-4 py-10 text-center outline-none sm:px-6">
        <GiftHouseArt className="mx-auto h-auto w-full max-w-xs" />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.03em]">Gift House</h1>
        <p className="mt-2 text-lg text-midnight-soft">
          This room isn’t part of the walkthrough. Its paper wishlist gets built during the rollout.
        </p>
        <Link
          href={sealed ? "/preview/participant?sealed=1#gift-house" : "/preview/participant#gift-house"}
          className="mt-6 inline-flex min-h-11 items-center font-bold text-evergreen underline decoration-2 underline-offset-4"
        >
          Back to the village
        </Link>
      </main>
      <VillageFooter />
    </div>
  );
}
