import * as React from "react";
import { cn } from "@/lib/utils";
import { artA11y, lineProps, type ArtProps } from "./motifs";

const TONES = {
  pine: { box: "#1c5c40", lid: "#2a7253", ribbon: "#a8383a" },
  berry: { box: "#a8383a", lid: "#c24e4c", ribbon: "#ddb65a" },
  cream: { box: "#f8f0df", lid: "#fdf9f0", ribbon: "#1c5c40" },
} as const;

/** A wrapped gift with a bow. tone: pine | berry | cream. */
export function GiftBox({ tone = "pine", title, className, ...props }: ArtProps & { tone?: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <svg viewBox="0 0 120 120" className={cn("size-16", className)} {...artA11y(title)} {...props}>
      <path d="M60 40c-8-14-24-22-28-12-3 8 12 12 28 12zM60 40c8-14 24-22 28-12 3 8-12 12-28 12z" fill={t.ribbon} {...lineProps} />
      <rect x="18" y="54" width="84" height="56" rx="4" fill={t.box} {...lineProps} />
      <rect x="12" y="40" width="96" height="18" rx="4" fill={t.lid} {...lineProps} />
      <path d="M54 40h12v70H54z" fill={t.ribbon} {...lineProps} />
      <circle cx="60" cy="40" r="5" fill={t.ribbon} {...lineProps} />
    </svg>
  );
}
