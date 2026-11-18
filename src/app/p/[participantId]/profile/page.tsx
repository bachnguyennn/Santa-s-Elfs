import { ArrowLeft, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileEditor } from "@/components/participant/profile-editor";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/ui/page-shell";
import { isUuid } from "@/server/services/groups";
import { getParticipantHome } from "@/server/services/participant";
import { participantPage } from "@/server/page-auth";

export const metadata: Metadata = {
  title: "Your profile & wishlist",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({ params }: PageProps<"/p/[participantId]/profile">) {
  const { participantId } = await params;
  if (!isUuid(participantId)) notFound();
  const { db, ctx } = await participantPage(participantId);
  const home = await getParticipantHome(db, ctx);
  const { participant: me, group } = home;
  // Rejected/removed people can't edit; their home page explains why.
  if (me.status !== "pending" && me.status !== "approved") redirect(`/p/${me.id}`);
  const readOnly = group.status === "closed";

  return (
    <PageShell
      width="narrow"
      headerAction={
        <Badge tone="neutral">
          <Lock aria-hidden /> Private page
        </Badge>
      }
    >
      <Link
        href={`/p/${me.id}`}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-pine-800 hover:bg-cream-100"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to {group.name}
      </Link>
      <h1 className="mt-2 font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900">
        Your profile & wishlist
      </h1>
      <p className="mt-2 mb-8 text-lg leading-relaxed text-ink-700">
        Only the person who draws your name sees this, after the drawing. Your Santa’s name stays a secret.
      </p>
      {readOnly && (
        <Alert tone="info" title="This exchange has finished" className="mb-6">
          Your profile is read-only now. The group is deleted automatically a while after the exchange.
        </Alert>
      )}
      <ProfileEditor participantId={me.id} initial={home.profile} readOnly={readOnly} />
    </PageShell>
  );
}
