import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/ui/page-shell";
import { C, line } from "@/components/village/art";
import { ParticipantHeader } from "@/components/village/participant-header";
import { VillageFooter } from "@/components/village/village-chrome";
import { PREVIEW_PLACES } from "../places";
import { Mailroom } from "./mailroom";

export const metadata: Metadata = { title: "Preview · Post Office" };

/** The Post Office's cranberry door with its brass mail slot and lamp, carried in from outside. */
function DoorWithSlot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 120" className={className} aria-hidden focusable="false">
      <path d="M78 14h18v14" fill="none" {...line} />
      <path d="M88 28h16l-3 18h-10z" fill={C.golden} {...line} />
      <rect x={8} y={12} width={70} height={106} rx={4} fill={C.cranberryDeep} {...line} />
      <rect x={13} y={17} width={60} height={101} rx={3} fill={C.cranberry} {...line} />
      <rect x={25} y={56} width={36} height={9} rx={2} fill={C.golden} {...line} />
      <circle cx={63} cy={84} r={4} fill={C.golden} {...line} strokeWidth={1.75} />
    </svg>
  );
}

export default async function PostOfficePreview({ searchParams }: PageProps<"/preview/participant/post-office">) {
  const sp = await searchParams;
  const thread = sp.thread === "santa" ? "santa" : "recipient";
  return (
    <div className="flex min-h-full flex-col bg-[#E4F0EA] text-midnight">
      <SkipLink />
      <ParticipantHeader places={PREVIEW_PLACES} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="relative border-b-[2.5px] border-midnight bg-[#CFE5DA]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-3 bg-timber" />
          <div className="mx-auto flex max-w-6xl items-end gap-4 px-4 pt-8 pb-5 sm:gap-6 sm:px-6 sm:pt-10">
            <DoorWithSlot className="h-20 w-auto shrink-0 sm:h-28" />
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">Post Office</h1>
              <p className="mt-1 text-[0.9375rem] text-midnight-soft sm:text-lg">Your letters, Priya. Pick a slot to read and reply.</p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/preview/participant#post-office"
            className="mb-6 inline-flex min-h-11 items-center gap-2 font-bold text-evergreen underline decoration-2 underline-offset-4"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to the village
          </Link>
          <Mailroom thread={thread} fail={sp.fail === "1"} />
        </div>
      </main>
      <VillageFooter />
    </div>
  );
}
