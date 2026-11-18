import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NameHat } from "@/components/brand/name-hat";
import { GroupFacts, GroupRules } from "@/components/group/group-facts";
import { isEmailSimulated } from "@/components/participant/demo-note";
import { JoinForm } from "@/components/participant/join-form";
import { RecoverForm } from "@/components/participant/recover-form";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import type { InvitePreviewDTO } from "@/lib/contracts";
import { formatInZone } from "@/lib/time";
import { getDb } from "@/server/db";
import { getInvitePreview } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "You’re invited",
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

  return (
    <PageShell width="default">
      <div className="grid gap-8 lg:gap-10">
        {/* The invitation */}
        <Card tone="felt" className="relative overflow-hidden px-6 pt-7 pb-0 sm:px-9 sm:pt-9">
          <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="pb-7 sm:pb-9">
              <p className="text-pine-200">
                <strong className="font-bold text-cream-50">{group.organizerName}</strong> invited you to their Secret Santa
              </p>
              <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] break-words [text-wrap:balance]">
                {group.name}
              </h1>
              <p className="mt-4 text-pine-200">
                {group.approvedCount} of {group.capacity} places taken
                {group.isOpen && placesLeft <= 3 && placesLeft > 0 ? ` · only ${placesLeft} left` : ""}
              </p>
            </div>
            <NameHat className="mx-auto -mb-6 hidden w-56 sm:block" />
          </div>
        </Card>

        <section aria-labelledby="details-title">
          <h2 id="details-title" className="sr-only">
            Details
          </h2>
          <GroupFacts group={group} />
          <GroupRules group={group} className="mt-8 border-t border-line pt-6" />
        </section>

        {closed ? (
          <Card>
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-pine-900">{closed.title}</h2>
            <p className="mt-2 leading-relaxed text-ink-700">{closed.body}</p>
          </Card>
        ) : (
          <Card>
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-pine-900">Join the exchange</h2>
            <p className="mt-2 mb-6 leading-relaxed text-ink-700">
              {group.requiresApproval
                ? `${group.organizerName} approves each person, so you’ll be on a short waiting list until then. No account or password needed.`
                : "Add your name and email and you’re in. No account or password needed."}
            </p>
            <JoinForm inviteCode={group.inviteCode} requiresApproval={group.requiresApproval} demoMode={demoMode} />
          </Card>
        )}

        <section aria-labelledby="again-title" className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-5 sm:p-6">
          <h2 id="again-title" className="font-display text-lg font-bold text-pine-900">
            Already joined?
          </h2>
          <p className="mt-1 mb-4 text-sm leading-relaxed text-ink-700">
            Enter the email you joined with and we’ll send your private link for this group again.
          </p>
          <RecoverForm inviteCode={group.inviteCode} demoMode={demoMode} idPrefix="invite-recover" />
        </section>
      </div>
    </PageShell>
  );
}
