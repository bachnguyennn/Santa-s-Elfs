import * as React from "react";
import { cn } from "@/lib/utils";

/** OWNER: design agent. Accessible form primitives: Field wires label, hint and error to the control by id. */

const control = [
  "w-full rounded-xl border-2 border-midnight bg-white px-4 py-3 text-base text-midnight",
  "placeholder:text-ink-500 transition-[border-color,box-shadow] duration-150",
  "hover:shadow-[3px_3px_0_var(--color-snow-shadow)] focus:shadow-[3px_3px_0_var(--color-snow-shadow)]",
  "disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-ink-500",
  "aria-[invalid=true]:border-cranberry-deep aria-[invalid=true]:bg-berry-100/40",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, "min-h-12", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(control, "min-h-28 leading-relaxed", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        control,
        "min-h-12 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23172D38' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:1.25rem] bg-[right_0.875rem_center] bg-no-repeat pr-11",
        className,
      )}
      {...props}
    />
  );
});

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  /** Render prop receives aria props to spread on the control. */
  children: (aria: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}

export function Field({ id, label, hint, error, optional, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[0.9375rem] font-bold text-ink-900">
        {label} {optional && <span className="font-normal text-ink-500">(optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-ink-500">
          {hint}
        </p>
      )}
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined })}
      {error && (
        <p id={errId} className="text-sm font-bold text-cranberry-deep" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
