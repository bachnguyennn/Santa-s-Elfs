"use client";

import { Bell, BellOff, Flag, Send } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { C, line } from "@/components/village/art";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { MESSAGE_MAX_LENGTH, type MessageDTO, type Thread, type ThreadDTO } from "@/lib/contracts";
import { formatInZone } from "@/lib/time";
import { cn } from "@/lib/utils";

const POLL_MS = 20_000;

/** Everything one conversation keeps for itself, so switching mail slots never mixes them. */
interface Desk {
  thread: ThreadDTO;
  draft: string;
  sending: boolean;
  error: string | null;
  notice: string | null;
  /** Letters sent from this desk during this visit: they get the elf's postmark. */
  stamped: string[];
}
const deskFor = (thread: ThreadDTO): Desk => ({ thread, draft: "", sending: false, error: null, notice: null, stamped: [] });

/** The elf's postmark on a letter that was just sent. Decorative. */
function Postmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <circle cx={32} cy={32} r={26} fill={C.paper} fillOpacity={0.6} stroke={C.cranberry} strokeWidth={3} />
      <circle cx={32} cy={32} r={19} fill="none" stroke={C.cranberry} strokeWidth={1.5} />
      <path d="M32 20l3.4 7.4 8 .8-6 5.4 1.8 7.9L32 37.4l-7.2 4.1 1.8-7.9-6-5.4 8-.8z" fill={C.cranberry} />
    </svg>
  );
}

function SlotLetters({ count }: { count: number }) {
  return (
    <span aria-hidden className="absolute inset-x-3 top-2 flex justify-center gap-1">
      {Array.from({ length: Math.max(1, Math.min(3, count)) }).map((_, i) => (
        <svg key={i} viewBox="0 0 40 26" className={cn("h-7 w-auto sm:h-8", i === 1 && "-translate-y-1 rotate-3", i === 2 && "-rotate-6")}>
          <rect x={1.5} y={1.5} width={37} height={23} rx={2} fill={i ? C.paper : C.snow} {...line} strokeWidth={2} />
          <path d="M1.5 1.5l18.5 12 18.5-12" fill="none" {...line} strokeWidth={1.5} />
        </svg>
      ))}
    </span>
  );
}

/**
 * The Post Office (REDESIGN_BRIEF.md §3): a cabinet of two mail slots, one per conversation, and the
 * counter where the active one is read and answered. Each slot is a link (replace: no history entry,
 * so Back returns to the village doorstep). This component stays mounted across slot switches and
 * keeps one Desk per conversation: its own draft, sending state, error and confirmation.
 * Message bodies render as plain text. The "santa" thread never reveals who the Santa is.
 */
export function Mailroom({
  participantId,
  current,
  threads,
  myAlias,
  timezone,
  readOnly,
  emptyState,
}: {
  participantId: string;
  current: Thread;
  /** Server-loaded conversations; null when not available yet (not drawn, envelope still sealed). */
  threads: Record<Thread, ThreadDTO | null>;
  myAlias: string | null;
  timezone: string;
  readOnly: boolean;
  /** Shown on the counter when the current slot has no conversation yet. */
  emptyState: React.ReactNode;
}) {
  const [desks, setDesks] = React.useState<Partial<Record<Thread, Desk>>>(() => ({
    ...(threads.recipient ? { recipient: deskFor(threads.recipient) } : {}),
    ...(threads.santa ? { santa: deskFor(threads.santa) } : {}),
  }));
  const update = React.useCallback(
    (k: Thread, patch: Partial<Desk> | ((d: Desk) => Partial<Desk>)) =>
      setDesks((all) => {
        const d = all[k];
        if (!d) return all;
        return { ...all, [k]: { ...d, ...(typeof patch === "function" ? patch(d) : patch) } };
      }),
    [],
  );

  const [muting, setMuting] = React.useState(false);
  const [reporting, setReporting] = React.useState<MessageDTO | null>(null);
  const [reportBusy, setReportBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const url = `/api/p/${participantId}/messages`;
  const desk = desks[current];

  const refresh = React.useCallback(
    async (k: Thread) => {
      try {
        const fresh = await apiFetch<ThreadDTO>(`${url}?thread=${k}`);
        update(k, { thread: fresh });
      } catch {
        /* keep what we have; the next poll tries again */
      }
    },
    [url, update],
  );

  // Poll the open conversation while the page is visible; catch up when it becomes visible again.
  React.useEffect(() => {
    if (!desks[current]) return;
    let timer: number | undefined;
    const schedule = () => {
      window.clearInterval(timer);
      if (document.visibilityState === "visible") timer = window.setInterval(() => void refresh(current), POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(current);
      schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run per slot, not per desk change
  }, [current, refresh, !!desks[current]]);

  // Keep the newest letter in view when this conversation grows.
  const count = desk?.thread.messages.length ?? 0;
  const prev = React.useRef({ current, count });
  React.useEffect(() => {
    if (prev.current.current === current && count > prev.current.count) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    prev.current = { current, count };
  }, [current, count]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const k = current; // the slot this letter belongs to, even if the visitor switches mid-send
    const d = desks[k];
    if (!d) return;
    const text = d.draft.trim();
    if (!text || d.sending) return;
    update(k, { sending: true, error: null, notice: null });
    try {
      const fresh = await apiFetch<ThreadDTO>(url, { body: { thread: k, body: text } });
      const known = new Set(d.thread.messages.map((m) => m.id));
      const mine = fresh.messages.filter((m) => m.fromMe && !known.has(m.id)).map((m) => m.id);
      update(k, (now) => ({
        thread: fresh,
        sending: false,
        // Only clear the draft if it is still the letter that was sent.
        draft: now.draft.trim() === text ? "" : now.draft,
        stamped: [...now.stamped, ...mine],
        notice: k === "recipient" ? `Sent, signed ${fresh.santaAlias}.` : "Sent to your Santa.",
      }));
    } catch (err) {
      const e2 = err instanceof ApiRequestError ? err : null;
      // Keep what they typed; explain beside the action.
      if (e2?.code === "MUTED") {
        update(k, (now) => ({ sending: false, thread: { ...now.thread, muted: true }, error: "Your giftee has paused messages. Your letter wasn’t sent." }));
      } else if (e2?.code === "RATE_LIMITED") {
        update(k, { sending: false, error: "That’s a lot of letters in a short time. Try again in a few minutes. Your words are still here." });
      } else {
        update(k, { sending: false, error: e2?.fields.body ?? e2?.message ?? "Your letter didn’t send. Check your connection and try again. Your words are still here." });
      }
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
    update("santa", { error: null });
    try {
      const fresh = await apiFetch<ThreadDTO>(`${url}/mute`, { body: { muted } });
      update("santa", { thread: fresh, notice: muted ? null : "Your Santa can write to you again." });
    } catch (err) {
      update("santa", { error: err instanceof ApiRequestError ? err.message : "That didn’t work. Please try again." });
    } finally {
      setMuting(false);
    }
  }

  async function report() {
    if (!reporting) return;
    setReportBusy(true);
    try {
      await apiFetch(`${url}/${reporting.id}/report`, { method: "POST", body: {} });
      setReporting(null);
      update("santa", { notice: "Thanks for telling us. The letter is flagged." });
      await refresh("santa");
    } catch (err) {
      setReporting(null);
      update("santa", { error: err instanceof ApiRequestError ? err.message : "That didn’t work. Please try again." });
    } finally {
      setReportBusy(false);
    }
  }

  const recipient = desks.recipient?.thread;
  const santa = desks.santa?.thread;
  const slots: { k: Thread; title: string; sub: string; letters: number }[] = [
    {
      k: "recipient",
      title: recipient ? `To ${recipient.counterpartLabel}` : "To your person",
      sub: myAlias ? `You sign as ${myAlias}` : "Signed with your alias",
      letters: recipient?.messages.length ?? 0,
    },
    { k: "santa", title: "From your Santa", sub: santa ? `Signed ${santa.santaAlias}` : "Your Santa’s alias", letters: santa?.messages.length ?? 0 },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      {/* ───────── The slot cabinet ───────── */}
      <nav aria-label="Mail slots" className="rounded-2xl border-[2.5px] border-midnight bg-timber p-2.5 lg:sticky lg:top-6">
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
          {slots.map((s) => {
            const active = s.k === current;
            return (
              <li key={s.k}>
                <Link
                  href={`/p/${participantId}/messages?thread=${s.k}`}
                  replace
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-28 flex-col justify-end rounded-lg border-[2.5px] border-midnight bg-evergreen-deep p-2.5 transition-transform duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 sm:min-h-32",
                    active && "ring-4 ring-golden",
                  )}
                >
                  <SlotLetters count={active ? Math.max(2, s.letters) : s.letters} />
                  <span className="relative rounded-md border-2 border-midnight bg-golden px-2.5 py-1.5 text-midnight">
                    <span className="block font-display text-[1.0625rem] leading-tight font-extrabold break-words">{s.title}</span>
                    <span className="block text-sm font-bold">{s.sub}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div aria-hidden className="mt-2.5 hidden grid-cols-3 gap-2.5 lg:grid">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-12 rounded-md border-[2.5px] border-midnight bg-evergreen-deep" />
          ))}
        </div>
      </nav>

      {/* ───────── The counter: the active conversation ───────── */}
      <section aria-labelledby="thread-title" className="village-paper overflow-hidden">
        {!desk ? (
          <div className="px-5 py-6 sm:px-7">
            <h2 id="thread-title" className="sr-only">
              {current === "recipient" ? "Letters with your person" : "Letters with your Santa"}
            </h2>
            {emptyState}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b-2 border-dashed border-snow-shadow px-5 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:px-7">
              <div className="min-w-0">
                {current === "recipient" ? (
                  <>
                    <h2 id="thread-title" className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] break-words">
                      <span className="sr-only">Conversation with </span>
                      <span className="font-hand text-[1.75rem] text-cranberry">{desk.thread.counterpartLabel}</span>
                    </h2>
                    <p className="mt-1 text-midnight-soft">
                      You appear as <span className="font-hand text-lg font-bold text-evergreen">{desk.thread.santaAlias}</span>. Your recipient
                      sees your alias, and in a small group they might still guess.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 id="thread-title" className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em]">
                      <span className="font-hand text-[1.75rem] text-evergreen">{desk.thread.santaAlias}</span> — Your Secret Santa
                    </h2>
                    <p className="mt-1 text-midnight-soft">The Santa who drew you sees your name. You only see their alias.</p>
                  </>
                )}
              </div>
              {current === "santa" && !readOnly && (
                <Button size="sm" variant="secondary" onClick={() => setMuted(!desk.thread.muted)} loading={muting} className="shrink-0 self-start">
                  {desk.thread.muted ? <Bell aria-hidden /> : <BellOff aria-hidden />}
                  {desk.thread.muted ? "Unmute your Santa" : "Mute your Santa"}
                </Button>
              )}
            </div>

            {current === "santa" && desk.thread.muted && (
              <Alert tone="info" className="mx-5 mt-4 sm:mx-7" title="Letters from your Santa are paused">
                They can’t write to you until you unmute. You can still write to them.
              </Alert>
            )}

            <ol className="flex flex-col gap-3 px-5 py-5 sm:px-7" aria-label="Letters, oldest first">
              {desk.thread.messages.length === 0 && (
                <li className="rounded-xl bg-cream-100 px-4 py-8 text-center text-midnight-soft">
                  {current === "recipient"
                    ? `No letters yet. Ask ${desk.thread.counterpartLabel} about sizes, colours or anything on their list.`
                    : "No letters from your Santa yet. You can write first: a thank-you, or a hint."}
                </li>
              )}
              {desk.thread.messages.map((m) => (
                <li key={m.id} className={cn("flex max-w-[88%] flex-col gap-1 sm:max-w-[75%]", m.fromMe ? "items-end self-end" : "items-start self-start")}>
                  <span className="sr-only">
                    {m.fromMe ? "You said:" : current === "recipient" ? `${desk.thread.counterpartLabel} said:` : `${desk.thread.santaAlias} said:`}
                  </span>
                  <p
                    className={cn(
                      "relative rounded-xl border-2 border-midnight px-4 py-2.5 whitespace-pre-wrap [overflow-wrap:anywhere]",
                      m.fromMe ? "rounded-br-sm bg-cream-200" : "rounded-bl-sm bg-sky",
                    )}
                  >
                    {m.body}
                    {desk.stamped.includes(m.id) && (
                      <Postmark className="absolute -top-4 -right-3 size-11 motion-safe:animate-[stamp-in_260ms_var(--ease-out-expo)_both]" />
                    )}
                  </p>
                  <span className="flex items-center gap-2 px-1 text-xs text-ink-500">
                    <time dateTime={m.createdAt}>{formatInZone(m.createdAt, timezone, { weekday: undefined, timeZoneName: undefined })}</time>
                    {current === "santa" && !m.fromMe && !readOnly && (
                      <button
                        type="button"
                        onClick={() => setReporting(m)}
                        className="-my-3 inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-bold text-midnight-soft underline-offset-2 hover:text-cranberry-deep hover:underline"
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
              <Alert tone="info" title="This exchange has wrapped up" className="mx-5 mb-5 sm:mx-7">
                Letters are read-only now. Thanks for being a Secret Santa!
              </Alert>
            ) : current === "recipient" && desk.thread.muted ? (
              <Alert tone="info" title="Your giftee has paused messages." className="mx-5 mb-5 sm:mx-7">
                You can’t send letters right now. Their wishlist is still in your envelope.
              </Alert>
            ) : (
              <form key={current} onSubmit={send} className="border-t-2 border-dashed border-snow-shadow bg-snow px-5 py-5 sm:px-7">
                <label htmlFor="message-body" className="block text-[0.9375rem] font-bold">
                  {current === "recipient" ? `Message to ${desk.thread.counterpartLabel}` : `Message to ${desk.thread.santaAlias}, your Secret Santa`}
                </label>
                <textarea
                  id="message-body"
                  value={desk.draft}
                  onChange={(e) => update(current, { draft: e.target.value })}
                  onKeyDown={onKeyDown}
                  maxLength={MESSAGE_MAX_LENGTH}
                  rows={3}
                  aria-describedby={cn("message-hint", desk.error && "message-error")}
                  aria-invalid={desk.error ? true : undefined}
                  className="mt-1.5 block max-h-60 min-h-24 w-full resize-y rounded-xl border-2 border-midnight bg-white px-3.5 py-3 text-base leading-relaxed [field-sizing:content]"
                />
                <p id="message-hint" className="mt-1.5 flex justify-between gap-3 text-xs text-ink-500">
                  <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline">Enter to send, Shift+Enter for a new line</span>
                  <span className={cn("ml-auto tabular-nums", MESSAGE_MAX_LENGTH - desk.draft.length < 100 && "font-bold text-cranberry-deep")}>
                    {desk.draft.length}/{MESSAGE_MAX_LENGTH}
                  </span>
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" variant="festive" loading={desk.sending} disabled={!desk.draft.trim()} className="w-full sm:w-auto">
                    {!desk.sending && <Send aria-hidden />} {desk.sending ? "Sending…" : "Send letter"}
                  </Button>
                  <p role="status" aria-live="polite" className="text-[0.9375rem] font-bold text-evergreen">
                    {desk.notice}
                  </p>
                </div>
                {desk.error && (
                  <p id="message-error" role="alert" className="mt-3 rounded-xl border-2 border-cranberry-deep bg-berry-100 px-4 py-3 text-[0.9375rem] font-bold text-cranberry-deep">
                    {desk.error}
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </section>

      <Dialog
        open={reporting !== null}
        onOpenChange={(o) => !o && setReporting(null)}
        title="Report this letter?"
        description="We flag the letter and pause letters from your Santa, so they can’t write to you until you unmute."
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
        {reporting && <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm whitespace-pre-wrap text-midnight-soft [overflow-wrap:anywhere]">{reporting.body}</p>}
      </Dialog>
    </div>
  );
}
