"use client";

import { AlertDialog as A } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * OWNER: design agent. Confirmation for irreversible decisions (SPEC: Radix Alert Dialog).
 * Title + description, Cancel and the destructive Action. Initial focus goes to Cancel; focus returns
 * to the opener on close. The server's own authorization and confirmation checks still apply.
 *
 *   <ConfirmDialog trigger={<Button variant="danger">Delete group…</Button>} title="Delete this group?"
 *     description="…" actionLabel="Delete group" onAction={del} busy={busy} />
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  children,
  cancelLabel = "Cancel",
  actionLabel,
  onAction,
  busy = false,
  actionDisabled = false,
  actionVariant = "danger",
  open,
  onOpenChange,
  className,
}: {
  trigger?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
  cancelLabel?: string;
  actionLabel: string;
  /** Runs the action. The dialog stays open (busy) until the caller closes it via onOpenChange/open. */
  onAction: () => void | Promise<void>;
  busy?: boolean;
  actionDisabled?: boolean;
  /** "danger" for destruction (delete, remove); "festive" for an irreversible step forward (the draw). */
  actionVariant?: "danger" | "festive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <A.Trigger asChild>{trigger}</A.Trigger>}
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-oxblood-deep/60 data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <A.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancelRef.current?.focus();
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[var(--radius-card)] border border-paper-line bg-cream-50 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lifted)]",
            "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-card)]",
            "data-[state=open]:animate-[dialog-in_320ms_var(--ease-out-expo)]",
            className,
          )}
        >
          <A.Title className="font-display text-[1.75rem] leading-tight font-bold text-oxblood">{title}</A.Title>
          <A.Description asChild>
            <div className="mt-2 text-ink-700">{description}</div>
          </A.Description>
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <A.Cancel asChild>
              <Button ref={cancelRef} variant="secondary" disabled={busy}>
                {cancelLabel}
              </Button>
            </A.Cancel>
            <Button
              variant={actionVariant}
              loading={busy}
              disabled={actionDisabled}
              onClick={(e) => {
                e.preventDefault();
                void onAction();
              }}
            >
              {actionLabel}
            </Button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
