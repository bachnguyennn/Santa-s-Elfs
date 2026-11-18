import type { Metadata } from "next";
import Link from "next/link";
import { DangerZone } from "@/components/organizer/danger-zone";
import { friendlyDrawError } from "@/components/organizer/format";
import { SettingsForm } from "@/components/organizer/settings-form";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Group settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({ params }: PageProps<"/o/[groupId]/settings">) {
  const { groupId } = await params;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);
  // Computed on the server so the option list is identical during hydration.
  const zones = Intl.supportedValuesOf("timeZone");
  const timezones = zones.includes(d.group.timezone) ? zones : [d.group.timezone, ...zones];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      {d.group.drawError && d.group.status === "open" && (
        <Alert tone="error" title="The scheduled drawing didn’t happen">
          <p>{friendlyDrawError(d.group.drawError)}</p>
          <p className="mt-1">
            Fix it, then pick a new time below or{" "}
            <Link href={`/o/${groupId}/draw`} className="font-bold underline">
              draw names now
            </Link>
            . Saving clears this message.
          </p>
        </Alert>
      )}
      <Card>
        <CardHeader title="Settings" description="Everyone in the group sees these details on their page." />
        <SettingsForm groupId={groupId} group={d.group} timezones={timezones} locked={d.group.status !== "open"} />
      </Card>
      <DangerZone groupId={groupId} groupName={d.group.name} status={d.group.status} />
    </div>
  );
}
