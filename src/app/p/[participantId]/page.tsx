import { Check, Lock, MessageCircle, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Elf } from "@/components/brand/elf";
import { Holly } from "@/components/brand/motifs";
import { HandName, PaperSlip } from "@/components/brand/paper-slip";
import { GroupFacts, GroupRules, describeDrawing } from "@/components/group/group-facts";
import { DemoEmailNote } from "@/components/participant/demo-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import type { ParticipantHomeDTO } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { isUuid } from "@/server/services/groups";
import { getParticipantHome } from "@/server/services/participant";
import { participantPage } from "@/server/page-auth";

export const metadata: Metadata = {
  title: "Your Secret Santa",
  robots: { index: false, follow: false },
};

export default async function ParticipantHomePage({ params, searchParams }: PageProps<"/p/[participantId]">) {
  const { participantId } = await params;
  const { joined } = await searchParams;
  if (!isUuid(participantId)) notFound();
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);
  const { participant: me, group } = home;
  const base = `/p/${me.id}`;
  const active = me.status === "pending" || me.status === "approved";

  return (
    <PageShell
      width="default"
      headerAction={
        <Badge tone="neutral">
          <Lock aria-hidden /> Private page
        </Badge>
      }
    >
      <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900 [text-wrap:balance]">
        Hi, <HandName className="text-berry-600">{me.name}</HandName>
      </h1>
      <p className="mt-2 text-lg text-ink-700">
        <strong className="text-ink-900">{group.name}</strong> · organized by {group.organizerName}
      </p>

      {joined === "1" && active && (
        <PaperSlip tilt={-1} className="mt-6 animate-unfold p-5">
          <p className="font-display text-lg font-bold text-pine-900">
            {me.status === "pending" ? "Request sent!" : "You’re in!"}
          </p>
          <p className="mt-1 leading-relaxed text-ink-700">
            We’ve emailed your private link to <strong className="break-all">{me.email}</strong>. Keep that email: it’s how you get
            back here.
          </p>
          <DemoEmailNote className="mt-3" />
        </PaperSlip>
      )}

      <div className="mt-8 space-y-8">
        <StatusBlock home={home} base={base} />

        {active && (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold tracking-[-0.015em] text-pine-900">Your profile & wishlist</h2>
                <p className="mt-1 text-sm text-ink-500">
                  {home.profile.wishlist.length === 0
                    ? "No gift ideas yet."
                    : `${home.profile.wishlist.length} gift idea${home.profile.wishlist.length === 1 ? "" : "s"}`}
                  {home.profile.interests.length > 0 && ` · ${home.profile.interests.length} interest${home.profile.interests.length === 1 ? "" : "s"}`}
                  {" · "}only your Santa sees this.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href={`${base}/profile`}>
                  <Pencil aria-hidden /> {group.status === "closed" ? "View profile" : "Edit profile"}
                </Link>
              </Button>
            </div>
          </Card>
        )}

        <section aria-labelledby="group-title">
          <h2 id="group-title" className="font-display text-xl font-bold tracking-[-0.015em] text-pine-900">
            About this exchange
          </h2>
          <GroupFacts group={group} className="mt-4" showApproval={me.status === "pending"} />
          <GroupRules group={group} className="mt-6 border-t border-line pt-6" />
        </section>

        {active && (
          <p className="flex gap-3 rounded-xl bg-cream-100 p-4 text-sm leading-relaxed text-ink-700">
            <Lock className="mt-0.5 size-4 shrink-0 text-pine-700" aria-hidden />
            <span>
              There’s no login. This page stays open on this device; anywhere else, use the private link in your email from SantaElf.
              Lost it?{" "}
              <Link href="/recover" className="font-bold text-pine-800 underline">
                Get a new link
              </Link>
              .
            </span>
          </p>
        )}
      </div>
    </PageShell>
  );
}

function StatusBlock({ home, base }: { home: ParticipantHomeDTO; base: string }) {
  const { participant: me, group, assignment, messaging, profile } = home;

  if (me.status === "rejected" || me.status === "removed") {
    return (
      <Card>
        <EmptyState
          art="elf"
          title={me.status === "rejected" ? "This request wasn’t approved" : `You’re no longer in ${group.name}`}
        >
          <p>
            {me.status === "rejected"
              ? `${group.organizerName} didn’t add you to this exchange. If you think that’s a mistake, ask them directly.`
              : `${group.organizerName} removed you from the group. Your profile and wishlist aren’t shared with anyone.`}
          </p>
        </EmptyState>
      </Card>
    );
  }

  if (me.status === "pending") {
    return (
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Elf pose="wave" className="h-24 shrink-0 self-center" />
        <div className="min-w-0">
          <Badge tone="gold">Waiting for approval</Badge>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em] text-pine-900">
            Waiting for {group.organizerName} to approve you
          </h2>
          <p className="mt-2 leading-relaxed text-ink-700">
            We’ll email you as soon as they do. Meanwhile, you can already fill in your profile and wishlist.
          </p>
          <Button asChild variant="primary" className="mt-4">
            <Link href={`${base}/profile`}>Fill in your profile</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // approved
  if (group.status === "open") {
    const aboutDone = Boolean(profile.about || profile.interests.length);
    const wishDone = profile.wishlist.length > 0;
    const items = [
      { done: true, title: "Join the exchange", body: "Done. You’re on the list." },
      {
        done: aboutDone,
        title: "Tell your Santa about you",
        body: aboutDone ? "Done. You can change it any time." : "A sentence and a few interests go a long way.",
        href: `${base}/profile`,
      },
      {
        done: wishDone,
        title: "Add a few gift ideas",
        body: wishDone ? `${profile.wishlist.length} on your wishlist.` : "Links welcome. Your Santa will thank you.",
        href: `${base}/profile`,
      },
      { done: false, title: "Wait for the elves", body: describeDrawing(group) + " You’ll get an email." },
    ];
    return (
      <Card>
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-pine-900">Before the drawing</h2>
        <ol className="mt-5 space-y-1">
          {items.map((it, i) => (
            <li key={it.title} className="flex gap-4 rounded-xl py-3">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                  it.done ? "border-pine-700 bg-pine-700 text-cream-50" : "border-line-strong bg-cream-50 text-ink-500",
                )}
              >
                {it.done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-bold", it.done ? "text-ink-700" : "text-ink-900")}>
                  {it.title}
                  <span className="sr-only">{it.done ? " (done)" : " (to do)"}</span>
                </p>
                <p className="text-sm text-ink-500">{it.body}</p>
              </div>
              {it.href && !it.done && (
                <Button asChild variant="ghost" size="sm" className="self-center">
                  <Link href={it.href} aria-label={`${it.title}: open your profile`}>
                    Open
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  // drawn or closed
  const closed = group.status === "closed";
  return (
    <Card tone="felt" className="relative overflow-hidden sm:p-8">
      <Holly className="absolute top-4 right-4 h-7" />
      {assignment.state === "none" ? (
        <>
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">
            {closed ? "This exchange has wrapped up" : "Names have been drawn"}
          </h2>
          <p className="mt-2 text-pine-200">
            You weren’t part of this drawing. If you think that’s wrong, ask {group.organizerName}.
          </p>
        </>
      ) : (
        <>
          <h2 className="max-w-md pr-10 font-display text-[clamp(1.75rem,5vw,2.25rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]">
            {closed
              ? "This exchange has wrapped up. Hope the gifts were a hit!"
              : assignment.state === "ready"
                ? "The elves have drawn names!"
                : "You’re someone’s Secret Santa"}
          </h2>
          <p className="mt-2 max-w-lg text-pine-200">
            {closed
              ? "Thanks for taking part. The group is deleted automatically a while after the exchange."
              : assignment.state === "ready"
                ? "Your card is sealed and waiting. Open it somewhere nobody can peek over your shoulder."
                : "Check their wishlist, and send them a message if you need a hint."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {assignment.state === "ready" ? (
              <Button asChild variant="festive" size="lg">
                <Link href={`${base}/reveal`}>Unwrap My Secret Santa</Link>
              </Button>
            ) : (
              <Button asChild variant="light" size="lg">
                <Link href={`${base}/reveal`}>See your recipient</Link>
              </Button>
            )}
            {!closed && messaging.canMessageRecipient && (
              <Button asChild variant="light">
                <Link href={`${base}/messages?thread=recipient`}>
                  <MessageCircle aria-hidden /> Message your recipient
                </Link>
              </Button>
            )}
            {!closed && messaging.hasSanta && (
              <Button asChild variant="light">
                <Link href={`${base}/messages?thread=santa`}>
                  <MessageCircle aria-hidden /> Chat with your Secret Santa
                </Link>
              </Button>
            )}
          </div>
        </>
      )}
      {me.alias && (
        <PaperSlip tilt={-1.5} className="mt-8 inline-block max-w-full px-5 py-4">
          <p className="text-sm text-ink-700">Your secret alias</p>
          <HandName className="text-3xl text-pine-900">{me.alias}</HandName>
          <p className="mt-1 max-w-xs text-sm text-ink-500">Only you can see this. Your recipient sees it on your messages.</p>
        </PaperSlip>
      )}
    </Card>
  );
}
