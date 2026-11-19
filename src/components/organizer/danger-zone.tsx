"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Field, Input } from "@/components/ui/field";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import type { GroupStatus } from "@/lib/contracts";

/** Close the exchange or delete the group for good. Both sit behind a confirmation. */
export function DangerZone({ groupId, groupName, status }: { groupId: string; groupName: string; status: GroupStatus }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"close" | "delete" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const confirmText = groupName.trim();
  const matches = typed.trim().toLowerCase() === confirmText.toLowerCase();

  async function closeExchange() {
    setBusy("close");
    setError(null);
    try {
      await apiFetch(`/api/o/${groupId}/close`, { method: "POST", body: {} });
      setCloseOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteGroup() {
    if (!matches) return;
    setBusy("delete");
    setError(null);
    try {
      await apiFetch(`/api/o/${groupId}`, { method: "DELETE" });
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  return (
    <Card id="back-room" tone="plain" className="mt-6 scroll-mt-6 border-dashed border-cranberry-deep">
      <CardHeader title="The back room: finish or delete" as="h2" description="Kept apart because these can’t be undone. Each one asks you to confirm." />
      <div className="flex flex-col divide-y-2 divide-dashed divide-snow-shadow">
        <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="font-bold text-ink-900">Close the exchange</h3>
            <p className="text-sm text-ink-700">
              {status === "closed"
                ? "This exchange is closed. Messages are read-only."
                : "When the gifts are swapped. Messages become read-only and nothing else can change."}
            </p>
          </div>
          {status !== "closed" && (
            <ConfirmDialog
              open={closeOpen}
              onOpenChange={setCloseOpen}
              trigger={
                <Button variant="secondary" className="w-full shrink-0 sm:w-auto">
                  Close exchange
                </Button>
              }
              title="Close this exchange?"
              description={
                status === "open"
                  ? "Names haven’t been drawn yet. Closing now ends the exchange without a drawing, and no one can join."
                  : "Everyone keeps their envelope and wishlist, but letters become read-only. The group is still deleted 60 days after the exchange."
              }
              cancelLabel="Keep it open"
              actionLabel="Close exchange"
              onAction={closeExchange}
              busy={busy === "close"}
            />
          )}
        </div>
        <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="font-bold text-ink-900">Delete the group</h3>
            <p className="text-sm text-ink-700">Removes everyone, every wishlist and every message right away. All private links stop working.</p>
          </div>
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={(o) => {
              setDeleteOpen(o);
              if (!o) setTyped("");
            }}
            trigger={
              <Button variant="danger" className="w-full shrink-0 sm:w-auto">
                Delete group
              </Button>
            }
            title="Delete this group permanently?"
            description="Everyone loses access and all wishlists and letters are erased. This can’t be undone."
            cancelLabel="Keep the group"
            actionLabel="Delete forever"
            actionDisabled={!matches}
            onAction={deleteGroup}
            busy={busy === "delete"}
          >
            <Field id="confirm-delete" label={`Type the group name to confirm: ${confirmText}`}>
              {(a) => <Input {...a} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />}
            </Field>
          </ConfirmDialog>
        </div>
      </div>
      {error && (
        <Alert tone="error" title="That didn’t work" className="mt-4">
          {error}
        </Alert>
      )}
    </Card>
  );
}
