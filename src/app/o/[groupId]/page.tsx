import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Elf } from "@/components/brand/elf";
import { Sparkle } from "@/components/brand/motifs";
import { PaperSlip } from "@/components/brand/paper-slip";
import { budgetLabel, drawLabel, exchangeLabel, friendlyDrawError } from "@/components/organizer/format";
import { Roster } from "@/components/organizer/roster";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { MIN_PARTICIPANTS, type OrganizerDashboardDTO } from "@/lib/contracts";
import { formatInZone } from "@/lib/time";
import { organizerPage } from "@/server/page-auth";
import { getOrganizerDashboard } from "@/server/services/groups";

export const metadata: Metadata = {
  title: "Organizer overview",
  robots: { index: false, follow: false },
};

export default async function OrganizerDashboardPage({ params, searchParams }: PageProps<"/o/[groupId]">) {
  const { groupId } = await params;
  const { created } = await searchParams;
  const { db, ctx } = await organizerPage(groupId);
  const d = await getOrganizerDashboard(db, ctx);
  const justCreated = created === "1";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {justCreated && <CreatedBanner inviteUrl={d.inviteUrl} />}
        {d.group.drawError && d.group.status === "open" && (
          <Alert tone="error" title="The elves couldn’t draw names at the scheduled time">
            <p>{friendlyDrawError(d.group.drawError)}</p>
            <p className="mt-1">
              <Link href={`/o/${groupId}/draw`} className="font-bold underline">
                Check what’s needed and draw now
              </Link>{" "}
              or{" "}
              <Link href={`/o/${groupId}/settings`} className="font-bold underline">
                pick a new time
              </Link>
              .
            </p>
          </Alert>
        )}
        <NextStep d={d} />
        <Roster groupId={groupId} status={d.group.status} participants={d.participants} approvedCount={d.approvedCount} capacity={d.capacity} />
      </div>

      <aside className="flex min-w-0 flex-col gap-6" aria-label="Group details">
        {!justCreated && (
          <Card>
            <CardHeader title="Invite people" as="h2" />
            {d.group.status === "open" ? (
              <>
                <CopyField value={d.inviteUrl} label="Invite link" hint="Paste it in your family or team chat. Anyone with it can ask to join." />
                <p className="mt-3 text-sm text-ink-700">
                  {d.group.requiresApproval
                    ? "You approve each person before they’re in."
                    : "People are in as soon as they join. Remove anyone who shouldn’t be."}
                </p>
              </>
            ) : (
              <p className="text-ink-700">Names are drawn, so joining is closed. The invite link now tells visitors the group is full.</p>
            )}
          </Card>
        )}

        <Card>
          <CardHeader
            title="The details"
            as="h2"
            action={
              d.group.status === "open" ? (
                <Link href={`/o/${groupId}/settings`} className="inline-flex min-h-11 items-center text-sm font-bold text-pine-600 underline">
                  Edit
                </Link>
              ) : undefined
            }
          />
          <dl className="grid gap-3 text-[0.9375rem]">
            <Detail term="Budget">{budgetLabel(d.group) ?? "No budget set"}</Detail>
            <Detail term="Exchange">{exchangeLabel(d.group.exchangeDate) ?? "No date set"}</Detail>
            <Detail term="Signups close">
              {d.group.signupDeadline ? formatInZone(d.group.signupDeadline, d.group.timezone) : "When names are drawn"}
            </Detail>
            <Detail term="Drawing">
              {d.group.drawnAt ? `Drawn ${formatInZone(d.group.drawnAt, d.group.timezone)}` : drawLabel(d.group)}
            </Detail>
            <Detail term="Joining">{d.group.requiresApproval ? "You approve each request" : "Anyone with the link"}</Detail>
            <Detail term="Places">
              <Capacity approved={d.approvedCount} capacity={d.capacity} />
            </Detail>
          </dl>
        </Card>

        <Card tone="plain">
          <CardHeader title="Emails" as="h2" description={`Sent from SantaElf to your group, including to you at ${d.group.organizerEmail}.`} />
          <dl className="grid grid-cols-3 gap-2 text-center">
            <EmailCount term="Sent" value={d.emails.sent} />
            <EmailCount term="On their way" value={d.emails.pending} />
            <EmailCount term="Failed" value={d.emails.failed} alert={d.emails.failed > 0} />
          </dl>
          {d.emails.failed > 0 && (
            <p className="mt-3 text-sm text-ink-700">Look for “Email failed” in the list and resend that person’s link, or ask them for a better address.</p>
          )}
          {d.emailSimulated && (
            <Alert tone="warning" className="mt-4" title="Demo mode: emails are simulated">
              Nothing really leaves this computer.{" "}
              <a href="/dev/outbox" className="font-bold underline">
                Open the simulated outbox
              </a>{" "}
              to see every email and private link.
            </Alert>
          )}
        </Card>

        {d.organizerParticipantId && (
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/p/${d.organizerParticipantId}`}>
              Your own Secret Santa page <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </aside>
    </div>
  );
}

/** The one authored moment on this screen: the group's first slip unfolds. */
function CreatedBanner({ inviteUrl }: { inviteUrl: string }) {
  return (
    <PaperSlip tilt={-0.6} className="relative motion-safe:animate-unfold p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <Elf pose="wave" className="hidden h-28 shrink-0 sm:block" />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] text-pine-900">
            Your group is ready
            <Sparkle className="size-5 text-gold-500 motion-safe:animate-twinkle" />
          </h2>
          <p className="mt-1 text-ink-700">Now invite your people. Send this link to everyone who should take part.</p>
          <CopyField value={inviteUrl} label="Invite link" className="mt-4" />
          <p className="mt-4 rounded-xl bg-gold-200/60 px-4 py-3 text-sm text-ink-900">
            Your private organizer link was emailed to you — keep it safe; it’s how you get back here.
          </p>
        </div>
      </div>
    </PaperSlip>
  );
}

function NextStep({ d }: { d: OrganizerDashboardDTO }) {
  const base = `/o/${d.groupId}`;
  if (d.group.status === "closed") {
    return (
      <Alert tone="info" title="This exchange is closed">
        Messages are read-only now. Everything is deleted automatically 60 days after the exchange.
      </Alert>
    );
  }
  if (d.group.status === "drawn") {
    const approved = d.participants.filter((p) => p.status === "approved");
    const opened = approved.filter((p) => p.revealed).length;
    return (
      <Card tone="felt">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">The names are drawn</h2>
        <p className="mt-1 text-pine-200">
          {opened === approved.length
            ? "Everyone has opened their card. Nothing left to do but wait for the gifts."
            : `${opened} of ${approved.length} have opened their card. Anyone who lost their email can get a new link below.`}
        </p>
        <Progress value={opened} max={approved.length} label="Cards opened" />
      </Card>
    );
  }
  const needed = Math.max(0, MIN_PARTICIPANTS - d.approvedCount);
  const blocked = d.readiness.issues.find((i) => i.code === "IMPOSSIBLE_EXCLUSIONS");
  return (
    <Card tone="felt" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
          {needed > 0 ? `${needed} more ${needed === 1 ? "person" : "people"} to go` : blocked ? "Your exclusions need a tweak" : "Ready when you are"}
        </h2>
        <p className="mt-1 text-pine-200">
          {needed > 0
            ? `The elves need at least ${MIN_PARTICIPANTS} people taking part before they can draw names.`
            : blocked
              ? "With the current rules nobody can be matched fairly. Loosen one exclusion and you’re set."
              : d.group.drawMethod === "scheduled" && d.group.drawAt
                ? `${drawLabel(d.group)}. You can also draw now.`
                : "Once everyone’s in, draw the names. Everyone gets an email with their private link."}
        </p>
      </div>
      {needed === 0 && (
        <Button asChild variant={blocked ? "light" : "festive"} className="w-full shrink-0 sm:w-auto">
          <Link href={blocked ? `${base}/exclusions` : `${base}/draw`}>{blocked ? "Review exclusions" : "Draw names"}</Link>
        </Button>
      )}
    </Card>
  );
}

function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="mt-4">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-pine-950/60"
      >
        <div className="h-full rounded-full bg-gold-400 transition-[width] duration-500 ease-[var(--ease-out-expo)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Capacity({ approved, capacity }: { approved: number; capacity: number }) {
  const pct = Math.round((approved / capacity) * 100);
  return (
    <span className="block">
      <span className="font-bold text-ink-900 tabular-nums">
        {approved} / {capacity}
      </span>{" "}
      approved
      <span
        role="progressbar"
        aria-label="Places filled"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={approved}
        className="mt-2 block h-2 overflow-hidden rounded-full bg-cream-200"
      >
        <span className={`block h-full rounded-full ${approved >= capacity ? "bg-berry-600" : "bg-pine-700"}`} style={{ width: `${pct}%` }} />
      </span>
      {approved >= capacity && <span className="mt-1 block text-sm font-bold text-berry-700">The group is full.</span>}
    </span>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-ink-500">{term}</dt>
      <dd className="text-ink-900">{children}</dd>
    </div>
  );
}

function EmailCount({ term, value, alert }: { term: string; value: number; alert?: boolean }) {
  return (
    <div className={`flex flex-col-reverse rounded-xl px-2 py-3 ${alert ? "bg-berry-100" : "bg-cream-100"}`}>
      <dt className={`text-xs ${alert ? "font-bold text-berry-700" : "text-ink-700"}`}>{term}</dt>
      <dd className={`font-display text-2xl font-bold tabular-nums ${alert ? "text-berry-700" : "text-pine-900"}`}>{value}</dd>
    </div>
  );
}
