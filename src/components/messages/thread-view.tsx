"use client";

import { BellOff, Bell, Flag, Send } from "lucide-react";
import * as React from "react";
import { HandName } from "@/components/brand/paper-slip";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { MESSAGE_MAX_LENGTH, type MessageDTO, type ThreadDTO } from "@/lib/contracts";
import { formatInZone } from "@/lib/time";
import { cn } from "@/lib/utils";

const POLL_MS = 20_000;

/**
 * One anonymous conversation. Bodies render as plain text (React escapes; line breaks kept).
 * Polls every 20s while the tab is visible. The "santa" thread never knows who the Santa is.
 */
export function ThreadView({
  participantId,
  initial,
  timezone,
  readOnly,
}: {
  participantId: string;
  initial: ThreadDTO;
  timezone: string;
  readOnly: boolean;
}) {
  const [thread, setThread] = React.useState(initial);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [muting, setMuting] = React.useState(false);
  const [reporting, setReporting] = React.useState<MessageDTO | null>(null);
  const [reportBusy, setReportBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const kind = thread.thread;
  const url = `/api/p/${participantId}/messages`;

  const refresh = React.useCallback(async () => {
    try {
      setThread(await apiFetch<ThreadDTO>(`${url}?thread=${kind}`));
    } catch {
      /* keep what we have; the next poll tries again */
    }
  }, [url, kind]);

  // Simple polling while the page is visible; catch up immediately when it becomes visible again.
  React.useEffect(() => {
    let timer: number | undefined;
    const schedule = () => {
      window.clearInterval(timer);
      if (document.visibilityState === "visible") timer = window.setInterval(refresh, POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
      schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Keep the latest message in view when the conversation grows.
  const count = thread.messages.length;
  const prevCount = React.useRef(count);
  React.useEffect(() => {
    if (count > prevCount.current) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    prevCount.current = count;
  }, [count]);
  React.useEffect(() => {
    if (initial.messages.length > 3) endRef.current?.scrollIntoView({ block: "end" });
  }, [initial.messages.length]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      setThread(await apiFetch<ThreadDTO>(url, { body: { thread: kind, body: text } }));
      setBody("");
      inputRef.current?.focus();
    } catch (err) {
      const e2 = err instanceof ApiRequestError ? err : null;
      if (e2?.code === "MUTED") {
        setThread((t) => ({ ...t, muted: true }));
        setError("Your giftee has paused messages. Your message wasn’t sent.");
      } else if (e2?.code === "RATE_LIMITED") {
        setError("That’s a lot of messages in a short time. Take a breather and try again in a few minutes.");
      } else {
        setError(e2?.fields.body ?? e2?.message ?? "Your message wasn’t sent. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Desktop: Enter sends, Shift+Enter adds a line. Touch keyboards keep Enter as a newline.
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    e.preventDefault();
    void send();
  }

  async function setMuted(muted: boolean) {
    setMuting(true);
    setError(null);
    try {
      setThread(await apiFetch<ThreadDTO>(`${url}/mute`, { body: { muted } }));
      setNotice(muted ? null : "Your Santa can message you again.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn’t work. Please try again.");
    } finally {
      setMuting(false);
    }
  }

  async function report() {
    if (!reporting) return;
    setReportBusy(true);
    setError(null);
    try {
      await apiFetch(`${url}/${reporting.id}/report`, { method: "POST", body: {} });
      setReporting(null);
      setNotice("Thanks for telling us. The message is flagged.");
      await refresh();
    } catch (err) {
      setReporting(null);
      setError(err instanceof ApiRequestError ? err.message : "That didn’t work. Please try again.");
    } finally {
      setReportBusy(false);
    }
  }

  const blockedByMute = kind === "recipient" && thread.muted;
  const left = MESSAGE_MAX_LENGTH - body.length;

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-3 border-b-2 border-pine-800/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
        {kind === "recipient" ? (
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight font-bold break-words text-pine-900">
              <span className="sr-only">Conversation with </span>
              <HandName className="text-[1.75rem] text-berry-700">{thread.counterpartLabel}</HandName>
            </h2>
            <p className="mt-1 text-ink-700">
              You appear as <HandName className="text-lg font-bold text-pine-900">{thread.santaAlias}</HandName>. They can’t see your name,
              but in a small group they might guess.
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight font-bold text-pine-900">
              <HandName className="text-[1.75rem] text-pine-900">{thread.santaAlias}</HandName> — Your Secret Santa
            </h2>
            <p className="mt-1 text-ink-700">They know who you are. You only see their alias until the gifts are opened.</p>
          </div>
        )}
        {kind === "santa" && !readOnly && (
          <Button size="sm" variant="secondary" onClick={() => setMuted(!thread.muted)} loading={muting} className="shrink-0 self-start sm:self-auto">
            {thread.muted ? <Bell aria-hidden /> : <BellOff aria-hidden />}
            {thread.muted ? "Unmute your Santa" : "Mute your Santa"}
          </Button>
        )}
      </header>

      <div aria-live="polite" className="empty:hidden">
        {notice && (
          <Alert tone="success" className="mt-4">
            {notice}
          </Alert>
        )}
      </div>
      {kind === "santa" && thread.muted && (
        <Alert tone="info" className="mt-4" title="Messages from your Santa are paused">
          They can’t write to you until you unmute. You can still write to them.
        </Alert>
      )}

      <ol className="flex flex-col gap-3 py-6" aria-label="Messages">
        {thread.messages.length === 0 && (
          <li className="rounded-xl bg-cream-100 px-4 py-8 text-center text-ink-700">
            {kind === "recipient"
              ? `No messages yet. Ask ${thread.counterpartLabel} about sizes, colours or anything on their list.`
              : "No messages from your Santa yet. You can write first: a thank-you, or a hint."}
          </li>
        )}
        {thread.messages.map((m) => (
          <li key={m.id} className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", m.fromMe ? "items-end self-end" : "items-start self-start")}>
            <span className="sr-only">{m.fromMe ? "You said:" : kind === "recipient" ? `${thread.counterpartLabel} said:` : `${thread.santaAlias} said:`}</span>
            <p
              className={cn(
                "rounded-[1.25rem] px-4 py-2.5 whitespace-pre-wrap [overflow-wrap:anywhere]",
                m.fromMe ? "rounded-br-md bg-pine-800 text-cream-50" : "rounded-bl-md border border-line bg-white text-ink-900",
              )}
            >
              {m.body}
            </p>
            <span className="flex items-center gap-2 px-1 text-xs text-ink-500">
              <time dateTime={m.createdAt}>{formatInZone(m.createdAt, timezone, { weekday: undefined, timeZoneName: undefined })}</time>
              {kind === "santa" && !m.fromMe && !readOnly && (
                <button
                  type="button"
                  onClick={() => setReporting(m)}
                  className="-my-3 inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-bold text-ink-700 underline-offset-2 hover:text-berry-700 hover:underline"
                >
                  <Flag className="size-3.5" aria-hidden /> Report<span className="sr-only"> this message</span>
                </button>
              )}
            </span>
          </li>
        ))}
      </ol>
      <div ref={endRef} />

      {readOnly ? (
        <Alert tone="info" title="This exchange has wrapped up">
          Messages are read-only now. Thanks for being a Secret Santa!
        </Alert>
      ) : blockedByMute ? (
        <Alert tone="info" title="Your giftee has paused messages.">
          You can’t send messages right now. Their wishlist is still on your card.
        </Alert>
      ) : (
        <form
          onSubmit={send}
          className="sticky bottom-0 -mx-4 border-t border-line bg-cream-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:mx-0 sm:rounded-[var(--radius-card)] sm:border sm:px-4"
        >
          {error && (
            <Alert tone="error" className="mb-3">
              {error}
            </Alert>
          )}
          <label htmlFor="message-body" className="sr-only">
            {kind === "recipient" ? `Message to ${thread.counterpartLabel}` : `Message to ${thread.santaAlias}, your Secret Santa`}
          </label>
          <div className="flex items-end gap-2">
            <Textarea
              id="message-body"
              ref={inputRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MESSAGE_MAX_LENGTH}
              rows={2}
              disabled={sending}
              aria-describedby="message-hint"
              placeholder={kind === "recipient" ? `Write as ${thread.santaAlias}…` : "Write to your Santa…"}
              className="max-h-48 min-h-14 flex-1 resize-none [field-sizing:content]"
            />
            <Button type="submit" loading={sending} disabled={!body.trim()} className="shrink-0" aria-label="Send message">
              {!sending && <Send aria-hidden />}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p id="message-hint" className="mt-1.5 flex justify-between gap-3 text-xs text-ink-500">
            <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline">Enter to send, Shift+Enter for a new line</span>
            <span className={cn("ml-auto tabular-nums", left < 100 && "font-bold text-berry-700")}>
              {body.length}/{MESSAGE_MAX_LENGTH}
            </span>
          </p>
        </form>
      )}

      <Dialog
        open={reporting !== null}
        onOpenChange={(o) => !o && setReporting(null)}
        title="Report this message?"
        description="We flag the message and pause messages from your Santa, so they can’t write to you until you unmute."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="danger" onClick={report} loading={reportBusy}>
              Report and pause
            </Button>
          </>
        }
      >
        {reporting && <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm whitespace-pre-wrap text-ink-700 [overflow-wrap:anywhere]">{reporting.body}</p>}
      </Dialog>
    </div>
  );
}
