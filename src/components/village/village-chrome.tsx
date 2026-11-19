import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import { C, line } from "./art";

/** Button looks for the village. One cranberry action per area; evergreen for secondary actions. */
export const villageButton = {
  base: "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-[2.5px] border-midnight px-5 font-bold whitespace-nowrap transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 active:translate-y-0 [&_svg]:size-[1.1em]",
  primary: "bg-cranberry text-paper shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-cranberry-deep active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
  secondary: "bg-paper text-evergreen shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-snow active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
  evergreen: "bg-evergreen text-paper shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-evergreen-deep active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
  quiet: "border-transparent bg-transparent px-3 text-evergreen underline decoration-2 underline-offset-4 hover:bg-paper hover:translate-y-0",
  danger: "bg-paper text-cranberry-deep border-cranberry-deep hover:bg-[#FBE7EA]",
  lg: "min-h-14 px-7 text-lg",
  sm: "min-h-11 px-4 text-sm",
};

/** The mark, redrawn in the village palette: an elf hat with a brass bell. */
export function VillageMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden focusable="false">
      <path d="M7 31C8 20 14 10 25 6c4-1.4 8-1 9.5 1.6-4 .9-7 3.6-7.6 7.4-.6 4.6.4 10.6 1.6 16z" fill={C.evergreen} {...line} strokeWidth={2} />
      <path d="M5 29.5c9-2.8 17-2.8 25.6 0V35c-8.6-2.6-16.6-2.6-25.6 0z" fill={C.cranberry} {...line} strokeWidth={2} />
      <circle cx="34.6" cy="9.4" r="3.4" fill={C.golden} {...line} strokeWidth={2} />
    </svg>
  );
}

export function VillageLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="SantaElf home" className="inline-flex min-h-11 items-center gap-2 rounded-lg">
      <VillageMark />
      <span className="font-display text-[1.375rem] leading-none font-extrabold tracking-[-0.02em] text-midnight">
        Santa<span className="text-cranberry">Elf</span>
      </span>
    </Link>
  );
}

/** Village footer: the same facts as before, on fresh snow. */
export function VillageFooter() {
  return (
    <footer className="mt-auto border-t-[2.5px] border-midnight bg-evergreen text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-prose">SantaElf is free and needs no account. Groups are deleted automatically 60 days after the exchange.</p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                Village Square
              </Link>
            </li>
            <li>
              <Link href="/recover" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                Recover my link
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
