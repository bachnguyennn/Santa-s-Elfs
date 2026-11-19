import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * OWNER: design agent. Props API is the contract: variant, size, asChild, loading.
 * variant:
 *  - primary   wine pill on cream: actions inside rooms (Approve, Save, Next)
 *  - festive   the same wine pill, used for the one main action of an area (Draw names, Send letter)
 *  - secondary cream pill with a paper-line border
 *  - ghost     teal text link: secondary actions
 *  - danger    cherry outline; destructive, always confirmed in an AlertDialog, kept apart from other actions
 *  - light     buttercream pill on oxblood: actions outside (Start a group)
 * Touch targets: every size is at least 44px tall.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex min-h-12 items-center justify-center gap-2 rounded-full font-sans font-bold whitespace-nowrap select-none",
    "transition-[background-color,box-shadow,transform,color] duration-200 ease-[var(--ease-workshop)]",
    "hover:-translate-y-px active:translate-y-0 active:duration-75",
    "disabled:pointer-events-none aria-busy:cursor-progress",
    // Disabled (not loading): a quiet cream state from the palette, never a faded wine.
    "[&:disabled:not([aria-busy=true])]:border-paper-line [&:disabled:not([aria-busy=true])]:bg-cream-200 [&:disabled:not([aria-busy=true])]:text-ink-500 [&:disabled:not([aria-busy=true])]:shadow-none",
    "aria-busy:opacity-80",
    "[&_svg]:size-[1.1em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Inside rooms: wine on cream. Lamplit contact shadow, pressed flat.
        primary:
          "bg-oxblood text-buttercream shadow-[0_2px_0_var(--color-oxblood-deep),0_8px_16px_-10px_rgb(48_28_34/0.6)] hover:bg-oxblood-soft active:shadow-none",
        festive:
          "bg-oxblood text-buttercream shadow-[0_2px_0_var(--color-oxblood-deep),0_8px_16px_-10px_rgb(48_28_34/0.6)] hover:bg-oxblood-soft active:shadow-none",
        secondary:
          "border-2 border-paper-line bg-cream-50 text-teal hover:border-teal hover:bg-cream-100",
        ghost: "min-h-11 rounded-lg px-2 text-teal underline decoration-2 underline-offset-4 hover:translate-y-0 hover:bg-cream-100",
        danger: "border-2 border-cherry bg-cream-50 text-cherry hover:bg-cherry-wash",
        // Outside, on oxblood: cream on wine.
        light:
          "bg-buttercream text-oxblood shadow-[0_2px_0_#d9c49b,0_10px_20px_-12px_rgb(0_0_0/0.6)] hover:bg-[#fff6df] active:shadow-none",
      },
      size: {
        sm: "min-h-11 px-4 text-sm",
        md: "min-h-12 px-6 text-base",
        lg: "min-h-14 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disables the button, sets aria-busy and shows a spinner before the label. */
  loading?: boolean;
  /** React 19 passes refs as props (used to focus Cancel in confirmations). */
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={asChild && (disabled || loading) ? true : undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="size-[1.1em]" />}
          {children}
        </>
      )}
    </Comp>
  );
}
