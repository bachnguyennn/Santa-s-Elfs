import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { OrganizerNav } from "@/components/organizer/organizer-nav";
import { STATUS_LABEL, exchangeLabel } from "@/components/organizer/format";
import { Badge } from "@/components/ui/badge";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { SceneBanner } from "@/components/workshop/art";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Workshop",
  robots: { index: false, follow: false },
};

/**
 * The organizer's Workshop: a shallow crop of the desk with the group name, then the rooms.
 * Every child page re-checks auth itself.
 */
export default async function OrganizerLayout({ children, params }: LayoutProps<"/o/[groupId]">) {
  const { groupId } = await params;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);
  const status = STATUS_LABEL[d.group.status];
  const exchange = exchangeLabel(d.group.exchangeDate);

  return (
    <>
      <SkipLink />
      <SiteHeader
        action={
          <Badge tone="neutral">
            <Lock aria-hidden /> Organizer
          </Badge>
        }
      />
      <main id="main" tabIndex={-1} className="flex-1 bg-parchment outline-none">
        {/* A quieter working interior: a shallow crop of the desk, then the rooms. */}
        <SceneBanner name="writing-desk" position="38% 64%" className="h-[clamp(11rem,22vw,15rem)]">
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] font-bold break-words [text-wrap:balance]">{d.group.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-buttercream/90">
              <Badge tone={status.tone}>{status.text}</Badge>
              {exchange && <span>Exchange on {exchange}</span>}
              <span>
                {d.approvedCount} {d.approvedCount === 1 ? "person" : "people"} taking part
              </span>
            </p>
          </div>
        </SceneBanner>
        <div className="border-b border-paper-line bg-cream-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <OrganizerNav groupId={groupId} drawn={d.group.status !== "open"} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
