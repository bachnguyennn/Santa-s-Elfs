import * as React from "react";
import { Holly, Sparkle, Star } from "@/components/brand/motifs";
import { cn } from "@/lib/utils";

/** Size shared by every card in the deck, the flip card and the result card. */
export const CARD_SIZE = "w-[min(15rem,62vw)] aspect-[5/7]";

/**
 * The back of a Christmas card: berry with a cream double border and a gold star.
 * Carries no text at all, so nothing can leak while the deck shuffles.
 */
export function CardBack({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn("rounded-[10px] bg-berry-600 p-[7%] shadow-[0_2px_2px_rgb(11_42_30/0.25),0_14px_28px_-12px_rgb(0_0_0/0.55)]", className)}
    >
      <div className="relative grid size-full place-items-center rounded-md border-[3px] border-double border-cream-50/55">
        <span className="grid aspect-square w-[46%] place-items-center rounded-full bg-berry-700 ring-2 ring-gold-400/70">
          <Star className="size-[58%] text-gold-400" />
        </span>
        <Sparkle className="absolute top-[7%] left-[9%] size-[11%] text-gold-400/80" />
        <Sparkle className="absolute right-[9%] bottom-[7%] size-[11%] text-gold-400/80" />
        <Sparkle className="absolute top-[7%] right-[9%] size-[7%] text-cream-50/50" />
        <Sparkle className="absolute bottom-[7%] left-[9%] size-[7%] text-cream-50/50" />
      </div>
    </div>
  );
}

/** The face of the card: only ever rendered once the server has answered. */
export function CardFront({
  recipientName,
  alias,
  className,
  style,
  headingRef,
}: {
  recipientName: string;
  alias: string;
  className?: string;
  style?: React.CSSProperties;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div
      style={style}
      className={cn("rounded-[10px] bg-cream-50 p-[6%] text-center text-ink-900 shadow-[0_2px_2px_rgb(11_42_30/0.2),0_18px_36px_-12px_rgb(0_0_0/0.5)]", className)}
    >
      <div className="flex size-full flex-col items-center justify-center rounded-md border-[3px] border-double border-pine-700/40 px-[6%]">
        <Holly className="h-9" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-2 outline-none">
          <span className="block text-[0.9375rem] leading-snug text-ink-700">You’re the Secret Santa for</span>
          <span className="mt-1 block font-hand text-[clamp(2rem,11vw,2.75rem)] leading-[1.05] font-bold break-words text-berry-700 [overflow-wrap:anywhere]">
            {recipientName}
          </span>
        </h2>
        <p className="mt-4 text-sm text-ink-500">
          Signed, <span className="font-hand text-base font-bold text-pine-800">{alias}</span>
        </p>
      </div>
    </div>
  );
}
