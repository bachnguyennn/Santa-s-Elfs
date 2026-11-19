import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { OrganizerNav } from "@/components/organizer/organizer-nav";
import { STATUS_LABEL, exchangeLabel } from "@/components/organizer/format";
import { Badge } from "@/components/ui/badge";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { WorkshopDoor } from "@/components/village/doors";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Workshop",
  robots: { index: false, follow: false },
};

/**
 * Inside the Workshop: the green arched door and brass bell carried in from outside, the group name,
 * and the rooms. Every child page re-checks auth itself.
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
      <main id="main" tabIndex={-1} className="flex-1 bg-[#F6EBD6] outline-none">
        <div className="relative border-b-[2.5px] border-midnight bg-[#EFDDBA]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-3 bg-timber" />
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
            <div className="flex items-end gap-4 sm:gap-6">
              <WorkshopDoor className="h-20 w-auto shrink-0 sm:h-28" />
              <div className="min-w-0 pb-1">
                <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] break-words [text-wrap:balance]">
                  {d.group.name}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-midnight-soft">
                  <Badge tone={status.tone}>{status.text}</Badge>
                  {exchange && <span>Exchange on {exchange}</span>}
                  <span>
                    {d.approvedCount} {d.approvedCount === 1 ? "person" : "people"} taking part
                  </span>
                </p>
              </div>
            </div>
            <OrganizerNav groupId={groupId} drawn={d.group.status !== "open"} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
