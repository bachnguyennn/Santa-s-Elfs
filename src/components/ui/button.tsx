import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * OWNER: design agent. Props API is the contract: variant, size, asChild, loading.
 * variant:
 *  - primary   pine; the default action on cream screens
 *  - festive   berry; the ONE celebratory/primary CTA of a page (Start a group, Draw names, Open card)
 *  - secondary paper with a line border
 *  - ghost     text-only, quiet
 *  - danger    destructive (delete group, remove participant); always confirm in a Dialog
 *  - light     cream on pine/felt grounds
 * Touch targets: every size is at least 44px tall.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-sans font-bold whitespace-nowrap select-none",
    "transition-[background-color,box-shadow,transform,color] duration-200 ease-[var(--ease-out-expo)]",
    "hover:-translate-y-px active:translate-y-0 active:duration-75",
    "disabled:pointer-events-none disabled:opacity-55 aria-busy:cursor-progress",
    "[&_svg]:size-[1.1em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-pine-800 text-cream-50 shadow-[inset_0_-2px_0_rgb(0_0_0/0.22),var(--shadow-paper)] hover:bg-pine-900 active:shadow-[inset_0_1px_0_rgb(0_0_0/0.2)]",
        festive:
          "bg-berry-600 text-cream-50 shadow-[inset_0_-2px_0_rgb(0_0_0/0.22),var(--shadow-paper)] hover:bg-berry-700 active:shadow-[inset_0_1px_0_rgb(0_0_0/0.2)]",
        secondary:
          "border border-line-strong bg-cream-50 text-pine-900 shadow-[0_1px_1px_rgb(11_42_30/0.06)] hover:border-pine-700 hover:bg-cream-100",
        ghost: "text-pine-800 underline-offset-4 hover:bg-cream-100 hover:translate-y-0",
        danger:
          "bg-berry-700 text-cream-50 shadow-[inset_0_-2px_0_rgb(0_0_0/0.25)] hover:bg-berry-800 active:shadow-[inset_0_1px_0_rgb(0_0_0/0.2)]",
        light:
          "bg-cream-50 text-pine-900 shadow-[inset_0_-2px_0_rgb(11_42_30/0.18),0_6px_16px_-6px_rgb(0_0_0/0.4)] hover:bg-gold-200",
      },
      size: {
        sm: "min-h-11 px-4 text-sm",
        md: "min-h-12 px-5 text-base",
        lg: "min-h-14 px-7 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disables the button, sets aria-busy and shows a spinner before the label. */
  loading?: boolean;
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
