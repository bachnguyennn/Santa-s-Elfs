import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RevealExperience } from "@/components/reveal/reveal-experience";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPage } from "@/components/ui/status-page";
import { participantPage } from "@/server/page-auth";
import { getParticipantHome, getRecipientView } from "@/server/services/participant";

export const metadata: Metadata = {
  title: "Your Secret Santa card",
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
        title={notIn ? "You’re not in this drawing" : "The elves haven’t drawn names yet"}
        actions={
          <Button asChild variant="primary">
            <Link href={`/p/${participantId}`}>Back to your page</Link>
          </Button>
        }
      >
        {notIn ? (
          <p>Only people the organizer approved before the drawing get a card.</p>
        ) : (
          <p>
            {home.group.drawMethod === "scheduled" && home.group.drawAt
              ? "They’ll draw automatically at the time the organizer set. "
              : "The organizer will start the drawing once everyone’s in. "}
            We’ll email you the moment your card is ready. Meanwhile, a good wishlist helps your Santa.
          </p>
        )}
      </StatusPage>
    );
  }

  const view = home.assignment.state === "revealed" ? await getRecipientView(db, ctx) : null;

  return (
    <PageShell className="overflow-x-clip">
      <Link href={`/p/${participantId}`} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-pine-600 hover:bg-cream-100">
        <ArrowLeft className="size-4" aria-hidden /> {home.group.name}
      </Link>
      <h1 className="mt-2 mb-6 font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900">
        Your Secret Santa card
      </h1>
      <RevealExperience participantId={participantId} participantName={home.participant.name} initialView={view} />
    </PageShell>
  );
}
