"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { CURRENCIES, type OrganizerDashboardDTO, type UpdateGroupInput } from "@/lib/contracts";
import { utcToZonedWallTime } from "@/lib/time";
import { cn } from "@/lib/utils";

type Group = OrganizerDashboardDTO["group"];

const centsToInput = (c: number | null) => (c === null ? "" : String(c / 100));
const inputToMoney = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? undefined : n;
};

/** Edit the group's settings while it's open. Wall times are entered in the group's timezone. */
export function SettingsForm({ groupId, group, timezones, locked }: { groupId: string; group: Group; timezones: string[]; locked: boolean }) {
  const router = useRouter();
  const tz = group.timezone;
  const [v, setV] = React.useState({
    name: group.name,
    budgetMin: centsToInput(group.budgetMinCents),
    budgetMax: centsToInput(group.budgetMaxCents),
    currency: group.currency,
    signupDeadline: group.signupDeadline ? utcToZonedWallTime(group.signupDeadline, tz) : "",
    drawMethod: group.drawMethod,
    drawAt: group.drawAt ? utcToZonedWallTime(group.drawAt, tz) : "",
    exchangeDate: group.exchangeDate ?? "",
    timezone: tz,
    requiresApproval: group.requiresApproval,
    rules: group.rules ?? "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: value }));
    setSaved(false);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    const body: UpdateGroupInput = {
      name: v.name,
      budgetMin: inputToMoney(v.budgetMin),
      budgetMax: inputToMoney(v.budgetMax),
      currency: v.currency as UpdateGroupInput["currency"],
      signupDeadline: v.signupDeadline || undefined,
      drawMethod: v.drawMethod,
      drawAt: v.drawMethod === "scheduled" ? v.drawAt || undefined : undefined,
      exchangeDate: v.exchangeDate || undefined,
      timezone: v.timezone,
      requiresApproval: v.requiresApproval,
      rules: v.rules,
    };
    try {
      await apiFetch(`/api/o/${groupId}`, { method: "PATCH", body });
      setSaved(true);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.fields);
        setFormError(err.code === "VALIDATION" ? "Some details need fixing. They’re marked below." : err.message);
      } else setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => errors[k];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {locked && (
        <Alert tone="info" title="Settings are locked">
          Names have been drawn, so these details can’t change any more. Everyone already has them in their email.
        </Alert>
      )}
      <fieldset disabled={locked || saving} className="flex flex-col gap-6">
        <legend className="sr-only">Group settings</legend>
        <Field id="name" label="Group name" error={err("name")}>
          {(a) => <Input {...a} value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={80} autoComplete="off" />}
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_8rem]">
          <Field id="budgetMin" label="Budget from" optional error={err("budgetMin")}>
            {(a) => <Input {...a} inputMode="decimal" value={v.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} placeholder="20" />}
          </Field>
          <Field id="budgetMax" label="Budget up to" optional error={err("budgetMax")}>
            {(a) => <Input {...a} inputMode="decimal" value={v.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} placeholder="40" />}
          </Field>
          <Field id="currency" label="Currency" error={err("currency")} className="col-span-2 sm:col-span-1">
            {(a) => (
              <Select {...a} value={v.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field id="timezone" label="Time zone" hint="All dates and times below are in this time zone." error={err("timezone")}>
          {(a) => (
            <Select {...a} value={v.timezone} onChange={(e) => set("timezone", e.target.value)}>
              {timezones.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field id="signupDeadline" label="Signups close" optional hint="Leave empty to keep joining open until names are drawn." error={err("signupDeadline")}>
          {(a) => <Input {...a} type="datetime-local" value={v.signupDeadline} onChange={(e) => set("signupDeadline", e.target.value)} />}
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 text-[0.9375rem] font-bold text-ink-900">How names are drawn</legend>
          {(
            [
              ["manual", "I’ll draw names myself", "You press “Draw names” when everyone’s in."],
              ["scheduled", "The elves draw automatically", "At a date and time you choose. You can still draw early."],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-600",
                v.drawMethod === value ? "border-pine-700 bg-pine-100/50" : "border-line-strong hover:border-pine-700/60",
              )}
            >
              <input
                type="radio"
                name="drawMethod"
                value={value}
                checked={v.drawMethod === value}
                onChange={() => set("drawMethod", value)}
                className="mt-1 size-5 shrink-0 accent-pine-800 focus-visible:outline-none"
              />
              <span>
                <span className="block font-bold text-ink-900">{title}</span>
                <span className="block text-sm text-ink-700">{hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {v.drawMethod === "scheduled" && (
          <Field id="drawAt" label="Draw names on" error={err("drawAt")}>
            {(a) => <Input {...a} type="datetime-local" value={v.drawAt} onChange={(e) => set("drawAt", e.target.value)} />}
          </Field>
        )}

        <Field id="exchangeDate" label="Exchange date" optional hint="The day gifts are swapped. The group is deleted 60 days after it." error={err("exchangeDate")}>
          {(a) => <Input {...a} type="date" value={v.exchangeDate} onChange={(e) => set("exchangeDate", e.target.value)} />}
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-600">
          <input
            type="checkbox"
            checked={v.requiresApproval}
            onChange={(e) => set("requiresApproval", e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-pine-800 focus-visible:outline-none"
          />
          <span>
            <span className="block font-bold text-ink-900">Approve each person before they’re in</span>
            <span className="block text-sm text-ink-700">Useful if the invite link might travel further than you’d like.</span>
          </span>
        </label>

        <Field id="rules" label="Notes for everyone" optional hint="House rules, theme, where the exchange happens." error={err("rules")}>
          {(a) => <Textarea {...a} value={v.rules} onChange={(e) => set("rules", e.target.value)} maxLength={2000} />}
        </Field>
      </fieldset>

      {!locked && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            Save changes
          </Button>
          <p aria-live="polite" className="text-sm font-bold text-pine-800">
            {saved ? "Saved. Everyone sees the new details." : ""}
          </p>
        </div>
      )}
      {formError && (
        <Alert tone="error" title="Not saved yet">
          {formError}
        </Alert>
      )}
    </form>
  );
}
