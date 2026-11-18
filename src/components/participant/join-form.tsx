"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { joinGroupSchema, type JoinResult } from "@/lib/contracts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { RecoverForm } from "./recover-form";

type Fields = "name" | "email";

/** Join form for the invite page. POST /api/join/[code] -> /p/[participantId]. */
export function JoinForm({ inviteCode, requiresApproval, demoMode }: { inviteCode: string; requiresApproval: boolean; demoMode: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [errors, setErrors] = React.useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = React.useState<string>();
  const [duplicate, setDuplicate] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  function focusFirst(errs: Partial<Record<Fields, string>>) {
    if (errs.name) nameRef.current?.focus();
    else if (errs.email) emailRef.current?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setDuplicate(false);
    const parsed = joinGroupSchema.safeParse({ name, email, website });
    if (!parsed.success) {
      const errs: Partial<Record<Fields, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "name" || key === "email") && !errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      focusFirst(errs);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const res = await apiFetch<JoinResult>(`/api/join/${encodeURIComponent(inviteCode)}`, { body: parsed.data });
      router.push(`/p/${res.participantId}?joined=1`);
    } catch (err) {
      setPending(false);
      if (!(err instanceof ApiRequestError)) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      if (err.code === "DUPLICATE_EMAIL") {
        setDuplicate(true);
        return;
      }
      const errs: Partial<Record<Fields, string>> = {};
      if (err.fields.name) errs.name = err.fields.name;
      if (err.fields.email) errs.email = err.fields.email;
      if (Object.keys(errs).length) {
        setErrors(errs);
        focusFirst(errs);
        return;
      }
      if (err.code === "RATE_LIMITED") setFormError("Lots of people are joining from here right now. Please wait a few minutes and try again.");
      else if (err.code === "GROUP_FULL" || err.code === "SIGNUPS_CLOSED" || err.code === "GROUP_LOCKED") {
        setFormError(`${err.message} Refresh the page to see the latest.`);
      } else setFormError(err.message);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field id="join-name" label="Your name" hint="How the group knows you. Your Santa sees this name." error={errors.name}>
          {(aria) => (
            <Input
              {...aria}
              ref={nameRef}
              name="name"
              autoComplete="name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <Field
          id="join-email"
          label="Your email"
          hint="We’ll email you a private link. It’s your key, so keep it to yourself."
          error={errors.email}
        >
          {(aria) => (
            <Input
              {...aria}
              ref={emailRef}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (duplicate) setDuplicate(false);
              }}
            />
          )}
        </Field>

        {/* Honeypot: hidden from people, irresistible to bots. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="join-website">Website</label>
          <input id="join-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        {formError && <Alert tone="error">{formError}</Alert>}

        {!duplicate && (
          <Button type="submit" variant="festive" size="lg" loading={pending} className="w-full sm:w-auto">
            {pending ? "Joining…" : requiresApproval ? "Ask to join" : "Join the exchange"}
          </Button>
        )}
      </form>

      {duplicate && (
        <div className="mt-2 space-y-4 rounded-xl border border-gold-500/50 bg-gold-200/40 p-4 sm:p-5">
          <div role="alert">
            <p className="font-bold text-ink-900">You’ve already joined with this email</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">
              For your privacy we can’t open your page from here. We’ll email your private link to that address instead.
            </p>
          </div>
          <RecoverForm inviteCode={inviteCode} defaultEmail={email} demoMode={demoMode} idPrefix="join-recover" />
        </div>
      )}
    </div>
  );
}
