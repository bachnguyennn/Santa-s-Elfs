import type { Metadata } from "next";
import { EmergencyReveal } from "@/components/organizer/emergency-reveal";
import { Alert } from "@/components/ui/alert";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Emergency lookup",
  robots: { index: false, follow: false },
};

export default async function EmergencyPage({ params }: PageProps<"/o/[groupId]/emergency">) {
  const { groupId } = await params;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);
  const people = d.participants.filter((p) => p.status === "approved").map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-pine-900">Emergency lookup</h2>
        <p className="mt-1 max-w-[60ch] text-ink-700">
          For when someone drops out or can’t buy their gift and you need to step in. It shows one person’s match, nobody else’s. Most
          exchanges never need it.
        </p>
      </div>
      {d.group.status === "open" ? (
        <Alert tone="info" title="Nothing to look up yet">
          This becomes available after the elves draw names.
        </Alert>
      ) : (
        <EmergencyReveal groupId={groupId} people={people} />
      )}
    </div>
  );
}
