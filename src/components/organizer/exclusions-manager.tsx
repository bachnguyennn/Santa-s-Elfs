"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import type { DrawReadinessDTO, ExclusionDTO, ParticipantStatus } from "@/lib/contracts";

interface Person {
  id: string;
  name: string;
  status: ParticipantStatus;
}

interface Rule {
  a: string;
  b: string;
  symmetric: boolean;
}

/** Collapse directed exclusions into rules: a mirrored pair renders once as "each other". */
function toRules(list: ExclusionDTO[], rank: (id: string) => number): Rule[] {
  const set = new Set(list.map((e) => `${e.giverId}|${e.receiverId}`));
  const seen = new Set<string>();
  const rules: Rule[] = [];
  for (const e of list) {
    const key = `${e.giverId}|${e.receiverId}`;
    if (seen.has(key)) continue;
    const mirror = `${e.receiverId}|${e.giverId}`;
    const symmetric = set.has(mirror);
    seen.add(key);
    if (symmetric) seen.add(mirror);
    // Mirrored pairs read in join order, whichever direction was stored first.
    const swap = symmetric && rank(e.receiverId) < rank(e.giverId);
    rules.push({ a: swap ? e.receiverId : e.giverId, b: swap ? e.giverId : e.receiverId, symmetric });
  }
  return rules;
}

export function ExclusionsManager({
  groupId,
  people,
  initialExclusions,
  initialReadiness,
  locked,
}: {
  groupId: string;
  people: Person[];
  initialExclusions: ExclusionDTO[];
  initialReadiness: DrawReadinessDTO;
  locked: boolean;
}) {
  const router = useRouter();
  const [exclusions, setExclusions] = React.useState(initialExclusions);
  const [readiness, setReadiness] = React.useState(initialReadiness);
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [oneWay, setOneWay] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [checking, setChecking] = React.useState(false);

  const byId = React.useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const choosable = people.filter((p) => p.status === "approved" || p.status === "pending");
  const rules = toRules(exclusions, (id) => people.findIndex((p) => p.id === id));

  async function refreshReadiness() {
    setChecking(true);
    try {
      setReadiness(await apiFetch<DrawReadinessDTO>(`/api/o/${groupId}/draw`));
    } catch {
      /* the list itself is already correct; readiness stays as last known */
    } finally {
      setChecking(false);
    }
  }

  async function mutate(key: string, method: "POST" | "DELETE", body: { giverId: string; receiverId: string; symmetric: boolean }) {
    setBusy(key);
    setError(null);
    setFieldErrors({});
    try {
      const next = await apiFetch<ExclusionDTO[]>(`/api/o/${groupId}/exclusions`, { method, body });
      setExclusions(next);
      if (method === "POST") {
        setA("");
        setB("");
      }
      router.refresh();
      await refreshReadiness();
      return true;
    } catch (err) {
      const e = err instanceof ApiRequestError ? err : null;
      setFieldErrors(e?.fields ?? {});
      setError(
        e?.code === "GROUP_LOCKED" || e?.code === "ALREADY_DRAWN"
          ? "Names have been drawn, so exclusions can’t change any more."
          : (e?.fields.receiverId ?? e?.message ?? "Something went wrong. Please try again."),
      );
      return false;
    } finally {
      setBusy(null);
    }
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) {
      setFieldErrors({ ...(a ? {} : { giverId: "Choose a person." }), ...(b ? {} : { receiverId: "Choose a person." }) });
      return;
    }
    if (a === b) {
      setFieldErrors({ receiverId: "Pick two different people." });
      return;
    }
    void mutate("add", "POST", { giverId: a, receiverId: b, symmetric: !oneWay });
  }

  const name = (id: string) => byId.get(id)?.name ?? "Someone who left";
  const inactive = (id: string) => {
    const s = byId.get(id)?.status;
    return s !== "approved" && s !== "pending";
  };

  return (
    <div className="flex flex-col gap-6">
      <ReadinessNote groupId={groupId} readiness={readiness} checking={checking} hasRules={rules.length > 0} locked={locked} />

      {!locked && (
        <Card>
          <CardHeader title="Add a rule" description="For partners, housemates or anyone who already swaps gifts." />
          {choosable.length < 2 ? (
            <p className="text-ink-700">Rules need at least two people in the group. Once people join, you can add them here.</p>
          ) : (
            <form onSubmit={onAdd} noValidate className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                <Field id="excl-a" label={oneWay ? "This person" : "First person"} error={fieldErrors.giverId}>
                  {(aria) => (
                    <Select {...aria} value={a} onChange={(e) => setA(e.target.value)}>
                      <option value="">Choose…</option>
                      {choosable.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.status === "pending" ? " (waiting for approval)" : ""}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <span aria-hidden className="hidden pt-11 text-center text-sm font-bold text-ink-500 sm:block">
                  {oneWay ? "shouldn’t give to" : "and"}
                </span>
                <Field id="excl-b" label={oneWay ? "Shouldn’t give a gift to" : "Second person"} error={fieldErrors.receiverId}>
                  {(aria) => (
                    <Select {...aria} value={b} onChange={(e) => setB(e.target.value)}>
                      <option value="">Choose…</option>
                      {choosable
                        .filter((p) => p.id !== a)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.status === "pending" ? " (waiting for approval)" : ""}
                          </option>
                        ))}
                    </Select>
                  )}
                </Field>
              </div>
              <details className="group" open={oneWay || undefined}>
                <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-pine-600 underline">More options</summary>
                <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-600">
                  <input
                    type="checkbox"
                    checked={oneWay}
                    onChange={(e) => setOneWay(e.target.checked)}
                    className="mt-1 size-5 shrink-0 accent-pine-800 focus-visible:outline-none"
                  />
                  <span>
                    <span className="block font-bold text-ink-900">One way only</span>
                    <span className="block text-sm text-ink-700">
                      The first person won’t give to the second, but the second can still draw the first.
                    </span>
                  </span>
                </label>
              </details>
              <Button type="submit" loading={busy === "add"} disabled={!!busy} className="w-full sm:w-auto sm:self-start">
                {oneWay ? "Add one-way rule" : "Keep them apart"}
              </Button>
            </form>
          )}
          {error && (
            <Alert tone="error" title="That rule wasn’t saved" className="mt-4">
              {error}
            </Alert>
          )}
        </Card>
      )}

      <Card tone="plain">
        <CardHeader title={`Rules (${rules.length})`} />
        {rules.length === 0 ? (
          <p className="rounded-xl bg-cream-100 px-4 py-6 text-center text-ink-700">
            No rules yet. Anyone can draw anyone, except themselves.
          </p>
        ) : (
          <ul>
            {rules.map((r) => {
              const key = `${r.a}|${r.b}`;
              const label = r.symmetric
                ? `${name(r.a)} and ${name(r.b)} won’t draw each other`
                : `${name(r.a)} won’t give a gift to ${name(r.b)}`;
              return (
                <li
                  key={key}
                  className="flex flex-col gap-3 border-t-2 border-pine-800/15 py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="min-w-0 text-ink-700">
                    <span className="font-bold text-ink">{name(r.a)}</span>{" "}
                    {r.symmetric ? "and" : <span className="whitespace-nowrap">won’t give to</span>}{" "}
                    <span className="font-bold text-ink">{name(r.b)}</span>
                    {r.symmetric ? " won’t draw each other" : ""}
                    {(inactive(r.a) || inactive(r.b)) && (
                      <span className="block text-sm text-ink-500">Someone here isn’t taking part, so this rule has no effect.</span>
                    )}
                  </p>
                  {!locked && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                      loading={busy === key}
                      disabled={!!busy}
                      onClick={() => mutate(key, "DELETE", { giverId: r.a, receiverId: r.b, symmetric: r.symmetric })}
                      aria-label={`Remove rule: ${label}`}
                    >
                      <X aria-hidden /> Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ReadinessNote({
  groupId,
  readiness,
  checking,
  hasRules,
  locked,
}: {
  groupId: string;
  readiness: DrawReadinessDTO;
  checking: boolean;
  hasRules: boolean;
  locked: boolean;
}) {
  if (locked)
    return (
      <Alert tone="info" title="Exclusions are locked">
        Names have been drawn with these rules. They can’t change any more.
      </Alert>
    );
  const impossible = readiness.issues.find((i) => i.code === "IMPOSSIBLE_EXCLUSIONS");
  const notEnough = readiness.issues.find((i) => i.code === "NOT_ENOUGH_PARTICIPANTS");
  return (
    <div aria-live="polite" aria-busy={checking}>
      {impossible ? (
        <Alert tone="error" title="These rules leave no fair drawing">
          We couldn’t find a valid drawing with the current exclusions. Please adjust your rules and try again. Removing one rule usually does it.
        </Alert>
      ) : notEnough ? (
        <Alert tone="info" title="Checked once three people are in">
          {notEnough.message} We’ll check that your rules still allow a fair drawing as people join.
        </Alert>
      ) : (
        <Alert tone="success" title={hasRules ? "A fair drawing is still possible" : "Anyone can draw anyone"}>
          {hasRules ? "Everyone can still be matched with these rules. " : ""}
          <Link href={`/o/${groupId}/draw`} className="inline-flex items-center gap-1 font-bold underline">
            Go to the draw <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Alert>
      )}
    </div>
  );
}
