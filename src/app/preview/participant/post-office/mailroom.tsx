"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { C, line } from "@/components/village/art";
import { villageButton as vb } from "@/components/village/village-chrome";
import { cn } from "@/lib/utils";

type Msg = { id: string; fromMe: boolean; body: string; when: string; fresh?: boolean };
type ThreadKey = "recipient" | "santa";

/* Fictional threads. Priya is Santa "Dasher" for Tomás; her own Santa signs as "Sugarplum". */
const THREADS: Record<ThreadKey, { slot: string; sub: string; them: string; me: string; messages: Msg[] }> = {
  recipient: {
    slot: "To Tomás",
    sub: "You sign as Dasher",
    them: "Tomás",
    me: "You, as Dasher",
    messages: [
      { id: "r1", fromMe: true, body: "Hi Tomás! Quick question: tea or coffee in that camping mug?", when: "Sat 2:14 pm" },
      { id: "r2", fromMe: false, body: "Coffee, always. Strong enough to wake up the whole tent.", when: "Sat 6:40 pm" },
    ],
  },
  santa: {
    slot: "From your Santa",
    sub: "Signed Sugarplum",
    them: "Sugarplum, your Secret Santa",
    me: "You",
    messages: [
      { id: "s1", fromMe: false, body: "Hello from your Secret Santa! Is there a book you’ve been meaning to read?", when: "Fri 8:02 pm" },
      { id: "s2", fromMe: true, body: "Anything by Ann Patchett. Thank you, Sugarplum!", when: "Fri 9:15 pm" },
    ],
  },
};

/** A postmark the elf stamps onto a letter that was just sent. */
function Postmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <circle cx={32} cy={32} r={26} fill="none" stroke={C.cranberry} strokeWidth={3} />
      <circle cx={32} cy={32} r={19} fill="none" stroke={C.cranberry} strokeWidth={1.5} />
      <path d="M32 20l3.4 7.4 8 .8-6 5.4 1.8 7.9L32 37.4l-7.2 4.1 1.8-7.9-6-5.4 8-.8z" fill={C.cranberry} />
    </svg>
  );
}

/** One mail slot in the cabinet. A real link (replace: no history entry), marked when current. */
function Slot({ k, active, sealed }: { k: ThreadKey; active: boolean; sealed: boolean }) {
  const t = THREADS[k];
  const label = k === "recipient" && sealed ? "To your person" : t.slot;
  return (
    <Link
      href={`?thread=${k}${sealed ? "&sealed=1" : ""}`}
      replace
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex min-h-28 flex-col justify-end rounded-lg border-[2.5px] border-midnight bg-evergreen-deep p-2.5 transition-[transform] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 sm:min-h-32",
        active && "ring-4 ring-golden",
      )}
    >
      {/* letters sticking out of the slot */}
      <span aria-hidden className="absolute inset-x-3 top-2 flex justify-center gap-1">
        {(active ? [0, 1, 2] : [0]).map((i) => (
          <svg key={i} viewBox="0 0 40 26" className={cn("h-7 w-auto sm:h-8", i === 1 && "-translate-y-1 rotate-3", i === 2 && "-rotate-6")}>
            <rect x={1.5} y={1.5} width={37} height={23} rx={2} fill={i ? C.paper : C.snow} {...line} strokeWidth={2} />
            <path d="M1.5 1.5l18.5 12 18.5-12" fill="none" {...line} strokeWidth={1.5} />
          </svg>
        ))}
      </span>
      {/* brass label plate */}
      <span className="relative rounded-md border-2 border-midnight bg-golden px-2.5 py-1.5 text-midnight">
        <span className="block font-display text-[1.0625rem] leading-tight font-extrabold">{label}</span>
        <span className="block text-sm font-bold">{t.sub}</span>
      </span>
    </Link>
  );
}

/** Everything a conversation keeps for itself: its letters, its draft and its send feedback. */
type Desk = { messages: Msg[]; draft: string; busy: boolean; error: string | null; status: string };
const desk = (messages: Msg[]): Desk => ({ messages, draft: "", busy: false, error: null, status: "" });

export function Mailroom({ thread, fail, sealed = false }: { thread: ThreadKey; fail: boolean; sealed?: boolean }) {
  // One desk per mail slot. Switching slots keeps this component mounted, so nothing may be shared.
  const [desks, setDesks] = React.useState<Record<ThreadKey, Desk>>(() => ({
    // Before the envelope is opened there can't be letters to a named recipient yet.
    recipient: desk(sealed ? [] : THREADS.recipient.messages),
    santa: desk(THREADS.santa.messages),
  }));
  const update = (k: ThreadKey, patch: Partial<Desk> | ((d: Desk) => Partial<Desk>)) =>
    setDesks((all) => ({ ...all, [k]: { ...all[k], ...(typeof patch === "function" ? patch(all[k]) : patch) } }));

  const t = THREADS[thread];
  const them = thread === "recipient" && sealed ? "Your person" : t.them;
  const { messages, draft, busy, error, status } = desks[thread];

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const k = thread; // the slot this letter belongs to, even if the visitor switches mid-send
    const body = desks[k].draft.trim();
    if (!body) {
      update(k, { error: "Write a few words before sending." });
      return;
    }
    update(k, { busy: true, error: null, status: "" });
    await new Promise((r) => window.setTimeout(r, 1200));
    if (fail) {
      // Keep what they typed; explain beside the action.
      update(k, { busy: false, error: "Your letter didn’t send. Check your connection and try again. Your words are still here." });
      return;
    }
    update(k, (d) => ({
      busy: false,
      messages: [...d.messages, { id: `n${Date.now()}`, fromMe: true, body, when: "Just now", fresh: true }],
      // Only clear the draft if it's still the letter that was sent.
      draft: d.draft.trim() === body ? "" : d.draft,
      status: k === "recipient" ? (sealed ? "Sent, signed with your alias." : "Sent. Tomás will see it from Dasher.") : "Sent to your Santa.",
    }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      {/* ───────── The slot cabinet ───────── */}
      <nav aria-label="Mail slots" className="rounded-2xl border-[2.5px] border-midnight bg-timber p-2.5 lg:sticky lg:top-6">
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
          <li>
            <Slot k="recipient" active={thread === "recipient"} sealed={sealed} />
          </li>
          <li>
            <Slot k="santa" active={thread === "santa"} sealed={sealed} />
          </li>
        </ul>
        {/* empty pigeonholes, for the room */}
        <div aria-hidden className="mt-2.5 hidden grid-cols-3 gap-2.5 lg:grid">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-12 rounded-md border-[2.5px] border-midnight bg-evergreen-deep" />
          ))}
        </div>
      </nav>

      {/* ───────── The counter: the active thread ───────── */}
      <section aria-labelledby="thread-title" className="village-paper overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-dashed border-snow-shadow px-5 pt-5 pb-4 sm:px-7">
          <h2 id="thread-title" className="font-display text-2xl font-extrabold tracking-[-0.02em]">
            {thread === "recipient" ? (sealed ? "Letters with your person" : "Letters with Tomás") : "Letters with your Santa"}
          </h2>
          {thread === "santa" && (
            <button type="button" aria-pressed="false" className={cn(vb.base, vb.quiet, vb.sm)}>
              Pause letters from your Santa
            </button>
          )}
        </div>

        {messages.length === 0 && (
          <p className="px-5 py-6 text-midnight-soft sm:px-7">No letters yet. Whatever you write is signed with your alias.</p>
        )}
        <ol aria-label="Letters, oldest first" className="space-y-3 px-5 py-5 empty:hidden sm:px-7">
          {messages.map((m) => (
            <li key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
              <article
                className={cn(
                  "relative max-w-[88%] rounded-xl border-2 border-midnight px-4 py-3",
                  m.fromMe ? "rounded-br-sm bg-paper-deep" : "rounded-bl-sm bg-sky",
                )}
              >
                <p className={cn("text-xs font-bold", m.fromMe ? "text-evergreen" : "text-cranberry-deep")}>
                  {m.fromMe ? t.me : them} · <span className="font-normal text-midnight-soft">{m.when}</span>
                </p>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap">{m.body}</p>
                {m.fresh && <Postmark className="absolute -top-4 -right-3 size-11 motion-safe:animate-[stamp-in_260ms_var(--ease-out-expo)_both]" />}
              </article>
            </li>
          ))}
        </ol>

        <form key={thread} onSubmit={send} className="border-t-2 border-dashed border-snow-shadow bg-snow px-5 py-5 sm:px-7">
          <label htmlFor="letter" className="block text-[0.9375rem] font-bold">
            {thread === "recipient" ? (sealed ? "Write to your person" : "Write to Tomás") : "Write to your Santa"}
          </label>
          <textarea
            id="letter"
            value={draft}
            onChange={(e) => update(thread, { draft: e.target.value })}
            rows={3}
            maxLength={1000}
            aria-describedby={cn("letter-hint", error && "letter-error")}
            aria-invalid={!!error || undefined}
            className="mt-1.5 block w-full resize-y rounded-xl border-2 border-midnight bg-white px-3.5 py-3 text-base leading-relaxed"
          />
          <p id="letter-hint" className="mt-1.5 text-sm text-midnight-soft">
            {thread === "recipient"
              ? "Your recipient sees your alias, Dasher. In a small group, they may still guess from your writing."
              : "The Santa who drew you sees your name."}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={busy} aria-busy={busy || undefined} className={cn(vb.base, vb.primary, "w-full disabled:opacity-60 sm:w-auto")}>
              <Send aria-hidden /> {busy ? "Sending…" : "Send letter"}
            </button>
            <p role="status" aria-live="polite" className="text-[0.9375rem] font-bold text-evergreen">
              {status}
            </p>
          </div>
          {error && (
            <p id="letter-error" role="alert" className="mt-3 rounded-xl border-2 border-cranberry-deep bg-[#FBE7EA] px-4 py-3 text-[0.9375rem] font-bold text-cranberry-deep">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
