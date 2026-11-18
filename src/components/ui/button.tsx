import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

/** OWNER: design agent. Props API is the contract: variant, size, asChild, loading. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 min-h-11",
  {
    variants: {
      variant: {
        primary: "bg-pine-800 text-cream-50 hover:bg-pine-900",
        festive: "bg-berry-600 text-cream-50 hover:bg-berry-700",
        secondary: "border border-line bg-cream-50 text-ink-900 hover:bg-cream-100",
        ghost: "text-ink-700 hover:bg-cream-100",
        danger: "bg-berry-700 text-cream-50 hover:bg-berry-600",
      },
      size: { sm: "px-4 text-sm min-h-9", md: "px-5 text-base", lg: "px-7 text-lg min-h-13" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {children}
    </Comp>
  );
}
