import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OWNER: design agent. A labelled checkbox row (native input, so forms and keyboard just work).
 * The whole row is the hit target (min 44px). `description` is wired with aria-describedby.
 */
export function Checkbox({
  id,
  label,
  description,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { id: string; label: React.ReactNode; description?: React.ReactNode }) {
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div className={cn("flex gap-3 rounded-xl", className)}>
      <input
        id={id}
        type="checkbox"
        aria-describedby={descId}
        className="mt-[0.7rem] size-[1.375rem] shrink-0 cursor-pointer rounded-md accent-pine-700"
        {...props}
      />
      <div className="min-w-0 py-2.5">
        <label htmlFor={id} className="block cursor-pointer font-bold text-ink-900">
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-0.5 text-sm leading-relaxed text-ink-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
