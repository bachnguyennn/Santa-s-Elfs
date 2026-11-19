import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * OWNER: design agent. Props API is the contract: variant, size, asChild, loading.
 * variant:
 *  - primary   evergreen; ordinary actions and secondary steps (Approve, Save)
 *  - festive   cranberry; the ONE main action of an area (Start a group, Draw names now, Send letter)
 *  - secondary paper with an ink outline
 *  - ghost     text-only link look, quiet
 *  - danger    cranberry outline on paper; destructive, always confirm in a Dialog, kept apart from other actions
 *  - light     paper on evergreen grounds
 * Touch targets: every size is at least 44px tall.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-[2.5px] border-midnight font-sans font-bold whitespace-nowrap select-none",
    "transition-[background-color,box-shadow,transform,color] duration-200 ease-[var(--ease-out-quint)]",
    "hover:-translate-y-0.5 active:translate-y-0 active:duration-75",
    "disabled:pointer-events-none disabled:opacity-55 aria-busy:cursor-progress",
    "[&_svg]:size-[1.1em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Village buttons: an ink outline and a crisp shadow down-right that flattens when pressed.
        primary:
          "bg-evergreen text-paper shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-evergreen-deep active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
        festive:
          "bg-cranberry text-paper shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-cranberry-deep active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
        secondary:
          "bg-paper text-evergreen shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-snow active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
        ghost:
          "border-transparent text-evergreen underline decoration-2 underline-offset-4 hover:translate-y-0 hover:bg-paper",
        danger:
          "border-cranberry-deep bg-paper text-cranberry-deep shadow-[3px_4px_0_rgb(143_34_54/0.85)] hover:bg-berry-100 active:shadow-[1px_1px_0_rgb(143_34_54/0.85)]",
        light:
          "bg-paper text-evergreen shadow-[3px_4px_0_rgb(23_45_56/0.9)] hover:bg-golden active:shadow-[1px_1px_0_rgb(23_45_56/0.9)]",
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
