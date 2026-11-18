import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import { artA11y, lineProps, type ArtProps } from "./motifs";

/** The mark: a floppy elf hat with a gold bell. Works from 20px up. */
export function ElfHatMark({ title, className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} {...artA11y(title)} {...props}>
      <path d="M7 31C8 20 14 10 25 6c4-1.4 8-1 9.5 1.6-4 .9-7 3.6-7.6 7.4-.6 4.6.4 10.6 1.6 16z" fill="#2a7253" {...lineProps} />
      <path d="M5 29.5c9-2.8 17-2.8 25.6 0V35c-8.6-2.6-16.6-2.6-25.6 0z" fill="#a8383a" {...lineProps} />
      <circle cx="34.6" cy="9.4" r="3.2" fill="#ddb65a" {...lineProps} />
    </svg>
  );
}

/**
 * Wordmark. `tone="light"` for pine grounds, `tone="dark"` for cream grounds.
 * Pass `href` to make it a home link (default "/"); `href={null}` renders plain.
 */
export function Logo({
  tone = "dark",
  href = "/",
  className,
}: {
  tone?: "light" | "dark";
  href?: string | null;
  className?: string;
}) {
  const content = (
    <>
      <ElfHatMark className="size-9 shrink-0" />
      <span
        className={cn(
          "font-display text-[1.375rem] leading-none font-extrabold tracking-[-0.02em]",
          tone === "light" ? "text-cream-50" : "text-pine-900",
        )}
      >
        Santa<span className={tone === "light" ? "text-gold-400" : "text-berry-600"}>Elf</span>
      </span>
    </>
  );
  const cls = cn("inline-flex min-h-11 items-center gap-2 rounded-lg", className);
  if (href === null) return <span className={cls}>{content}</span>;
  return (
    <Link href={href} className={cls} aria-label="SantaElf home">
      {content}
    </Link>
  );
}
