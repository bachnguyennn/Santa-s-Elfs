import type { Metadata } from "next";
import { DrawPanel } from "@/components/organizer/draw-panel";
import { formatInZone } from "@/lib/time";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Draw names",
  robots: { index: false, follow: false },
};

export default async function DrawPage({ params }: PageProps<"/o/[groupId]/draw">) {
  const { groupId } = await params;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);
  const g = d.group;

  return (
    <div className="mx-auto max-w-2xl">
      <DrawPanel
        groupId={groupId}
        status={g.status}
        readiness={d.readiness}
        scheduledLabel={g.drawMethod === "scheduled" && g.drawAt ? formatInZone(g.drawAt, g.timezone) : null}
        drawnLabel={g.drawnAt ? formatInZone(g.drawnAt, g.timezone) : null}
        organizerParticipantId={d.organizerParticipantId}
      />
    </div>
  );
}
