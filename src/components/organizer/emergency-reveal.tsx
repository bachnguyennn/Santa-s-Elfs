"use client";

import { EyeOff, ShieldAlert } from "lucide-react";
import * as React from "react";
import { HandName, PaperSlip } from "@/components/brand/paper-slip";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import type { EmergencyChallengeDTO, EmergencyRevealDTO } from "@/lib/contracts";

type Step =
  | { kind: "choose" }
  | { kind: "code"; challenge: EmergencyChallengeDTO; participantName: string }
  | { kind: "shown"; result: EmergencyRevealDTO };

/**
 * Exceptional tool: look up ONE participant's recipient, gated by a code emailed to the organizer.
 * The result lives only in component state; "Hide" (or leaving the page) forgets it.
 */
export function EmergencyReveal({ groupId, people }: { groupId: string; people: { id: string; name: string }[] }) {
  const [step, setStep] = React.useState<Step>({ kind: "choose" });
  const [personId, setPersonId] = React.useState("");
  const [understood, setUnderstood] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<string | undefined>();
  const resultRef = React.useRef<HTMLParagraphElement>(null);
  const codeRef = React.useRef<HTMLInputElement>(null);

  const person = people.find((p) => p.id === personId);

  function explain(err: unknown): string {
    if (!(err instanceof ApiRequestError)) return "Something went wrong. Please try again.";
    switch (err.code) {
      case "CHALLENGE_FAILED":
        return "That code didn’t work. It may be mistyped, expired (codes last 10 minutes) or already used. Check the latest email, or start again for a new code.";
      case "RATE_LIMITED":
        return "Too many emergency requests for now. This is limited to keep everyone’s secret safe. Try again in an hour.";
      case "NOT_DRAWN":
        return "Names haven’t been drawn yet, so there’s nothing to look up.";
      default:
        return err.message;
    }
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!person) {
      setFieldError("Choose the one person you need to look up.");
      return;
    }
    if (!understood) {
      setError("Tick the box to confirm you understand what this does.");
      return;
    }
    setBusy(true);
    setError(null);
    setFieldError(undefined);
    try {
      const challenge = await apiFetch<EmergencyChallengeDTO>(`/api/o/${groupId}/emergency/challenge`, { body: { participantId: person.id } });
      setStep({ kind: "code", challenge, participantName: person.name });
      setCode("");
      window.setTimeout(() => codeRef.current?.focus(), 40);
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "code") return;
    if (!/^\d{6}$/.test(code)) {
      setFieldError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    setFieldError(undefined);
    try {
      const result = await apiFetch<EmergencyRevealDTO>(`/api/o/${groupId}/emergency/reveal`, {
        body: { challengeId: step.challenge.challengeId, code },
      });
      setCode("");
      setStep({ kind: "shown", result });
      window.setTimeout(() => resultRef.current?.focus(), 40);
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep({ kind: "choose" });
    setPersonId("");
    setUnderstood(false);
    setCode("");
    setError(null);
    setFieldError(undefined);
  }

  if (step.kind === "shown") {
    return (
      <Card className="text-center">
        <PaperSlip tilt={-1} className="mx-auto max-w-md p-6 sm:p-8">
          <p ref={resultRef} tabIndex={-1} className="text-lg text-ink-700 outline-none" aria-live="polite">
            <HandName className="text-2xl text-pine-900">{step.result.participantName}</HandName> is giving a gift to{" "}
            <HandName className="text-2xl text-berry-700">{step.result.recipientName}</HandName>
          </p>
        </PaperSlip>
        <p className="mx-auto mt-5 max-w-md text-sm text-ink-700">
          This lookup was logged. Use it only to sort out the gift, then keep it to yourself.
        </p>
        <Button onClick={reset} className="mt-5 w-full sm:w-auto">
          <EyeOff aria-hidden /> Hide
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      {step.kind === "choose" ? (
        <form onSubmit={requestCode} noValidate className="flex flex-col gap-5">
          <Field
            id="emergency-person"
            label="Whose match do you need?"
            hint="Pick one person. You can only look up one at a time."
            error={fieldError}
          >
            {(a) => (
              <Select {...a} value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">Choose a person…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="rounded-xl border border-berry-500/40 bg-berry-100 px-4 py-4 text-berry-800">
            <p className="flex items-center gap-2 font-bold">
              <ShieldAlert className="size-5 shrink-0" aria-hidden />
              This spoils {person ? `${person.name}’s` : "that person’s"} secret for you
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              <li>You’ll see who {person ? `${person.name} is` : "they’re"} buying for.</li>
              <li>The lookup is logged in the group’s history.</li>
              <li>We email a 6-digit code to your organizer address first.</li>
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-3 font-bold text-ink-900 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-600">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-berry-700 focus-visible:outline-none"
              />
              I understand, and I really need this
            </label>
          </div>

          <Button type="submit" variant="danger" loading={busy} className="w-full sm:w-auto sm:self-start">
            Email me a code
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-5">
          <Alert tone="info" title={`We emailed a 6-digit code to ${step.challenge.sentTo}`}>
            It’s for looking up {step.participantName}’s match and works for 10 minutes.
          </Alert>
          <Field id="emergency-code" label="6-digit code" error={fieldError}>
            {(a) => (
              <Input
                {...a}
                ref={codeRef}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                className="max-w-[12rem] font-mono text-xl tracking-[0.3em]"
              />
            )}
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="danger" loading={busy} className="w-full sm:w-auto">
              Show the match
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={busy} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </form>
      )}
      {error && (
        <Alert tone="error" title="Not revealed" className="mt-5">
          {error}
        </Alert>
      )}
    </Card>
  );
}
