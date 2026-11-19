import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileEditor } from "@/components/participant/profile-editor";
import { Alert } from "@/components/ui/alert";
import { ParticipantShell, RoomHeader } from "@/components/village/participant-shell";
import { isUuid } from "@/server/services/groups";
import { getParticipantHome } from "@/server/services/participant";
import { participantPage } from "@/server/page-auth";

export const metadata: Metadata = {
  title: "Gift House",
  robots: { index: false, follow: false },
};

/** The Gift House interior: the participant's own wishlist and profile, on a paper list. */
export default async function ProfilePage({ params }: PageProps<"/p/[participantId]/profile">) {
  const { participantId } = await params;
  if (!isUuid(participantId)) notFound();
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);
  const { participant: me, group } = home;
  // Rejected/removed people can't edit; their village page explains why.
  if (me.status !== "pending" && me.status !== "approved") redirect(`/p/${me.id}`);
  const readOnly = group.status === "closed";

  return (
    <ParticipantShell participantId={participantId} className="bg-parchment">
      <RoomHeader art="gift-house" position="28% 52%" title="Gift House">
        Your wishlist and a few words about you. Only the person who draws your name sees this, after the drawing.
      </RoomHeader>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href={`/p/${me.id}#gift-house`}
          className="mb-6 inline-flex min-h-11 items-center gap-2 font-bold text-evergreen underline decoration-2 underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to the village
        </Link>
        {readOnly && (
          <Alert tone="info" title="This exchange has finished" className="mb-6">
            Your wishlist is read-only now. The group is deleted automatically a while after the exchange.
          </Alert>
        )}
        <ProfileEditor participantId={me.id} initial={home.profile} readOnly={readOnly} />
      </div>
    </ParticipantShell>
  );
}
