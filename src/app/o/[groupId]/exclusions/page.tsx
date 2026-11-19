import type { Metadata } from "next";
import { ExclusionsManager } from "@/components/organizer/exclusions-manager";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Exclusions",
  robots: { index: false, follow: false },
};

export default async function ExclusionsPage({ params }: PageProps<"/o/[groupId]/exclusions">) {
  const { groupId } = await params;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-normal text-pine-900">Who shouldn’t draw whom</h2>
        <p className="mt-1 max-w-[60ch] text-ink-700">
          Keep couples, housemates or last year’s pairs apart. Each rule makes the hat a little smaller, so add only the ones that matter.
        </p>
      </div>
      <ExclusionsManager
        groupId={groupId}
        people={d.participants.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
        initialExclusions={d.exclusions}
        initialReadiness={d.readiness}
        locked={d.group.status !== "open"}
      />
    </div>
  );
}
