import { Check, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupFacts, GroupRules, describeDrawing } from "@/components/group/group-facts";
import { DemoEmailNote } from "@/components/participant/demo-note";
import { Button } from "@/components/ui/button";
import { BuildingLink } from "@/components/village/building-link";
import { ParticipantShell } from "@/components/village/participant-shell";
import { GiftHouseArt, MailboxArt, PathBand, PostOfficeArt } from "@/components/village/scenes";
import { SnowLayer } from "@/components/village/snow";
import type { ParticipantHomeDTO } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { isUuid } from "@/server/services/groups";
import { getParticipantHome, getRecipientView } from "@/server/services/participant";
import { participantPage } from "@/server/page-auth";

export const metadata: Metadata = {
  title: "Your village",
  robots: { index: false, follow: false },
};

const h2 = "font-display text-[clamp(1.75rem,4.5vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] [text-wrap:balance]";
const PRIVACY = "Your recipient sees your alias. The Santa who drew you sees your name.";

/**
 * The participant village (REDESIGN_BRIEF.md §3): the post-box with their envelope, the Post Office
 * (messages) and the Gift House (wishlist), along one path. Entrances appear only when this
 * participant may go inside. The recipient's name appears only after the envelope has been opened.
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

  return (
    <ParticipantShell participantId={participantId} active={active} className="bg-snow">
      {/* ───────── Your cottage: the envelope's own place ───────── */}
      <section aria-labelledby="home-title" className="relative bg-sky">
        <SnowLayer className="top-0 right-0 h-64 w-full lg:w-1/2" density={0.5} />
        <div
          className={cn(
            "relative mx-auto grid max-w-6xl gap-6 px-4 pt-8 sm:px-6 lg:gap-14 lg:pt-12",
            active && "lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end",
            !active && "pb-12",
          )}
        >
          <div className={cn(active && "lg:pb-16")}>
            <h1 id="home-title" className="font-display text-[clamp(2.25rem,7vw,3.5rem)] leading-[1] font-extrabold tracking-[-0.035em] break-words">
              Hi, <span className="font-hand text-cranberry">{me.name}</span>
            </h1>
            <p className="mt-2 text-lg text-midnight-soft">
              <strong className="text-midnight">{group.name}</strong> · organized by {group.organizerName}
            </p>

            {joined === "1" && active && (
              <div className="slip mt-5 animate-unfold p-4">
                <p className="font-display text-lg font-bold">{me.status === "pending" ? "Request sent!" : "You’re in!"}</p>
                <p className="mt-1 leading-relaxed text-midnight-soft">
                  We’ve emailed your private link to <strong className="break-all text-midnight">{me.email}</strong>. Keep that email: it’s how you
                  get back here.
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

            {me.alias && (
              <div className="slip mt-5 inline-block max-w-full px-4 py-3">
                <p className="text-sm text-midnight-soft">Your secret alias</p>
                <p className="font-hand text-3xl font-bold text-evergreen">{me.alias}</p>
                <p className="mt-1 max-w-xs text-sm text-midnight-soft">Only you can see it’s yours. Your recipient sees it on your letters.</p>
              </div>
            )}
          </div>

          {active &&
            (assignment.state !== "none" ? (
              <BuildingLink
                id="post-box"
                href={`${base}/reveal`}
                name="Your post-box"
                purpose="Envelope"
                art={<MailboxArt className="-mt-2 h-auto w-full" />}
                className="mx-auto w-full max-w-[30rem] scroll-mt-28"
              />
            ) : (
              <figure className="mx-auto flex w-full max-w-[30rem] flex-col items-center">
                <figcaption className="inline-flex min-h-11 items-center rounded-xl border-2 border-midnight bg-paper px-4 py-2 font-display text-lg font-extrabold">
                  Your post-box
                </figcaption>
                <MailboxArt flagUp={false} className="-mt-2 h-auto w-full" />
              </figure>
            ))}
        </div>
      </section>

      {active && (
        <>
          {/* ───────── Post Office ───────── */}
          <section aria-labelledby="post-title" className="relative">
            <PathBand className="absolute inset-x-0 top-0 h-20 w-full" />
            <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-14 lg:pb-20">
              {canEnterPostOffice ? (
                <BuildingLink
                  id="post-office"
                  href={`${base}/messages`}
                  name="Post Office"
                  purpose="Messages"
                  art={<PostOfficeArt className="-mt-2 h-auto w-full" />}
                  className="mx-auto w-full max-w-[30rem] scroll-mt-28"
                />
              ) : (
                <ClosedBuilding id="post-office" name="Post Office" note="Opens after the draw" art={<PostOfficeArt className="-mt-2 h-auto w-full" />} />
              )}
              <div>
                <h2 id="post-title" className={h2}>
                  {canEnterPostOffice ? "Two mail slots wait for you" : "Letters start after the draw"}
                </h2>
                <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight-soft">
                  {closed
                    ? "The exchange has wrapped up. Your letters are still here to read."
                    : !drawn
                      ? "Once names are drawn you can write to your person and to the Santa who drew you."
                      : recipientName
                        ? `Write to ${recipientName}${me.alias ? ` as ${me.alias}` : ""}, or answer the Santa who drew you.`
                        : messaging.hasSanta
                          ? "Open your envelope to write to your person. The Santa who drew you can already write to you."
                          : "Write to your person, or answer the Santa who drew you."}{" "}
                  {PRIVACY}
                </p>
              </div>
            </div>
          </section>

          {/* ───────── Gift House ───────── */}
          <section aria-labelledby="gift-title" className="relative">
            <PathBand flip className="absolute inset-x-0 top-0 h-20 w-full" />
            <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-14 lg:pb-20">
              <div className="lg:order-1">
                <h2 id="gift-title" className={h2}>
                  {ideas === 0 ? "Your wishlist is empty" : `Your wishlist has ${ideas} idea${ideas === 1 ? "" : "s"}`}
                </h2>
                <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight-soft">
                  {closed ? "You can still read it." : "Only your Santa reads it. Add sizes, links, or things to skip."}
                </p>
              </div>
              <BuildingLink
                id="gift-house"
                href={`${base}/profile`}
                name="Gift House"
                purpose="Wishlist"
                art={<GiftHouseArt className="-mt-2 h-auto w-full" />}
                className="mx-auto w-full max-w-[28rem] scroll-mt-28 lg:order-2"
              />
            </div>
          </section>

          {me.status === "approved" && group.status === "open" && <BeforeTheDraw home={home} base={base} />}
        </>
      )}

      {/* ───────── The noticeboard by the road ───────── */}
      <section aria-labelledby="facts-title" className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        <div className="village-paper p-5 sm:p-7">
          <h2 id="facts-title" className="font-display text-xl font-bold">
            About this exchange
          </h2>
          <GroupFacts group={group} className="mt-4" showApproval={me.status === "pending"} />
          <GroupRules group={group} className="mt-6 border-t-2 border-dashed border-snow-shadow pt-6" />
        </div>
        {active && (
          <p className="mt-6 flex gap-3 text-[0.9375rem] leading-relaxed text-midnight-soft">
            <Lock className="mt-1 size-4 shrink-0" aria-hidden />
            <span>
              There’s no login. This page stays open on this device; anywhere else, use the private link in your email from SantaElf. Lost
              it?{" "}
              <Link href="/recover" className="font-bold text-evergreen underline decoration-2 underline-offset-4">
                Recover my link
              </Link>
              .
            </span>
          </p>
        )}
      </section>
    </ParticipantShell>
  );
}

/** A building you can't enter yet: same art, a plain sign, no link. */
function ClosedBuilding({ id, name, note, art }: { id: string; name: string; note: string; art: React.ReactNode }) {
  return (
    <figure id={id} className="mx-auto flex w-full max-w-[30rem] scroll-mt-28 flex-col items-center">
      <figcaption className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-midnight bg-paper px-4 py-2">
        <span className="font-display text-lg font-extrabold">{name}</span>
        <span aria-hidden className="text-snow-shadow">
          ·
        </span>
        <span className="text-[0.9375rem] font-bold text-midnight-soft">{note}</span>
      </figcaption>
      <span aria-hidden className="block w-full opacity-90">
        {art}
      </span>
    </figure>
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
    text = "The names are drawn. Your envelope is waiting in your post-box. Open it somewhere nobody’s peeking.";
  } else {
    text = recipientName
      ? `You’re the Secret Santa for ${recipientName}. Read your letter again any time from your post-box.`
      : "Your envelope is open. Read it again any time from your post-box.";
  }
  return <p className="mt-5 max-w-[40ch] rounded-xl border-2 border-midnight bg-paper px-4 py-3 leading-snug">{text}</p>;
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
        <ol className="mt-3 divide-y-2 divide-dashed divide-snow-shadow">
          {items.map((it, i) => (
            <li key={it.title} className="flex gap-4 py-3">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                  it.done ? "border-midnight bg-evergreen text-paper" : "border-snow-shadow bg-paper text-ink-500",
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
