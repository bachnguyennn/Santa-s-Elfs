"use client";

import { Gift, MailCheck, MailOpen, MailQuestion, MailWarning, MailX } from "lucide-react";
import * as React from "react";
import { HandName } from "@/components/brand/paper-slip";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import type { GroupStatus, OrganizerParticipantDTO } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { useAction } from "./use-action";

const STATUS_BADGE = {
  pending: { tone: "gold", text: "Waiting for approval" },
  approved: { tone: "green", text: "Taking part" },
  rejected: { tone: "red", text: "Declined" },
  removed: { tone: "red", text: "Removed" },
} as const;

/**
 * The organizer's people: pending requests (approve / decline), everyone taking part
 * (wishlist, email delivery, card opened, resend link, remove) and those not taking part.
 * After the drawing it shows who opened their card — never who drew whom.
 */
export function Roster({
  groupId,
  status,
  participants,
  approvedCount,
  capacity,
}: {
  groupId: string;
  status: GroupStatus;
  participants: OrganizerParticipantDTO[];
  approvedCount: number;
  capacity: number;
}) {
  const { busy, error, run } = useAction((e) =>
    e.code === "GROUP_FULL"
      ? `The group is full (${capacity} of ${capacity}). Decline or remove someone before approving another request.`
      : e.code === "GROUP_LOCKED"
        ? "Names have been drawn, so the group can’t change any more."
        : e.code === "RATE_LIMITED"
          ? "That link was resent a few times already. Wait an hour and try again."
          : undefined,
  );
  const [notice, setNotice] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<OrganizerParticipantDTO | null>(null);
  const open = status === "open";
  const full = approvedCount >= capacity;

  const pending = participants.filter((p) => p.status === "pending");
  const approved = participants.filter((p) => p.status === "approved");
  const inactive = participants.filter((p) => p.status === "rejected" || p.status === "removed");
  const drawn = status !== "open";

  async function decide(p: OrganizerParticipantDTO, action: "approve" | "reject" | "remove") {
    setNotice(null);
    const ok = await run(`${action}:${p.id}`, () =>
      apiFetch<OrganizerParticipantDTO>(`/api/o/${groupId}/participants/${p.id}`, { method: "PATCH", body: { action } }),
    );
    if (ok) {
      setNotice(
        action === "approve" ? `${p.name} is in. We emailed them.` : action === "reject" ? `${p.name}’s request was declined.` : `${p.name} was removed.`,
      );
    }
    return ok;
  }

  async function resend(p: OrganizerParticipantDTO) {
    setNotice(null);
    const ok = await run(`resend:${p.id}`, () => apiFetch(`/api/o/${groupId}/participants/${p.id}/resend`, { method: "POST", body: {} }));
    if (ok) setNotice(`We’re emailing ${p.name} a fresh private link.`);
  }

  return (
    <div className="flex flex-col gap-6">
      {(error || notice) && (
        <div aria-live="polite">
          {error ? (
            <Alert tone="error" title="That didn’t work">
              {error}
            </Alert>
          ) : (
            <Alert tone="success">{notice}</Alert>
          )}
        </div>
      )}

      {pending.length > 0 && (
        <Card>
          <CardHeader
            title={`Waiting for you (${pending.length})`}
            description={
              open
                ? full
                  ? "The group is full. Decline a request or remove someone to make room."
                  : "These people asked to join. They’re not in the drawing until you approve them."
                : "These requests weren’t approved before the drawing, so they’re not part of it."
            }
          />
          <ul>
            {pending.map((p) => (
              <Row key={p.id} p={p}>
                {open && (
                  <>
                    <Button size="sm" onClick={() => decide(p, "approve")} loading={busy === `approve:${p.id}`} disabled={!!busy || full}>
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => decide(p, "reject")} loading={busy === `reject:${p.id}`} disabled={!!busy}>
                      Decline
                    </Button>
                  </>
                )}
              </Row>
            ))}
          </ul>
        </Card>
      )}

      <Card tone="plain">
        <CardHeader
          title={`Taking part (${approved.length} of ${capacity})`}
          description={
            drawn
              ? "You can see who has opened their card. Who drew whom stays secret, even from you."
              : "Everyone here goes into the hat when names are drawn."
          }
        />
        {approved.length === 0 ? (
          <p className="rounded-xl bg-cream-100 px-4 py-6 text-center text-ink-700">
            No one is in yet. Share the invite link and people will appear here as they join.
          </p>
        ) : (
          <ul>
            {approved.map((p) => (
              <Row key={p.id} p={p} drawn={drawn}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => resend(p)}
                  loading={busy === `resend:${p.id}`}
                  disabled={!!busy || status === "closed"}
                  aria-label={`Resend link to ${p.name}`}
                >
                  Resend link
                </Button>
                {open && !p.isOrganizer && (
                  <Button size="sm" variant="ghost" className="text-berry-700" onClick={() => setRemoving(p)} disabled={!!busy} aria-label={`Remove ${p.name}`}>
                    Remove
                  </Button>
                )}
              </Row>
            ))}
          </ul>
        )}
      </Card>

      {inactive.length > 0 && (
        <details className="group rounded-[var(--radius-card)] border border-line bg-cream-100/60 px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 font-bold text-pine-900 [&::-webkit-details-marker]:hidden">
            Not taking part ({inactive.length})
            <span aria-hidden className="text-sm font-normal text-ink-500 group-open:hidden">
              Show
            </span>
            <span aria-hidden className="hidden text-sm font-normal text-ink-500 group-open:inline">
              Hide
            </span>
          </summary>
          <ul className="pb-2">
            {inactive.map((p) => (
              <Row key={p.id} p={p}>
                {open && (
                  <Button size="sm" variant="secondary" onClick={() => decide(p, "approve")} loading={busy === `approve:${p.id}`} disabled={!!busy || full}>
                    Let back in
                  </Button>
                )}
              </Row>
            ))}
          </ul>
        </details>
      )}

      <Dialog
        open={removing !== null}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        title={removing ? `Remove ${removing.name}?` : "Remove participant?"}
        description="Their private link stops working and they won’t be in the drawing. You can let them back in later, until names are drawn."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Keep them</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={!!removing && busy === `remove:${removing.id}`}
              onClick={async () => {
                if (!removing) return;
                await decide(removing, "remove");
                setRemoving(null);
              }}
            >
              Remove {removing?.name}
            </Button>
          </>
        }
      />
    </div>
  );
}

function Row({ p, drawn, children }: { p: OrganizerParticipantDTO; drawn?: boolean; children?: React.ReactNode }) {
  const badge = STATUS_BADGE[p.status];
  return (
    <li className="flex flex-col gap-3 border-t-2 border-pine-800/15 py-4 first:border-t-0 first:pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <HandName className="text-lg leading-tight break-words text-pine-900">{p.name}</HandName>
          {p.isOrganizer && <Badge>You</Badge>}
          {p.status !== "approved" && p.status !== "pending" && <Badge tone={badge.tone}>{badge.text}</Badge>}
        </p>
        <p className="text-sm break-all text-ink-500">{p.email}</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700" aria-label={`About ${p.name}`}>
          {p.status === "approved" && (
            <li className="inline-flex items-center gap-1.5">
              <Gift className={cn("size-4", p.hasProfile ? "text-pine-700" : "text-ink-500")} aria-hidden />
              {p.hasProfile ? "Wishlist added" : "No wishlist yet"}
            </li>
          )}
          <EmailStatus email={p.lastEmail} />
          {drawn && p.revealed !== null && (
            <li className="inline-flex items-center gap-1.5">
              <MailOpen className={cn("size-4", p.revealed ? "text-pine-700" : "text-ink-500")} aria-hidden />
              {p.revealed ? <span className="font-bold text-pine-800">Opened their card</span> : "Hasn’t opened their card"}
            </li>
          )}
        </ul>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{children}</div>}
    </li>
  );
}

function EmailStatus({ email }: { email: OrganizerParticipantDTO["lastEmail"] }) {
  if (!email)
    return (
      <li className="inline-flex items-center gap-1.5">
        <MailQuestion className="size-4 text-ink-500" aria-hidden />
        No email yet
      </li>
    );
  if (email.status === "failed")
    return (
      <li className="inline-flex items-center gap-1.5 font-bold text-berry-700">
        <MailX className="size-4" aria-hidden />
        Email failed. Check the address or resend.
      </li>
    );
  if (email.status === "sent")
    return (
      <li className="inline-flex items-center gap-1.5">
        <MailCheck className="size-4 text-pine-700" aria-hidden />
        Email sent
      </li>
    );
  return (
    <li className="inline-flex items-center gap-1.5">
      <MailWarning className="size-4 text-gold-700" aria-hidden />
      Email on its way
    </li>
  );
}
