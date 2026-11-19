"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Modal dialog on Radix (focus trap, Esc, aria wiring).
 * Use only for confirmations that protect something (delete, remove, emergency reveal) or a short
 * focused task. Not for information that could sit on the page.
 *
 *   <Dialog trigger={<Button variant="danger">Delete group</Button>} title="Delete this group?"
 *           description="Everyone loses access. This can't be undone."
 *           footer={<><DialogClose asChild><Button variant="secondary">Keep it</Button></DialogClose>
 *                    <Button variant="danger" onClick={…}>Delete group</Button></>} />
 *
 * Controlled use: pass `open` + `onOpenChange` (trigger optional).
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  className,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-oxblood-deep/60 data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <D.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[var(--radius-card)] border border-paper-line bg-cream-50 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lifted)]",
            "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-card)]",
            "data-[state=open]:animate-[dialog-in_320ms_var(--ease-out-expo)]",
            className,
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <D.Title className="pr-10 font-display text-xl leading-tight font-bold tracking-normal text-oxblood">{title}</D.Title>
          {description && <D.Description className="mt-2 text-ink-700">{description}</D.Description>}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
          <D.Close
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-midnight hover:bg-cream-200"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;
