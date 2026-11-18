"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Free-form tags: type and press Enter or comma to add; Backspace on an empty field removes the last.
 * Duplicates (case-insensitive) are ignored. `max` caps the count; each tag is trimmed to `maxLength`.
 */
export function TagInput({
  id,
  value,
  onChange,
  max = 20,
  maxLength = 40,
  placeholder,
  disabled,
  describedBy,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = React.useState("");
  const [announce, setAnnounce] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const full = value.length >= max;

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((t) => t.trim().slice(0, maxLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    if (next.length !== value.length) {
      onChange(next);
      setAnnounce(`Added ${next.slice(value.length).join(", ")}`);
    }
    setDraft("");
  }

  function remove(i: number) {
    const tag = value[i];
    onChange(value.filter((_, j) => j !== i));
    setAnnounce(`Removed ${tag}`);
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn(
        "flex min-h-12 flex-wrap items-center gap-2 rounded-xl border bg-white px-2 py-2 shadow-[inset_0_1px_2px_rgb(11_42_30/0.06)] focus-within:border-pine-700 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-gold-600",
        invalid ? "border-berry-600" : "border-line-strong",
        disabled && "bg-cream-100",
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <ul className="contents" aria-label="Your interests">
        {value.map((tag, i) => (
          <li key={tag} className="inline-flex items-center rounded-full bg-pine-100 py-1 pr-1 pl-3 text-sm font-bold text-pine-900">
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                className="-my-2 -mr-1.5 ml-0 grid size-11 place-items-center rounded-full text-pine-800 hover:bg-pine-200"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <input
          ref={inputRef}
          id={id}
          value={draft}
          disabled={full}
          maxLength={maxLength * 3}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          placeholder={full ? `That’s ${max}, the most you can add` : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value.length - 1);
            }
          }}
          onBlur={() => add(draft)}
          className="min-h-9 min-w-[10rem] flex-1 bg-transparent px-2 text-base text-ink-900 placeholder:text-ink-500 focus-visible:outline-none"
        />
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
    </div>
  );
}
