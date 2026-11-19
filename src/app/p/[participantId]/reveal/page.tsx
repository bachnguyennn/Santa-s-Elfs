import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeReveal } from "@/components/reveal/envelope-reveal";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { ParticipantShell } from "@/components/village/participant-shell";
import { SnowLayer } from "@/components/village/snow";
import { formatDateOnly } from "@/lib/time";
import { participantPage } from "@/server/page-auth";
import { getParticipantHome, getRecipientView } from "@/server/services/participant";

export const metadata: Metadata = {
  title: "Your envelope",
  robots: { index: false, follow: false },
};

export default async function RevealPage({ params }: PageProps<"/p/[participantId]/reveal">) {
  const { participantId } = await params;
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);

  if (home.assignment.state === "none") {
    const notIn = home.participant.status !== "approved";
    return (
      <StatusPage
        title={notIn ? "You’re not in this drawing" : "Your envelope hasn’t arrived yet"}
        actions={
          <Button asChild variant="primary">
            <Link href={`/p/${participantId}`}>Back to your village</Link>
          </Button>
        }
      >
        {notIn ? (
          <p>Only people the organizer approved before the drawing get an envelope.</p>
        ) : (
          <p>
            {home.group.drawMethod === "scheduled" && home.group.drawAt
              ? "The elves draw automatically at the time the organizer set. "
              : "The organizer will start the drawing once everyone’s in. "}
            We’ll email you the moment your envelope is ready. Meanwhile, a good wishlist helps your Santa.
          </p>
        )}
      </StatusPage>
    );
  }

  const view = home.assignment.state === "revealed" ? await getRecipientView(db, ctx) : null;
  const { participant: me, group } = home;

  return (
    <ParticipantShell participantId={participantId} className="bg-snow">
      <div className="relative bg-sky pb-2">
        <SnowLayer className="inset-x-0 top-0 h-40" density={0.5} />
        <div className="relative mx-auto max-w-3xl px-4 pt-8 text-center sm:px-6 sm:pt-10">
          <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]">
            {view ? `Your envelope, ${me.name}` : `${me.name}, your envelope has arrived`}
          </h1>
          <p className="mx-auto mt-2 max-w-[38ch] text-lg text-midnight-soft">
            {group.name}
            {group.exchangeDate ? ` · exchange ${formatDateOnly(group.exchangeDate)}` : ""}
          </p>
        </div>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full" aria-hidden focusable="false">
          <path d="M0 40c240-30 480-34 720-20s480 20 720-6V80H0z" fill="#F7FCFF" />
          <path d="M-4 40c240-30 484-34 724-20s480 20 724-6" fill="none" stroke="#172D38" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="h-16" />
      </div>
      <div className="relative mx-auto -mt-2 max-w-3xl overflow-x-clip px-4 pb-16 sm:px-6">
        <EnvelopeReveal participantId={participantId} participantName={me.name} initialView={view} />
      </div>
    </ParticipantShell>
  );
}
