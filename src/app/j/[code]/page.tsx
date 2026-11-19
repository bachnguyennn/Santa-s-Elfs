import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupFacts, GroupRules, formatBudget } from "@/components/group/group-facts";
import { isEmailSimulated } from "@/components/participant/demo-note";
import { JoinForm } from "@/components/participant/join-form";
import { RecoverForm } from "@/components/participant/recover-form";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { SceneBanner } from "@/components/workshop/art";
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
      <main id="main" tabIndex={-1} className="flex-1 bg-parchment pb-16 outline-none">
        <SceneBanner name="writing-desk" position="62% 72%" className="h-[clamp(7rem,22vw,16rem)]" />

        {/* ───────── The welcome desk: who invited you, the group, the join form, first ───────── */}
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:gap-12">
          <section aria-labelledby="invite-title" className="-mt-14 sm:-mt-20">
            <div className="relative rounded-[4px] bg-[linear-gradient(120deg,#fff4d6,#f3e0b8)] px-5 pt-7 pb-7 shadow-[0_2px_0_#d6c4a5,4px_14px_30px_-12px_rgb(51_9_20/0.55)] sm:px-8 sm:pt-8">
              <span aria-hidden className="absolute inset-x-0 top-0 h-[5px] rounded-t-[4px] bg-[repeating-linear-gradient(120deg,#962e40_0_8px,#fff0cc_8px_16px,#145851_16px_24px,#fff0cc_24px_32px)]" />
              <p className="text-ink-700">
                <strong className="font-bold text-ink">{group.organizerName}</strong> invited you to their Secret Santa
              </p>
              <h1 id="invite-title" className="mt-1 font-hand text-[clamp(2rem,6.5vw,3rem)] leading-[1.05] font-semibold break-words text-oxblood [text-wrap:balance]">
                {group.name}
              </h1>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Exchange details">
                {quickFacts.map((f) => (
                  <li key={f} className="rounded-full border border-paper-line bg-cream-50 px-3 py-1 text-sm font-bold text-ink">
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-dashed border-[#c89a6b] pt-6">
                {closed ? (
                  <>
                    <h2 className="font-display text-[1.9rem] leading-tight font-bold text-oxblood">{closed.title}</h2>
                    <p className="mt-2 leading-relaxed text-ink-700">{closed.body}</p>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-[1.9rem] leading-tight font-bold text-oxblood">Join the exchange</h2>
                    <p className="mt-2 mb-6 leading-relaxed text-ink-700">
                      {group.requiresApproval
                        ? `${group.organizerName} approves each person, so you’ll wait for a yes before you’re in. No account or password needed.`
                        : "Add your name and email and you’re in. No account or password needed."}
                    </p>
                    <JoinForm inviteCode={group.inviteCode} requiresApproval={group.requiresApproval} demoMode={demoMode} />
                  </>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-6 lg:pt-10">
            <section aria-labelledby="details-title" className="rounded-lg bg-teal-wash p-6 sm:p-7">
              <h2 id="details-title" className="font-display text-[1.75rem] leading-tight font-bold text-teal-deep">
                About this exchange
              </h2>
              <GroupFacts group={group} className="mt-4" />
              <GroupRules group={group} className="mt-6 border-t border-pine-300/60 pt-6" />
            </section>

            <section aria-labelledby="again-title" className="rounded-lg border border-dashed border-line-strong p-5 sm:p-6">
              <h2 id="again-title" className="font-display text-[1.5rem] leading-tight font-bold text-oxblood">
                Already joined?
              </h2>
              <p className="mt-1 mb-4 text-sm leading-relaxed text-ink-700">
                Enter the email you joined with and we’ll send your private link for this group again.
              </p>
              <RecoverForm inviteCode={group.inviteCode} demoMode={demoMode} idPrefix="invite-recover" />
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
