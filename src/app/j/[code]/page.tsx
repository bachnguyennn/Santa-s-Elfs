import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupFacts, GroupRules, formatBudget } from "@/components/group/group-facts";
import { isEmailSimulated } from "@/components/participant/demo-note";
import { JoinForm } from "@/components/participant/join-form";
import { RecoverForm } from "@/components/participant/recover-form";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { SnowLayer } from "@/components/village/snow";
import type { InvitePreviewDTO } from "@/lib/contracts";
import { formatDateOnly, formatInZone } from "@/lib/time";
import { getDb } from "@/server/db";
import { getInvitePreview } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Welcome desk: you’re invited",
  robots: { index: false, follow: false },
};

function closedCopy(g: InvitePreviewDTO): { title: string; body: string } {
  switch (g.closedReason) {
    case "deadline":
      return {
        title: "Signups have closed",
        body: g.signupDeadline
          ? `Joining closed on ${formatInZone(g.signupDeadline, g.timezone)}. If you think you should be in, ask ${g.organizerName}.`
          : `Joining has closed. If you think you should be in, ask ${g.organizerName}.`,
      };
    case "full":
      return { title: "This group is full", body: `All ${g.capacity} places are taken. Ask ${g.organizerName} if a place opens up.` };
    case "drawn":
      return { title: "Names have already been drawn", body: `The elves have done their work for this group, so no one new can join.` };
    default:
      return { title: "This exchange has finished", body: "This group has wrapped up and is no longer taking anyone new." };
  }
}

export default async function InvitePage({ params }: PageProps<"/j/[code]">) {
  const { code } = await params;
  const db = await getDb();
  const group = await getInvitePreview(db, code);
  if (!group) notFound();
  const demoMode = isEmailSimulated();
  const closed = !group.isOpen ? closedCopy(group) : null;
  const placesLeft = Math.max(0, group.capacity - group.approvedCount);

  const budget = formatBudget(group);
  const quickFacts = [
    budget ? `Budget ${budget}` : null,
    group.exchangeDate ? `Exchange ${formatDateOnly(group.exchangeDate)}` : null,
    `${group.approvedCount} of ${group.capacity} places taken${group.isOpen && placesLeft <= 3 && placesLeft > 0 ? `, only ${placesLeft} left` : ""}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 bg-snow outline-none">
        {/* ───────── The welcome desk: who invited you, the group, and the join form, first ───────── */}
        <div className="relative bg-sky px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
          <SnowLayer className="top-0 right-0 hidden h-56 w-1/3 lg:block" density={0.5} />
          <section aria-labelledby="invite-title" className="relative mx-auto max-w-2xl">
            <div className="rounded-2xl border-[2.5px] border-midnight bg-paper px-5 pt-6 pb-7 sm:px-8 sm:pt-8">
              <p className="text-midnight-soft">
                <strong className="font-bold text-midnight">{group.organizerName}</strong> invited you to their Secret Santa
              </p>
              <h1
                id="invite-title"
                className="mt-1.5 font-display text-[clamp(2rem,6vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] break-words [text-wrap:balance]"
              >
                {group.name}
              </h1>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Exchange details">
                {quickFacts.map((f) => (
                  <li key={f} className="rounded-full border-2 border-midnight bg-sky px-3 py-1 text-sm font-bold">
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t-2 border-dashed border-snow-shadow pt-6">
                {closed ? (
                  <>
                    <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{closed.title}</h2>
                    <p className="mt-2 leading-relaxed text-midnight-soft">{closed.body}</p>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Join the exchange</h2>
                    <p className="mt-2 mb-6 leading-relaxed text-midnight-soft">
                      {group.requiresApproval
                        ? `${group.organizerName} approves each person, so you’ll be on a short waiting list until then. No account or password needed.`
                        : "Add your name and email and you’re in. No account or password needed."}
                    </p>
                    <JoinForm inviteCode={group.inviteCode} requiresApproval={group.requiresApproval} demoMode={demoMode} />
                  </>
                )}
              </div>
            </div>
            {/* the desk's counter edge */}
            <div aria-hidden className="mx-2 h-4 rounded-b-xl border-[2.5px] border-t-0 border-midnight bg-timber" />
          </section>
        </div>

        <div className="mx-auto grid max-w-2xl gap-8 px-4 py-10 sm:px-6">
          <section aria-labelledby="details-title" className="village-paper p-5 sm:p-7">
            <h2 id="details-title" className="font-display text-xl font-bold">
              About this exchange
            </h2>
            <GroupFacts group={group} className="mt-4" />
            <GroupRules group={group} className="mt-6 border-t-2 border-dashed border-snow-shadow pt-6" />
          </section>

          <section aria-labelledby="again-title" className="rounded-[var(--radius-card)] border-2 border-dashed border-midnight p-5 sm:p-6">
            <h2 id="again-title" className="font-display text-lg font-bold">
              Already joined?
            </h2>
            <p className="mt-1 mb-4 text-sm leading-relaxed text-midnight-soft">
              Enter the email you joined with and we’ll send your private link for this group again.
            </p>
            <RecoverForm inviteCode={group.inviteCode} demoMode={demoMode} idPrefix="invite-recover" />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
