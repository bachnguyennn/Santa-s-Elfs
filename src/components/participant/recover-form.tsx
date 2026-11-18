"use client";

import { MailCheck } from "lucide-react";
import * as React from "react";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { emailSchema } from "@/lib/contracts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { DemoEmailAlert } from "./demo-alert";

/**
 * "Email me my link". POST /api/recover. The answer is always the same generic confirmation,
 * so the page never reveals whether an address is registered.
 * With `inviteCode`, only that group is searched (invite page).
 */
export function RecoverForm({
  inviteCode,
  defaultEmail = "",
  demoMode = false,
  submitLabel = "Email me my link",
  idPrefix = "recover",
}: {
  inviteCode?: string;
  defaultEmail?: string;
  demoMode?: boolean;
  submitLabel?: string;
  idPrefix?: string;
}) {
  const [email, setEmail] = React.useState(defaultEmail);
  const [error, setError] = React.useState<string>();
  const [formError, setFormError] = React.useState<string>();
  const [pending, setPending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const doneRef = React.useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      await apiFetch<{ ok: true }>("/api/recover", { body: { email: parsed.data, ...(inviteCode ? { inviteCode } : {}) } });
      setSentTo(parsed.data);
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      if (err instanceof ApiRequestError && err.fields.email) setError(err.fields.email);
      else if (err instanceof ApiRequestError && err.code === "RATE_LIMITED")
        setFormError("That's a lot of requests in a short time. Please wait a few minutes and try again.");
      else setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div ref={doneRef} tabIndex={-1} className="space-y-4 outline-none">
        <div role="status" className="flex animate-unfold gap-3 rounded-xl border border-pine-200 bg-pine-100 p-4 text-pine-900">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-pine-700" aria-hidden />
          <div>
            <p className="font-bold">Check your inbox</p>
            <p className="mt-1 text-sm leading-relaxed">
              If <strong className="break-all">{sentTo}</strong> is registered, a fresh private link is on its way. It can take a
              minute or two; check your spam folder too.
            </p>
          </div>
        </div>
        {demoMode && <DemoEmailAlert />}
        <Button variant="ghost" size="sm" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field id={`${idPrefix}-email`} label="Your email address" error={error}>
        {(aria) => (
          <Input
            {...aria}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        )}
      </Field>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Button type="submit" variant="primary" loading={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
