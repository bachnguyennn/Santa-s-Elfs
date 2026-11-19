import * as React from "react";
import { SiteFooter, SkipLink } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { ParticipantHeader } from "./participant-header";

/** The participant's places. Rejected or removed participants only keep their village page. */
export function participantPlaces(participantId: string, active = true) {
  const base = `/p/${participantId}`;
  if (!active) return [{ href: base, label: "Your village" }];
  return [
    { href: base, label: "Your village" },
    { href: `${base}/reveal`, label: "Your envelope" },
    { href: `${base}/messages`, label: "Post Office · Messages" },
    { href: `${base}/profile`, label: "Gift House · Wishlist" },
  ];
}

/** Chrome for every /p/* page: header with ordinary links to the village's buildings, main, footer. */
export function ParticipantShell({
  participantId,
  active = true,
  className,
  children,
}: {
  participantId: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <ParticipantHeader places={participantPlaces(participantId, active)} />
      <main id="main" tabIndex={-1} className={cn("flex-1 outline-none", className)}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

/** An interior's entrance band: the building's door detail, its name and one line of context. */
export function RoomHeader({
  door,
  title,
  children,
  tone = "bg-[#CFE5DA]",
}: {
  door: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className={cn("relative border-b-[2.5px] border-midnight", tone)}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-3 bg-timber" />
      <div className="mx-auto flex max-w-6xl items-end gap-4 px-4 pt-8 pb-5 sm:gap-6 sm:px-6 sm:pt-10">
        <span className="shrink-0">{door}</span>
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] break-words [text-wrap:balance]">
            {title}
          </h1>
          {children && <div className="mt-1 text-[0.9375rem] text-midnight-soft sm:text-lg">{children}</div>}
        </div>
      </div>
    </div>
  );
}
