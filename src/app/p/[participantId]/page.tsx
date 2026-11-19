import { Check, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupFacts, GroupRules, describeDrawing } from "@/components/group/group-facts";
import { DemoEmailNote } from "@/components/participant/demo-note";
import { Button } from "@/components/ui/button";
import { ParticipantShell } from "@/components/village/participant-shell";
import { VillageRoute, type StreetStop } from "@/components/workshop/village-route";
import type { ParticipantHomeDTO } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { isUuid } from "@/server/services/groups";
import { getParticipantHome, getRecipientView } from "@/server/services/participant";
import { participantPage } from "@/server/page-auth";

export const metadata: Metadata = {
  title: "Your village",
  robots: { index: false, follow: false },
};

const PRIVACY = "Your recipient sees your alias. The Santa who drew you sees your name.";

/**
 * The participant's street: their envelope (in the Workshop), the Post Office (letters) and the Gift
 * House (wishlist), on the painted village. Every entrance is derived from the server's view of this
 * participant: a room they can't use yet is a sign that explains, not a link. The recipient's name
 * appears only after the envelope has been opened. Ordinary links sit beside the buildings.
 */
export default async function ParticipantHomePage({ params, searchParams }: PageProps<"/p/[participantId]">) {
  const { participantId } = await params;
  const { joined } = await searchParams;
  if (!isUuid(participantId)) notFound();
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);
  const { participant: me, group, assignment, messaging, profile } = home;
  const base = `/p/${me.id}`;
  const active = me.status === "pending" || me.status === "approved";
  const drawn = group.status !== "open";
  const closed = group.status === "closed";
  // Only after the envelope is opened; until then the village says "your person".
  const recipientName = assignment.state === "revealed" ? ((await getRecipientView(db, ctx))?.recipient.name ?? null) : null;
  const canEnterPostOffice = messaging.canMessageRecipient || messaging.hasSanta;
  const ideas = profile.wishlist.length;

  const stops: StreetStop[] = [
    {
      key: "workshop",
      name: "Workshop",
      purpose: assignment.state === "none" ? (drawn ? "No envelope for you" : "Your envelope, after the draw") : "Your envelope",
      href: assignment.state === "none" ? undefined : `${base}/reveal`,
      area: { left: 4, top: 20, width: 28, height: 52 },
      sign: { x: 18, y: 16 },
    },
    {
      key: "post-office",
      name: "Post Office",
      purpose: canEnterPostOffice ? "Messages" : "Letters, after the draw",
      href: canEnterPostOffice ? `${base}/messages` : undefined,
      area: { left: 38, top: 16, width: 31, height: 54 },
      sign: { x: 54, y: 11 },
    },
    {
      key: "gift-house",
      name: "Gift House",
      purpose: closed ? "Wishlist (read-only)" : ideas === 0 ? "Add your first idea" : `Wishlist · ${ideas} idea${ideas === 1 ? "" : "s"}`,
      href: `${base}/profile`,
      area: { left: 74, top: 26, width: 24, height: 46 },
      sign: { x: 85, y: 20 },
    },
  ];

  return (
    <ParticipantShell participantId={participantId} active={active} className="bg-parchment">
      {/* ───────── Where you stand ───────── */}
      <section aria-labelledby="home-title" className="bg-parchment">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
          <div>
            <h1 id="home-title" className="font-display text-[clamp(2.75rem,8vw,4.5rem)] leading-[0.95] font-bold break-words text-oxblood">
              Hi, {me.name}
            </h1>
            <p className="mt-2 text-lg text-ink-700">
              <strong className="text-ink">{group.name}</strong> · organized by {group.organizerName}
            </p>

            {joined === "1" && active && (
              <div className="mt-5 animate-unfold rounded-lg border border-paper-line bg-cream-50 p-4 shadow-[var(--shadow-paper)]">
                <p className="font-bold text-ink">{me.status === "pending" ? "Request sent." : "You’re in."}</p>
                <p className="mt-1 leading-relaxed text-ink-700">
                  We’ve emailed your private link to <strong className="break-all text-ink">{me.email}</strong>. Keep that email: it’s how you get
                  back here.
                </p>
                <DemoEmailNote className="mt-3" />
              </div>
            )}

            <StatusNote home={home} recipientName={recipientName} />

            {assignment.state === "ready" && !closed && (
              <Button asChild variant="festive" size="lg" className="mt-5 w-full sm:w-auto">
                <Link href={`${base}/reveal`}>Open my envelope</Link>
              </Button>
            )}
          </div>

          {me.alias && (
            <div className="rounded-lg bg-teal-wash p-5 lg:mt-3">
              <p className="text-sm font-bold text-teal-deep">Your secret alias</p>
              <p className="mt-1 font-display text-4xl leading-none font-bold text-teal">{me.alias}</p>
              <p className="mt-2 text-sm text-ink-700">Only you know it’s yours. Your recipient sees it on your letters.</p>
            </div>
          )}
        </div>
      </section>

      {active && (
        <VillageRoute
          stops={stops}
          heading="Your street"
          intro={
            <p>
              {closed
                ? "The exchange has wrapped up. Your letters and wishlist are still here to read."
                : !drawn
                  ? "Fill in your wishlist now. Your envelope and letters arrive once the names are drawn."
                  : recipientName
                    ? `Write to ${recipientName}${me.alias ? ` as ${me.alias}` : ""}, or answer the Santa who drew you.`
                    : messaging.hasSanta
                      ? "Open your envelope to write to your person. The Santa who drew you can already write to you."
                      : "Write to your person, or answer the Santa who drew you."}{" "}
              {drawn && PRIVACY}
            </p>
          }
        />
      )}

      {me.status === "approved" && group.status === "open" && <BeforeTheDraw home={home} base={base} />}

      {/* ───────── The notice by the road ───────── */}
      <section aria-labelledby="facts-title" className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8">
        <div className="village-paper p-5 sm:p-7">
          <h2 id="facts-title" className="font-display text-[1.9rem] leading-tight font-bold text-oxblood">
            About this exchange
          </h2>
          <GroupFacts group={group} className="mt-4" showApproval={me.status === "pending"} />
          <GroupRules group={group} className="mt-6 border-t border-dashed border-line pt-6" />
        </div>
        {active && (
          <p className="mt-6 flex gap-3 text-[0.9375rem] leading-relaxed text-ink-700">
            <Lock className="mt-1 size-4 shrink-0" aria-hidden />
            <span>
              There’s no login. This page stays open on this device; anywhere else, use the private link in your email from SantaElf. Lost
              it?{" "}
              <Link href="/recover" className="font-bold text-teal underline decoration-1 underline-offset-4">
                Recover link
              </Link>
              .
            </span>
          </p>
        )}
      </section>
    </ParticipantShell>
  );
}

/** One plain sentence about where this participant stands. */
function StatusNote({ home, recipientName }: { home: ParticipantHomeDTO; recipientName: string | null }) {
  const { participant: me, group, assignment } = home;
  let text: string;
  if (me.status === "rejected") {
    text = `${group.organizerName} didn’t add you to this exchange. If you think that’s a mistake, ask them directly.`;
  } else if (me.status === "removed") {
    text = `${group.organizerName} removed you from the group. Your profile and wishlist aren’t shared with anyone.`;
  } else if (me.status === "pending") {
    text = `Waiting for ${group.organizerName} to approve you. We’ll email you as soon as they do. You can already fill in your wishlist.`;
  } else if (group.status === "closed") {
    text = "This exchange has wrapped up. Hope the gifts were a hit!";
  } else if (group.status === "open") {
    text = `You’re on the list. ${describeDrawing(group)} You’ll get an email.`;
  } else if (assignment.state === "none") {
    text = `Names have been drawn, but you weren’t part of this drawing. If you think that’s wrong, ask ${group.organizerName}.`;
  } else if (assignment.state === "ready") {
    text = "The names are drawn. Your envelope is waiting in the Workshop. Open it somewhere nobody’s peeking.";
  } else {
    text = recipientName
      ? `You’re the Secret Santa for ${recipientName}. Read your letter again any time in the Workshop.`
      : "Your envelope is open. Read it again any time in the Workshop.";
  }
  return <p className="mt-5 max-w-[40ch] rounded-xl border border-paper-line bg-paper px-4 py-3 leading-snug">{text}</p>;
}

function BeforeTheDraw({ home, base }: { home: ParticipantHomeDTO; base: string }) {
  const { group, profile } = home;
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
    <section aria-labelledby="todo-title" className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
      <div className="village-paper p-5 sm:p-7">
        <h2 id="todo-title" className="font-display text-xl font-bold">
          Before the drawing
        </h2>
        <ol className="mt-3 divide-y divide-line">
          {items.map((it, i) => (
            <li key={it.title} className="flex gap-4 py-3">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                  it.done ? "border-teal bg-teal text-buttercream" : "border-paper-line bg-cream-50 text-ink-500",
                )}
              >
                {it.done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-bold", it.done ? "text-midnight-soft" : "text-midnight")}>
                  {it.title}
                  <span className="sr-only">{it.done ? " (done)" : " (to do)"}</span>
                </p>
                <p className="text-sm text-ink-500">{it.body}</p>
              </div>
              {it.href && !it.done && (
                <Button asChild variant="ghost" size="sm" className="self-center">
                  <Link href={it.href} aria-label={`${it.title}: open the Gift House`}>
                    Open
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
