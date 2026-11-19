import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. Progress through a multi-step flow (create group, join, set up profile).
 * Numbered tokens joined by a line; the current step is wine, finished steps teal.
 * `current` is 0-based. Labels collapse to "Step n of m: label" on phones.
 */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <nav aria-label="Progress" className={className}>
      <p className="text-sm font-bold text-oxblood sm:sr-only">
        Step {Math.min(current + 1, steps.length)} of {steps.length}: <span className="font-normal text-ink-700">{steps[current]}</span>
      </p>
      <ol className="relative mt-2 flex items-center gap-0 sm:mt-0">
        {steps.map((label, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={state === "current" ? "step" : undefined}>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
                    state === "done" && "border-teal bg-teal text-buttercream",
                    state === "current" && "border-oxblood bg-oxblood text-buttercream",
                    state === "todo" && "border-paper-line bg-cream-50 text-ink-500",
                  )}
                >
                  {state === "done" ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm leading-tight sm:inline",
                    state === "current" ? "font-bold text-oxblood" : "text-ink-500",
                  )}
                >
                  {label}
                  {state === "done" && <span className="sr-only"> (done)</span>}
                </span>
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden className={cn("mx-2 h-0.5 min-w-4 flex-1 rounded-full sm:mx-3", i < current ? "bg-teal" : "bg-paper-line")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
