"use client";

import { ExternalLink, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Envelope, type EnvelopeLetter } from "@/components/village/envelope";
import { villageButton as vb } from "@/components/village/village-chrome";
import { cn } from "@/lib/utils";

/* Fictional recipient for the preview. */
const LETTER: EnvelopeLetter = { recipientName: "Tomás Ortega", alias: "Dasher" };
const WISHLIST = [
  { name: "Green enamel camping mug", note: "The kind that survives a campfire.", url: "https://example.com/mug" },
  { name: "Wool hiking socks", note: "Size 10–12, any colour but beige.", url: null },
  { name: "A paperback from a local bookshop", note: "Mysteries or anything about mountains.", url: null },
];
const INTERESTS = ["Hiking", "Crosswords", "Hot sauce", "Old maps"];

/** Preview-only wrapper: fakes the reveal request so the motion, slow and failure paths can be tried. */
export function EnvelopeDemo({ opened, delay, fail }: { opened: boolean; delay: number; fail: boolean }) {
  return (
    <Envelope
      participantName="Priya"
      initial={opened ? LETTER : null}
      requestLetter={() =>
        new Promise((resolve, reject) => window.setTimeout(() => (fail ? reject(new Error("offline")) : resolve(LETTER)), delay))
      }
      errorMessage={() => "We couldn’t reach the elves. Check your connection, then press the seal again."}
    >
      {(letter) => (
        <div className="mx-auto mt-10 max-w-xl">
          <section aria-labelledby="wish-title" className="village-paper p-5 sm:p-7">
            <h2 id="wish-title" className="font-display text-2xl font-extrabold tracking-[-0.02em]">
              What {letter.recipientName.split(" ")[0]} would like
            </h2>
            <p className="mt-1 text-[0.9375rem] text-midnight-soft">From their Gift House list. They can’t see that you’re reading it.</p>
            <ul className="mt-4 divide-y-2 divide-dashed divide-snow-shadow border-y-2 border-dashed border-snow-shadow">
              {WISHLIST.map((w) => (
                <li key={w.name} className="py-3">
                  <p className="font-bold">
                    {w.url ? (
                      <a href={w.url} className="inline-flex items-center gap-1.5 text-evergreen underline decoration-2 underline-offset-4">
                        {w.name} <ExternalLink className="size-4" aria-hidden />
                        <span className="sr-only">(opens the shop’s page)</span>
                      </a>
                    ) : (
                      w.name
                    )}
                  </p>
                  <p className="text-[0.9375rem] text-midnight-soft">{w.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.9375rem] font-bold">Likes</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <li key={i} className="rounded-full border-2 border-midnight bg-sky px-3 py-1 text-sm font-bold">
                  {i}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.9375rem]">
              <span className="font-bold">Please skip:</span> scented candles.
            </p>
          </section>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="#" className={cn(vb.base, vb.evergreen, "w-full sm:w-auto")}>
              <MessageCircle aria-hidden /> Ask {letter.recipientName.split(" ")[0]} a question
            </Link>
            <Link href="#" className="inline-flex min-h-11 items-center justify-center px-2 font-bold text-evergreen underline decoration-2 underline-offset-4">
              Back to your village
            </Link>
          </div>
        </div>
      )}
    </Envelope>
  );
}
