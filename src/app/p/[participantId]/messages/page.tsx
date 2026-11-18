import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThreadTabs } from "@/components/messages/thread-tabs";
import { ThreadView } from "@/components/messages/thread-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import type { Thread, ThreadDTO } from "@/lib/contracts";
import { AppError } from "@/server/errors";
import { participantPage } from "@/server/page-auth";
import { getThread } from "@/server/services/messaging";
import { getParticipantHome } from "@/server/services/participant";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function MessagesPage({ params, searchParams }: PageProps<"/p/[participantId]/messages">) {
  const { participantId } = await params;
  const sp = await searchParams;
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);

  const asked = sp.thread === "recipient" || sp.thread === "santa" ? (sp.thread as Thread) : null;
  const current: Thread = asked ?? (home.messaging.canMessageRecipient ? "recipient" : "santa");

  let thread: ThreadDTO | null = null;
  try {
    thread = await getThread(db, ctx, current);
  } catch (err) {
    if (!(err instanceof AppError && err.code === "NOT_DRAWN")) throw err;
  }

  const drawn = home.group.status !== "open";

  return (
    <PageShell>
      <Link href={`/p/${participantId}`} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-pine-600 hover:bg-cream-100">
        <ArrowLeft className="size-4" aria-hidden /> {home.group.name}
      </Link>
      <h1 className="mt-2 mb-6 font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900">Messages</h1>

      <ThreadTabs participantId={participantId} current={current} />

      {thread ? (
        <ThreadView
          key={current}
          participantId={participantId}
          initial={thread}
          timezone={home.group.timezone}
          readOnly={home.group.status === "closed"}
        />
      ) : !drawn ? (
        <EmptyState
          title="The elves haven’t drawn names yet"
          action={
            <Button asChild variant="secondary">
              <Link href={`/p/${participantId}`}>Back to your page</Link>
            </Button>
          }
        >
          Once names are drawn you can message the person you’re buying for, and your own Santa can message you. Both stay anonymous.
        </EmptyState>
      ) : current === "recipient" && home.assignment.state === "ready" ? (
        <EmptyState
          art="gift"
          title="Open your card first"
          action={
            <Button asChild variant="festive">
              <Link href={`/p/${participantId}/reveal`}>Open your card</Link>
            </Button>
          }
        >
          Find out who you’re buying for, then you can ask them questions here without giving yourself away.
        </EmptyState>
      ) : (
        <EmptyState title="No conversation here" art="none">
          You weren’t part of this drawing, so there’s no one to message.
        </EmptyState>
      )}
    </PageShell>
  );
}
