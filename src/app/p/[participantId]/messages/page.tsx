import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Mailroom } from "@/components/messages/mailroom";
import { Button } from "@/components/ui/button";
import { ParticipantShell, RoomHeader } from "@/components/village/participant-shell";
import type { Thread, ThreadDTO } from "@/lib/contracts";
import { AppError } from "@/server/errors";
import { participantPage } from "@/server/page-auth";
import { getThread } from "@/server/services/messaging";
import { getParticipantHome } from "@/server/services/participant";

export const metadata: Metadata = {
  title: "Post Office",
  robots: { index: false, follow: false },
};

/** NOT_DRAWN (before the drawing, or the recipient letter before the envelope is opened) → null. */
async function load(fn: () => Promise<ThreadDTO>): Promise<ThreadDTO | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_DRAWN") return null;
    throw err;
  }
}

/** The Post Office interior: two mail slots (one per conversation) and the counter. */
export default async function MessagesPage({ params, searchParams }: PageProps<"/p/[participantId]/messages">) {
  const { participantId } = await params;
  const sp = await searchParams;
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);
  const base = `/p/${participantId}`;

  const asked = sp.thread === "recipient" || sp.thread === "santa" ? (sp.thread as Thread) : null;
  const current: Thread = asked ?? (home.messaging.canMessageRecipient ? "recipient" : "santa");
  const drawn = home.group.status !== "open";
  // Only load the conversations this participant may see; the services enforce it as well.
  const [recipient, santa] = await Promise.all([
    home.messaging.canMessageRecipient ? load(() => getThread(db, ctx, "recipient")) : Promise.resolve(null),
    home.messaging.hasSanta ? load(() => getThread(db, ctx, "santa")) : Promise.resolve(null),
  ]);

  const emptyState = !drawn ? (
    <div>
      <p className="font-display text-xl font-bold">The elves haven’t drawn names yet</p>
      <p className="mt-2 max-w-prose text-midnight-soft">
        Once names are drawn you can write to the person you’re buying for, and the Santa who drew you can write to you.
      </p>
      <Button asChild variant="secondary" className="mt-5">
        <Link href={`${base}#post-office`}>Back to the village</Link>
      </Button>
    </div>
  ) : current === "recipient" && home.assignment.state === "ready" ? (
    <div>
      <p className="font-display text-xl font-bold">Open your envelope first</p>
      <p className="mt-2 max-w-prose text-midnight-soft">
        Find out who you’re buying for, then you can ask them questions here, signed with your alias.
      </p>
      <Button asChild variant="festive" className="mt-5">
        <Link href={`${base}/reveal`}>Open my envelope</Link>
      </Button>
    </div>
  ) : (
    <div>
      <p className="font-display text-xl font-bold">No conversation here</p>
      <p className="mt-2 max-w-prose text-midnight-soft">You weren’t part of this drawing, so there’s no one to write to.</p>
    </div>
  );

  return (
    <ParticipantShell participantId={participantId} className="bg-parchment">
      <RoomHeader art="post-office" position="24% 46%" title="Post Office">
        Your letters, {home.participant.name}. Pick a slot to read and reply.
      </RoomHeader>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href={`${base}#post-office`}
          className="mb-6 inline-flex min-h-11 items-center gap-2 font-bold text-evergreen underline decoration-2 underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to the village
        </Link>
        <Mailroom
          participantId={participantId}
          current={current}
          threads={{ recipient, santa }}
          myAlias={home.participant.alias}
          timezone={home.group.timezone}
          readOnly={home.group.status === "closed"}
          emptyState={emptyState}
        />
      </div>
    </ParticipantShell>
  );
}
