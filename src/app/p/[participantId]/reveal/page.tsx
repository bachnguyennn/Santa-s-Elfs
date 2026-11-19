import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeReveal } from "@/components/reveal/envelope-reveal";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { ParticipantShell } from "@/components/village/participant-shell";
import { SceneBanner } from "@/components/workshop/art";
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
    <ParticipantShell participantId={participantId} className="bg-parchment">
      <SceneBanner name="writing-desk" position="70% 62%" className="h-[clamp(12rem,26vw,19rem)]">
        <div>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] font-bold [text-wrap:balance]">
            {view ? `Your envelope, ${me.name}` : `${me.name}, your envelope has arrived`}
          </h1>
          <p className="mt-1.5 text-lg text-buttercream/90">
            {group.name}
            {group.exchangeDate ? ` · exchange ${formatDateOnly(group.exchangeDate)}` : ""}
          </p>
        </div>
      </SceneBanner>
      <div className="relative mx-auto max-w-3xl overflow-x-clip px-4 pt-10 pb-16 sm:px-8">
        <EnvelopeReveal participantId={participantId} participantName={me.name} initialView={view} />
      </div>
    </ParticipantShell>
  );
}
