"use client";

import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { CURRENCIES, MAX_PARTICIPANTS, createGroupSchema, type CreateGroupInput, type CreateGroupResult } from "@/lib/contracts";
import { formatDateOnly, formatMoney, utcToZonedWallTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";

type Currency = (typeof CURRENCIES)[number];

interface FormState {
  name: string;
  organizerName: string;
  organizerEmail: string;
  organizerParticipates: boolean;
  budgetMin: string;
  budgetMax: string;
  currency: Currency;
  exchangeDate: string;
  signupDeadline: string;
  timezone: string | null; // null = use the detected one
  drawMethod: "manual" | "scheduled";
  drawAt: string;
  requiresApproval: boolean;
  rules: string;
}

type FieldKey = Exclude<keyof FormState, "timezone"> | "timezone";
type Errors = Partial<Record<FieldKey | "_", string>>;

const STEPS = ["Group", "Budget & dates", "Draw", "Review"];
const STEP_FIELDS: FieldKey[][] = [
  ["name", "organizerName", "organizerEmail", "organizerParticipates"],
  ["budgetMin", "budgetMax", "currency", "exchangeDate", "signupDeadline", "timezone"],
  ["drawMethod", "drawAt", "requiresApproval", "rules"],
  [],
];
const stepOf = (key: string) => {
  const i = STEP_FIELDS.findIndex((f) => f.includes(key as FieldKey));
  return i === -1 ? 3 : i;
};

const INITIAL: FormState = {
  name: "",
  organizerName: "",
  organizerEmail: "",
  organizerParticipates: false,
  budgetMin: "",
  budgetMax: "",
  currency: "USD",
  exchangeDate: "",
  signupDeadline: "",
  timezone: null,
  drawMethod: "manual",
  drawAt: "",
  requiresApproval: false,
  rules: "",
};

// Browser timezone + list, read without a hydration mismatch.
const noopSubscribe = () => () => {};
let tzListCache: string[] | null = null;
function getTzList(): string[] {
  if (!tzListCache) {
    try {
      tzListCache = (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone");
    } catch {
      tzListCache = ["UTC"];
    }
  }
  return tzListCache;
}
const EMPTY: string[] = [];
const detectTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function parseMoney(v: string): number | undefined | "invalid" {
  const t = v.trim().replace(",", ".");
  if (!t) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "invalid";
  return Number(t);
}

function toInput(f: FormState, tz: string): CreateGroupInput {
  const min = parseMoney(f.budgetMin);
  const max = parseMoney(f.budgetMax);
  return {
    name: f.name,
    organizerName: f.organizerName,
    organizerEmail: f.organizerEmail,
    organizerParticipates: f.organizerParticipates,
    budgetMin: typeof min === "number" ? min : undefined,
    budgetMax: typeof max === "number" ? max : undefined,
    currency: f.currency,
    signupDeadline: f.signupDeadline || undefined,
    drawMethod: f.drawMethod,
    drawAt: f.drawMethod === "scheduled" ? f.drawAt || undefined : undefined,
    exchangeDate: f.exchangeDate || undefined,
    timezone: tz,
    requiresApproval: f.requiresApproval,
    rules: f.rules.trim() || undefined,
  };
}

function validate(f: FormState, tz: string): Errors {
  const errors: Errors = {};
  const parsed = createGroupSchema.safeParse(toInput(f, tz));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_") as FieldKey;
      errors[key] ??= issue.message;
    }
  }
  if (parseMoney(f.budgetMin) === "invalid") errors.budgetMin = "Enter an amount like 20 or 20.50.";
  if (parseMoney(f.budgetMax) === "invalid") errors.budgetMax = "Enter an amount like 40 or 40.50.";
  if (f.budgetMin.trim() && f.budgetMax.trim() && Number(f.budgetMin) > Number(f.budgetMax))
    errors.budgetMax ??= "Maximum budget must be at least the minimum.";
  const now = utcToZonedWallTime(new Date(), tz);
  if (f.signupDeadline && f.signupDeadline <= now) errors.signupDeadline = "Choose a signup deadline in the future.";
  if (f.drawMethod === "scheduled" && f.drawAt && f.drawAt <= now) errors.drawAt = "Choose a drawing time in the future.";
  return errors;
}

function formatLocal(local: string) {
  const [d, t] = local.split("T");
  const [hh, mm] = t.split(":").map(Number);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, hh, mm)));
  return `${formatDateOnly(d)}, ${time}`;
}

export function CreateGroupWizard({
  onDraft,
}: {
  /** Mirrors the draft to the desk (the invitation card). Display only: the form stays the source of truth. */
  onDraft?: (draft: { name: string; organizerName: string; step: number }) => void;
} = {}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, setPending] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const dirty = React.useRef(false);
  const submitted = React.useRef(false);

  const detectedTz = React.useSyncExternalStore(noopSubscribe, detectTz, () => "UTC");
  const tzList = React.useSyncExternalStore(noopSubscribe, getTzList, () => EMPTY);
  const tz = form.timezone ?? detectedTz;
  const tzOptions = tzList.includes(tz) ? tzList : [tz, ...tzList];

  const draftRef = React.useRef(onDraft);
  React.useEffect(() => {
    draftRef.current = onDraft;
  });
  React.useEffect(() => {
    draftRef.current?.({ name: form.name, organizerName: form.organizerName, step });
  }, [form.name, form.organizerName, step]);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current && !submitted.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    dirty.current = true;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key as FieldKey] ? { ...e, [key]: undefined } : e));
  }

  function goTo(next: number, focusField?: string) {
    setStep(next);
    requestAnimationFrame(() => {
      const el = focusField ? formRef.current?.querySelector<HTMLElement>(`[name="${focusField}"]`) : null;
      if (el) el.focus();
      else headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function errorsForStep(all: Errors, s: number): Errors {
    const out: Errors = {};
    for (const k of STEP_FIELDS[s]) if (all[k]) out[k] = all[k];
    return out;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const all = validate(form, tz);
    if (step < 3) {
      const mine = errorsForStep(all, step);
      setErrors(mine);
      const first = STEP_FIELDS[step].find((k) => mine[k]);
      if (first) {
        formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
      goTo(step + 1);
      return;
    }
    const firstKey = Object.keys(all).find((k) => all[k as FieldKey]);
    if (firstKey) {
      setErrors(all);
      goTo(stepOf(firstKey), firstKey);
      return;
    }
    setPending(true);
    setErrors({});
    try {
      const res = await apiFetch<CreateGroupResult>("/api/groups", { body: createGroupSchema.parse(toInput(form, tz)) });
      submitted.current = true;
      router.push(`/o/${res.groupId}?created=1`);
    } catch (err) {
      setPending(false);
      if (err instanceof ApiRequestError && Object.keys(err.fields).length) {
        const mapped: Errors = {};
        for (const [path, msg] of Object.entries(err.fields)) mapped[(path.split(".")[0] || "_") as FieldKey] ??= msg;
        setErrors(mapped);
        const first = Object.keys(mapped).find((k) => k !== "_");
        if (first) goTo(stepOf(first), first);
        return;
      }
      const message =
        err instanceof ApiRequestError && err.code === "RATE_LIMITED"
          ? "You’ve created a few groups in a short time. Please wait a little and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
      setErrors({ _: message });
    }
  }

  const err = (k: FieldKey) => errors[k];
  const budgetPreview = (() => {
    const min = parseMoney(form.budgetMin);
    const max = parseMoney(form.budgetMax);
    const fmt = (n: number) => formatMoney(Math.round(n * 100), form.currency);
    if (typeof min === "number" && typeof max === "number") return `${fmt(min)}–${fmt(max)}`;
    if (typeof max === "number") return `Up to ${fmt(max)}`;
    if (typeof min === "number") return `From ${fmt(min)}`;
    return "No budget";
  })();

  return (
    <div>
      <Stepper steps={STEPS} current={step} className="rounded-lg border border-paper-line bg-cream-50 px-4 py-3 shadow-[var(--shadow-paper)] sm:px-6" />

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-6">
        <Card className="sm:p-8">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-[1.75rem] leading-tight font-bold tracking-normal text-oxblood outline-none">
            {STEPS[step]}
          </h2>

          {step === 0 && (
            <div className="mt-6 space-y-5">
              <Field id="name" label="Group name" hint="E.g. “Miller family 2026” or “Office elves”." error={err("name")}>
                {(aria) => <Input {...aria} name="name" maxLength={80} autoComplete="off" value={form.name} onChange={(e) => set("name", e.target.value)} />}
              </Field>
              <Field id="organizerName" label="Your name" hint="Shown on the invite as the organizer." error={err("organizerName")}>
                {(aria) => (
                  <Input {...aria} name="organizerName" maxLength={60} autoComplete="name" value={form.organizerName} onChange={(e) => set("organizerName", e.target.value)} />
                )}
              </Field>
              <Field id="organizerEmail" label="Your email" hint="We’ll send your private organizer link here. No password needed." error={err("organizerEmail")}>
                {(aria) => (
                  <Input
                    {...aria}
                    name="organizerEmail"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.organizerEmail}
                    onChange={(e) => set("organizerEmail", e.target.value)}
                  />
                )}
              </Field>
              <Checkbox
                id="organizerParticipates"
                name="organizerParticipates"
                label="I’m taking part in the exchange too"
                description={`You’ll draw a name and get a Santa like everyone else. It uses one of the ${MAX_PARTICIPANTS} places. You still won’t see who has whom.`}
                checked={form.organizerParticipates}
                onChange={(e) => set("organizerParticipates", e.target.checked)}
              />
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-5">
              <fieldset>
                <legend className="text-[0.9375rem] font-bold text-ink-900">
                  Budget per gift <span className="font-normal text-ink-500">(optional)</span>
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_8rem]">
                  <Field id="budgetMin" label="Minimum" error={err("budgetMin")}>
                    {(aria) => (
                      <Input {...aria} name="budgetMin" inputMode="decimal" placeholder="20" value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} />
                    )}
                  </Field>
                  <Field id="budgetMax" label="Maximum" error={err("budgetMax")}>
                    {(aria) => (
                      <Input {...aria} name="budgetMax" inputMode="decimal" placeholder="40" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
                    )}
                  </Field>
                  <Field id="currency" label="Currency" className="col-span-2 sm:col-span-1" error={err("currency")}>
                    {(aria) => (
                      <Select {...aria} name="currency" value={form.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
              </fieldset>
              <Field id="exchangeDate" label="Gift exchange date" optional hint="The day you’ll swap gifts." error={err("exchangeDate")}>
                {(aria) => <Input {...aria} name="exchangeDate" type="date" value={form.exchangeDate} onChange={(e) => set("exchangeDate", e.target.value)} />}
              </Field>
              <Field
                id="signupDeadline"
                label="Signups close"
                optional
                hint="After this, the invite link stops accepting new people."
                error={err("signupDeadline")}
              >
                {(aria) => (
                  <Input {...aria} name="signupDeadline" type="datetime-local" value={form.signupDeadline} onChange={(e) => set("signupDeadline", e.target.value)} />
                )}
              </Field>
              <Field id="timezone" label="Timezone" hint="Dates and times above are in this timezone." error={err("timezone")}>
                {(aria) => (
                  <Select {...aria} name="timezone" value={tz} onChange={(e) => set("timezone", e.target.value)}>
                    {tzOptions.map((z) => (
                      <option key={z} value={z}>
                        {z.replaceAll("_", " ")}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-6">
              <fieldset>
                <legend className="text-[0.9375rem] font-bold text-ink-900">How should names be drawn?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["manual", "When I press the button", "You decide when everyone’s in."],
                      ["scheduled", "At a set date and time", "The elves draw automatically."],
                    ] as const
                  ).map(([value, title, body]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border bg-white p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-600",
                        form.drawMethod === value ? "border-pine-700 bg-pine-100/50 ring-1 ring-pine-700" : "border-line-strong hover:border-pine-700/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="drawMethod"
                        value={value}
                        checked={form.drawMethod === value}
                        onChange={() => set("drawMethod", value)}
                        className="mt-1 size-5 shrink-0 accent-pine-700 focus-visible:outline-none"
                      />
                      <span>
                        <span className="block font-bold text-ink-900">{title}</span>
                        <span className="block text-sm text-ink-500">{body}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {form.drawMethod === "scheduled" && (
                <Field id="drawAt" label="Draw names on" hint={`In ${tz.replaceAll("_", " ")} time. Everyone gets an email when it happens.`} error={err("drawAt")}>
                  {(aria) => <Input {...aria} name="drawAt" type="datetime-local" value={form.drawAt} onChange={(e) => set("drawAt", e.target.value)} />}
                </Field>
              )}
              <Checkbox
                id="requiresApproval"
                name="requiresApproval"
                label="I want to approve each person who joins"
                description="Handy if the invite link might get passed around. Off by default: anyone with the link can join."
                checked={form.requiresApproval}
                onChange={(e) => set("requiresApproval", e.target.checked)}
              />
              <Field id="rules" label="Notes for everyone" optional hint="House rules, where you’ll meet, “no socks”…" error={err("rules")}>
                {(aria) => <Textarea {...aria} name="rules" maxLength={2000} value={form.rules} onChange={(e) => set("rules", e.target.value)} />}
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6">
              <dl className="divide-y divide-line">
                {(
                  [
                    [0, "Group", form.name],
                    [0, "Organizer", `${form.organizerName} · ${form.organizerEmail}`],
                    [0, "You take part", form.organizerParticipates ? "Yes" : "No, just organizing"],
                    [1, "Budget", budgetPreview],
                    [1, "Exchange", form.exchangeDate ? formatDateOnly(form.exchangeDate) : "Not set"],
                    [1, "Signups close", form.signupDeadline ? formatLocal(form.signupDeadline) : "When you draw names"],
                    [1, "Timezone", tz.replaceAll("_", " ")],
                    [2, "Drawing", form.drawMethod === "scheduled" && form.drawAt ? formatLocal(form.drawAt) : "When you press the button"],
                    [2, "Approval", form.requiresApproval ? "You approve each person" : "Anyone with the link can join"],
                  ] as const
                ).map(([s, term, value]) => (
                  <div key={term} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <dt className="text-sm text-ink-500">{term}</dt>
                      <dd className="font-bold break-words text-ink-900">{value}</dd>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => goTo(s)} aria-label={`Edit ${term.toLowerCase()}`}>
                      <Pencil aria-hidden /> Edit
                    </Button>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-sm leading-relaxed text-ink-500">
                After you create the group you’ll get an invite link to share, and your private organizer link by email.
              </p>
            </div>
          )}

          {errors._ && (
            <Alert tone="error" className="mt-6">
              {errors._}
            </Alert>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} disabled={pending}>
                <ArrowLeft aria-hidden /> Back
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            {step < 3 ? (
              <Button type="submit" variant="primary">
                Next <ArrowRight aria-hidden />
              </Button>
            ) : (
              <Button type="submit" variant="festive" size="lg" loading={pending}>
                {pending ? "Creating…" : "Create group"}
              </Button>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
