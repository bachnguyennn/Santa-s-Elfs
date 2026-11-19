"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. A read-only value (invite link, code) with a Copy button.
 * Falls back to selecting the text when the Clipboard API is unavailable.
 * Announces "Copied" politely. Pass `label` (visible) — it names both the field and the button.
 */
export function CopyField({
  value,
  label,
  hint,
  id: idProp,
  className,
}: {
  value: string;
  label: string;
  hint?: string;
  id?: string;
  className?: string;
}) {
  const autoId = React.useId();
  const id = idProp ?? autoId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const letterRef = React.useRef<SVGGElement>(null);
  const flagRef = React.useRef<SVGPathElement>(null);
  const trayRef = React.useRef<SVGSVGElement>(null);

  const resetTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setFailed(false);
      setCopied(true); // confirmed immediately; the little envelope is only decoration
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2400);
      post();
    } catch {
      // Keep the link selectable and say how to copy it by hand.
      setCopied(false);
      setFailed(true);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  /** SPEC: fold the miniature envelope (220 ms), slide it into the tray (200 ms), lift the flag (120 ms). */
  function post() {
    trayRef.current?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    letterRef.current?.animate(
      [
        { transform: "translate(0,0) scaleY(1)", opacity: 1, easing: ease },
        { transform: "translate(0,0) scaleY(0.55)", opacity: 1, offset: 0.52, easing: ease },
        { transform: "translate(14px,6px) scaleY(0.55)", opacity: 0 },
      ],
      { duration: 420, easing: "linear" },
    );
    // Flag up over 120 ms, held, then back down.
    flagRef.current?.animate(
      [
        { transform: "rotate(0deg)", easing: ease },
        { transform: "rotate(-80deg)", offset: 0.07 },
        { transform: "rotate(-80deg)", offset: 0.85, easing: ease },
        { transform: "rotate(0deg)" },
      ],
      { duration: 1800, delay: 420, easing: "linear" },
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[0.9375rem] font-bold text-ink-900">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      )}
      <div className="flex rounded-md border border-line-strong bg-[#fffdf5]">
        <input
          ref={inputRef}
          id={id}
          readOnly
          value={value}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-12 min-w-0 flex-1 rounded-l-xl bg-transparent px-4 font-mono text-sm text-ink-900 focus-visible:outline-offset-[-3px]"
        />
        <button
          type="button"
          onClick={copy}
          className={cn(
            "m-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-bold transition-colors",
            copied ? "bg-teal-wash text-teal-deep" : "bg-oxblood text-buttercream hover:bg-oxblood-soft",
          )}
        >
          {copied ? <Check className="hidden size-4 motion-reduce:block" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          <svg ref={trayRef} viewBox="0 0 34 18" className={cn("h-4 w-8 overflow-visible", copied ? "motion-reduce:hidden" : "hidden")} aria-hidden focusable="false">
            {/* tray, mailbox flag, and the miniature envelope that folds into the tray */}
            <path d="M17 16v-6a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v6z" fill="#145851" stroke="#60371e" />
            <path d="M18 10h8" stroke="#fff0cc" strokeWidth="1.5" strokeLinecap="round" />
            <path ref={flagRef} d="M31 14V5h-4" fill="none" stroke="#eebc65" strokeWidth="2" strokeLinecap="round" style={{ transformOrigin: "31px 14px" }} />
            <g ref={letterRef} style={{ transformOrigin: "8px 9px" }} opacity="0">
              <rect x="1" y="3" width="14" height="10" rx="1" fill="#fff0cc" />
              <path d="M1 3l7 5 7-5" fill="none" stroke="#c89a6b" strokeWidth="1.2" />
            </g>
          </svg>
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> {label}</span>
        </button>
      </div>
      {failed && (
        <p role="status" className="text-sm font-bold text-cherry">
          Copying didn’t work here. The link is selected: press Ctrl+C (or ⌘C), or long-press to copy it.
        </p>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${label} copied to clipboard` : ""}
      </span>
    </div>
  );
}
