import * as React from "react";
import { SiteFooter, SkipLink } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { SceneBanner, type ArtName } from "@/components/workshop/art";
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

/** An interior's entrance: a crop of the room's painting with the room name on a scrim. */
export function RoomHeader({
  art,
  position,
  title,
  children,
}: {
  art: ArtName;
  position?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <SceneBanner name={art} position={position} className="h-[clamp(12rem,26vw,19rem)]">
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] font-bold break-words [text-wrap:balance]">{title}</h1>
        {children && <div className="mt-1.5 max-w-[56ch] text-[0.9375rem] text-buttercream/90 sm:text-lg">{children}</div>}
      </div>
    </SceneBanner>
  );
}
