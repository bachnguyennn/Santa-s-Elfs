"use client";

import { Check, CircleAlert, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ElfFigure } from "@/components/workshop/art";
import { Sparkle, Star } from "@/components/brand/motifs";
import { PaperSlip } from "@/components/brand/paper-slip";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { MIN_PARTICIPANTS, type DrawReadinessDTO, type GroupStatus } from "@/lib/contracts";
import { cn } from "@/lib/utils";

/**
 * The draw: readiness checklist, one festive button behind a confirmation, then a short
 * elf celebration. The elves (server) do the matching; this page never sees the result.
 */
export function DrawPanel({
  groupId,
  status,
  readiness,
  scheduledLabel,
  drawnLabel,
  organizerParticipantId,
}: {
  groupId: string;
  status: GroupStatus;
  readiness: DrawReadinessDTO;
  /** "Fri, Dec 12, 7:00 PM EST" when the elves will draw automatically. */
  scheduledLabel: string | null;
  drawnLabel: string | null;
  organizerParticipantId: string | null;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [drawing, setDrawing] = React.useState(false);
  const [error, setError] = React.useState<{ code: string; message: string } | null>(null);
  const [justDrew, setJustDrew] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  async function draw() {
    setDrawing(true);
    setError(null);
    try {
      const res = await apiFetch<{ status: "drawn" | "already_drawn" }>(`/api/o/${groupId}/draw`, { body: { confirm: true } });
      setConfirmOpen(false);
      if (res.status === "drawn") setJustDrew(true);
      router.refresh();
      window.setTimeout(() => headingRef.current?.focus(), 60);
    } catch (err) {
      const e = err instanceof ApiRequestError ? err : new ApiRequestError("INTERNAL", "Something went wrong. Please try again.");
      setConfirmOpen(false);
      setError({ code: e.code, message: e.message });
      router.refresh();
    } finally {
      setDrawing(false);
    }
  }

  if (justDrew || status !== "open") {
    return (
      <Card tone="felt" className="overflow-hidden p-6 text-center sm:p-10">
        <div className="relative mx-auto w-fit">
          <ElfFigure className="w-28 sm:w-36" />
          {justDrew &&
            ["-left-6 top-2 size-5", "-right-4 top-8 size-4", "left-2 -top-3 size-3", "-right-8 top-24 size-3"].map((pos, i) => (
              <Sparkle
                key={pos}
                className={cn("absolute text-gold-400 opacity-0 motion-safe:animate-[sparkle_1600ms_var(--ease-out-expo)_both] motion-reduce:opacity-100", pos)}
                style={{ animationDelay: `${200 + i * 140}ms` }}
              />
            ))}
        </div>
        <PaperSlip tilt={-1.2} className={cn("mx-auto mt-2 max-w-md p-6 sm:p-8", justDrew && "motion-safe:animate-unfold")}>
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-[clamp(1.75rem,5vw,2.25rem)] leading-tight font-bold tracking-[-0.005em] text-pine-900 outline-none">
            {status === "closed" && !justDrew ? "This exchange is closed" : "The names are drawn!"}
          </h2>
          <p className="mt-2 text-ink-700">
            {justDrew
              ? "The elves matched everyone fairly. Nobody, you included, can see the full list."
              : drawnLabel
                ? `The elves drew names on ${drawnLabel}.`
                : "Names were drawn for this group."}
          </p>
        </PaperSlip>
        <div className="mx-auto mt-8 max-w-md text-left text-pine-200">
          <h3 className="font-display text-lg font-bold text-cream-50">What happens now</h3>
          <ul className="mt-3 flex flex-col gap-3">
            <NextItem>Everyone gets an email with their private link and opens a Christmas card showing who they’re buying for.</NextItem>
            <NextItem>The group is locked: nobody can join, leave or change the rules.</NextItem>
            <NextItem>On the overview you can see who has opened their card and resend anyone’s link.</NextItem>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {organizerParticipantId && (
              <Button asChild variant="light" className="w-full sm:w-auto">
                <Link href={`/p/${organizerParticipantId}/reveal`}>Open your own card</Link>
              </Button>
            )}
            <Button asChild variant={organizerParticipantId ? "ghost" : "light"} className={cn("w-full sm:w-auto", organizerParticipantId && "text-cream-50 hover:bg-pine-800")}>
              <Link href={`/o/${groupId}`}>Back to overview</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const notEnough = readiness.issues.find((i) => i.code === "NOT_ENOUGH_PARTICIPANTS");
  const impossible = readiness.issues.find((i) => i.code === "IMPOSSIBLE_EXCLUSIONS");
  const otherIssues = readiness.issues.filter((i) => i.code !== "NOT_ENOUGH_PARTICIPANTS" && i.code !== "IMPOSSIBLE_EXCLUSIONS");

  return (
    <div className="flex flex-col gap-6">
      {scheduledLabel && (
        <Alert tone="info" title={`The elves will draw names automatically on ${scheduledLabel}`}>
          Nothing to do but wait. If everyone’s already in, you can draw now instead.
        </Alert>
      )}

      <Card>
        <h2 className="font-display text-xl font-bold tracking-normal text-pine-900">Before the elves draw</h2>
        <ul className="mt-4 flex flex-col gap-3">
          <CheckItem
            ok={!notEnough}
            title={`At least ${MIN_PARTICIPANTS} people taking part`}
            detail={notEnough ? notEnough.message : `${readiness.approvedCount} people are in.`}
            action={notEnough ? <Link href={`/o/${groupId}`} className="font-bold text-pine-600 underline">Share the invite link</Link> : undefined}
          />
          <CheckItem
            ok={!impossible && !notEnough}
            waiting={!!notEnough}
            title="Everyone can be matched with your exclusions"
            detail={
              impossible
                ? "We couldn’t find a valid drawing with the current exclusions. Please adjust your rules and try again."
                : notEnough
                  ? "Checked once enough people are in."
                  : "A fair drawing is possible."
            }
            action={impossible ? <Link href={`/o/${groupId}/exclusions`} className="font-bold text-pine-600 underline">Adjust exclusions</Link> : undefined}
          />
          {otherIssues.map((i) => (
            <CheckItem key={i.code} ok={false} title={i.message} />
          ))}
        </ul>
        {readiness.warnings.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {readiness.warnings.map((w) => (
              <li key={w} className="flex gap-2 rounded-xl bg-gold-200/50 px-4 py-3 text-sm text-ink-900">
                <Info className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
                <span>
                  {w}{" "}
                  <Link href={`/o/${groupId}`} className="font-bold underline">
                    Review requests
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <Alert tone="error" className="mt-5" title="The names weren’t drawn">
            {error.code === "IMPOSSIBLE_EXCLUSIONS" ? (
              <>
                We couldn’t find a valid drawing with the current exclusions. Please adjust your rules and try again.{" "}
                <Link href={`/o/${groupId}/exclusions`} className="font-bold underline">
                  Adjust exclusions
                </Link>
              </>
            ) : error.code === "NOT_ENOUGH_PARTICIPANTS" ? (
              `You need at least ${MIN_PARTICIPANTS} approved people before the elves can draw.`
            ) : (
              error.message
            )}
          </Alert>
        )}

        <div className="mt-6 border-t-2 border-pine-800/15 pt-6">
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            trigger={
              <Button variant="festive" size="lg" disabled={!readiness.ready} className="w-full sm:w-auto">
                <Star aria-hidden /> Draw Secret Santa Names
              </Button>
            }
            title="Draw names now?"
            description="This can’t be undone. Everyone gets an email with a private link, and the group stops changing."
            cancelLabel="Not yet"
            actionLabel="Yes, draw names"
            actionVariant="festive"
            onAction={draw}
            busy={drawing}
          >
            <p className="text-sm text-ink-700">
              {readiness.approvedCount} people go into the draw.
              {readiness.pendingCount > 0 ? ` ${readiness.pendingCount} pending ${readiness.pendingCount === 1 ? "request stays" : "requests stay"} out.` : ""}
            </p>
          </ConfirmDialog>
          {!readiness.ready && <p className="mt-3 text-sm text-ink-700">Fix the items above and the button wakes up.</p>}
        </div>
      </Card>
    </div>
  );
}

function CheckItem({ ok, waiting, title, detail, action }: { ok: boolean; waiting?: boolean; title: string; detail?: string; action?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
          ok ? "bg-pine-700 text-cream-50" : waiting ? "border-2 border-line-strong bg-cream-50 text-ink-500" : "bg-berry-100 text-berry-700",
        )}
      >
        {ok ? <Check className="size-4" aria-hidden /> : waiting ? <span className="size-1.5 rounded-full bg-current" /> : <CircleAlert className="size-4" aria-hidden />}
      </span>
      <div className="min-w-0">
        <p className="font-bold text-ink-900">
          {title}
          <span className="sr-only">{ok ? " (done)" : waiting ? " (waiting)" : " (needs attention)"}</span>
        </p>
        {detail && <p className="text-sm text-ink-700">{detail}</p>}
        {action && <p className="mt-1 text-sm">{action}</p>}
      </div>
    </li>
  );
}

function NextItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Star className="mt-1 size-4 shrink-0 text-gold-400" />
      <span>{children}</span>
    </li>
  );
}
