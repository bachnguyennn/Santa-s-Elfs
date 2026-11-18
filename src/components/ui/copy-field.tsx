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

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      inputRef.current?.select();
    }
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
      <div className="flex rounded-xl border border-line-strong bg-white shadow-[inset_0_1px_2px_rgb(11_42_30/0.06)] focus-within:border-pine-700">
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
            copied ? "bg-pine-100 text-pine-900" : "bg-pine-800 text-cream-50 hover:bg-pine-900",
          )}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> {label}</span>
        </button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${label} copied to clipboard` : ""}
      </span>
    </div>
  );
}
