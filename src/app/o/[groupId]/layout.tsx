import type { Metadata } from "next";
import { OrganizerNav } from "@/components/organizer/organizer-nav";
import { STATUS_LABEL, exchangeLabel } from "@/components/organizer/format";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/ui/page-shell";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Organizer",
  robots: { index: false, follow: false },
};

/** Organizer area chrome: group name, status, section tabs. Every child page re-checks auth itself. */
export default async function OrganizerLayout({ children, params }: LayoutProps<"/o/[groupId]">) {
  const { groupId } = await params;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);
  const status = STATUS_LABEL[d.group.status];
  const exchange = exchangeLabel(d.group.exchangeDate);

  return (
    <PageShell width="wide" headerAction={<Badge tone="neutral">Organizer</Badge>}>
      <div>
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] break-words text-pine-900 [text-wrap:balance]">
          {d.group.name}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700">
          <Badge tone={status.tone}>{status.text}</Badge>
          {exchange && <span>Exchange on {exchange}</span>}
          <span>
            {d.approvedCount} {d.approvedCount === 1 ? "person" : "people"} taking part
          </span>
        </p>
      </div>
      <OrganizerNav groupId={groupId} drawn={d.group.status !== "open"} />
      <div className="pt-8">{children}</div>
    </PageShell>
  );
}
