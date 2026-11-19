"use client";

import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { INTERESTS_MAX, WISHLIST_MAX_ITEMS, profileSchema, type ProfileDTO, type ProfileInput } from "@/lib/contracts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { TagInput } from "./tag-input";

interface Item {
  key: string;
  name: string;
  description: string;
  url: string;
}
interface State {
  about: string;
  interests: string[];
  dislikes: string;
  notes: string;
  wishlist: Item[];
}

let keySeq = 0;
/** Keys for rows added in the browser (server rows use their ids, so SSR and hydration agree). */
const nextKey = () => `new-${++keySeq}`;

function fromDTO(p: ProfileDTO): State {
  return {
    about: p.about ?? "",
    interests: p.interests,
    dislikes: p.dislikes ?? "",
    notes: p.notes ?? "",
    wishlist: p.wishlist.map((w) => ({ key: w.id, name: w.name, description: w.description ?? "", url: w.url ?? "" })),
  };
}

function toInput(s: State): ProfileInput {
  return {
    about: s.about,
    interests: s.interests,
    dislikes: s.dislikes,
    notes: s.notes,
    wishlist: s.wishlist.map((w) => ({ name: w.name, description: w.description, url: w.url.trim() })),
  };
}

const snapshot = (s: State) => JSON.stringify(toInput(s));

/** Santa profile + wishlist editor. PUT /api/p/[pid]/profile with the whole profile. */
export function ProfileEditor({ participantId, initial, readOnly = false }: { participantId: string; initial: ProfileDTO; readOnly?: boolean }) {
  const [state, setState] = React.useState<State>(() => fromDTO(initial));
  const [saved, setSaved] = React.useState(() => snapshot(fromDTO(initial)));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  /** Bumps on each successful save so the elf nods once per save. */
  const [savedCount, setSavedCount] = React.useState(0);
  const [formError, setFormError] = React.useState<string>();
  const [justSaved, setJustSaved] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const dirty = snapshot(state) !== saved;

  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update(patch: Partial<State>) {
    setState((s) => ({ ...s, ...patch }));
    setJustSaved(false);
  }
  function updateItem(key: string, patch: Partial<Item>, errorKey?: string) {
    setState((s) => ({ ...s, wishlist: s.wishlist.map((w) => (w.key === key ? { ...w, ...patch } : w)) }));
    if (errorKey && errors[errorKey]) setErrors((e) => ({ ...e, [errorKey]: "" }));
    setJustSaved(false);
  }
  function moveItem(index: number, dir: -1 | 1) {
    setState((s) => {
      const list = [...s.wishlist];
      const [it] = list.splice(index, 1);
      list.splice(index + dir, 0, it);
      return { ...s, wishlist: list };
    });
    setErrors({});
    setJustSaved(false);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[data-move="${index + dir}-${dir < 0 ? "up" : "down"}"]`)?.focus());
  }
  function removeItem(index: number) {
    setState((s) => ({ ...s, wishlist: s.wishlist.filter((_, i) => i !== index) }));
    setErrors({});
    setJustSaved(false);
  }
  function addItem() {
    setState((s) => ({ ...s, wishlist: [...s.wishlist, { key: nextKey(), name: "", description: "", url: "" }] }));
    setJustSaved(false);
    requestAnimationFrame(() => {
      const inputs = formRef.current?.querySelectorAll<HTMLInputElement>('[data-item-name="true"]');
      inputs?.[inputs.length - 1]?.focus();
    });
  }

  function focusError(errs: Record<string, string>) {
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setFormError(undefined);
    // Drop completely empty wishlist rows instead of failing on them.
    const cleaned: State = { ...state, wishlist: state.wishlist.filter((w) => w.name.trim() || w.description.trim() || w.url.trim()) };
    setState(cleaned);
    const parsed = profileSchema.safeParse(toInput(cleaned));
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[issue.path.join(".")] ??= issue.message;
      setErrors(errs);
      requestAnimationFrame(() => focusError(errs));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const res = await apiFetch<ProfileDTO>(`/api/p/${participantId}/profile`, { method: "PUT", body: parsed.data });
      const next = fromDTO(res);
      setState(next);
      setSaved(snapshot(next));
      setJustSaved(true);
      setSavedCount((n) => n + 1);
    } catch (err) {
      if (err instanceof ApiRequestError && Object.keys(err.fields).length) {
        setErrors(err.fields);
        requestAnimationFrame(() => focusError(err.fields));
      } else if (err instanceof ApiRequestError && err.code === "UNAUTHORIZED") {
        setFormError("Your session has expired. Open the private link from your email again, then save.");
      } else {
        setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  const disabled = readOnly || pending;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6 pb-28">
      <Card>
        <CardHeader title="About you" description="A few words to help your Santa. Only the person who draws you sees this." />
        <div className="space-y-5">
          <Field id="about" label="About me" optional error={errors.about}>
            {(aria) => (
              <Textarea
                {...aria}
                data-field="about"
                maxLength={1000}
                readOnly={readOnly}
                placeholder="I love cozy evenings, board games and anything with cardamom."
                value={state.about}
                onChange={(e) => update({ about: e.target.value })}
              />
            )}
          </Field>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="interests" className="text-[0.9375rem] font-bold text-ink-900">
              Interests <span className="font-normal text-ink-500">(optional)</span>
            </label>
            {!readOnly && (
              <p id="interests-hint" className="text-sm text-ink-500">
                Type one and press Enter or a comma. Up to {INTERESTS_MAX}.
              </p>
            )}
            {readOnly ? (
              <p className="text-ink-700">{state.interests.length ? state.interests.join(", ") : "None added"}</p>
            ) : (
              <TagInput
                id="interests"
                describedBy="interests-hint"
                value={state.interests}
                max={INTERESTS_MAX}
                placeholder="e.g. hiking, tea, sci-fi"
                onChange={(interests) => update({ interests })}
              />
            )}
            {errors.interests && <p className="text-sm font-bold text-berry-700">{errors.interests}</p>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Wishlist"
          description={`Gift ideas, with links if you have them. ${state.wishlist.length} of ${WISHLIST_MAX_ITEMS}.`}
        />
        {state.wishlist.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-ink-500">
            No ideas yet. Even one or two make your Santa’s life easier.
          </p>
        ) : (
          <ol className="space-y-4">
            {state.wishlist.map((item, i) => {
              const base = `wishlist.${i}`;
              return (
                <li key={item.key} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-hand text-lg font-bold text-berry-600" aria-hidden>
                      {i + 1}.
                    </p>
                    {!readOnly && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-3"
                          data-move={`${i}-up`}
                          disabled={i === 0 || disabled}
                          onClick={() => moveItem(i, -1)}
                          aria-label={`Move idea ${i + 1} up`}
                        >
                          <ArrowUp aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-3"
                          data-move={`${i}-down`}
                          disabled={i === state.wishlist.length - 1 || disabled}
                          onClick={() => moveItem(i, 1)}
                          aria-label={`Move idea ${i + 1} down`}
                        >
                          <ArrowDown aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-3 text-berry-700"
                          disabled={disabled}
                          onClick={() => removeItem(i)}
                          aria-label={`Remove idea ${i + 1}${item.name ? `: ${item.name}` : ""}`}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 grid gap-4">
                    <Field id={`wl-${item.key}-name`} label={`Idea ${i + 1}`} error={errors[`${base}.name`]}>
                      {(aria) => (
                        <Input
                          {...aria}
                          data-field={`${base}.name`}
                          data-item-name="true"
                          maxLength={120}
                          readOnly={readOnly}
                          placeholder="A green wool scarf"
                          value={item.name}
                          onChange={(e) => updateItem(item.key, { name: e.target.value }, `${base}.name`)}
                        />
                      )}
                    </Field>
                    <Field id={`wl-${item.key}-desc`} label="Details" optional error={errors[`${base}.description`]}>
                      {(aria) => (
                        <Input
                          {...aria}
                          data-field={`${base}.description`}
                          maxLength={500}
                          readOnly={readOnly}
                          placeholder="Size, colour, any brand you like"
                          value={item.description}
                          onChange={(e) => updateItem(item.key, { description: e.target.value }, `${base}.description`)}
                        />
                      )}
                    </Field>
                    <Field id={`wl-${item.key}-url`} label="Link" optional error={errors[`${base}.url`]}>
                      {(aria) => (
                        <Input
                          {...aria}
                          data-field={`${base}.url`}
                          type="url"
                          inputMode="url"
                          maxLength={2048}
                          readOnly={readOnly}
                          placeholder="https://"
                          value={item.url}
                          onChange={(e) => updateItem(item.key, { url: e.target.value }, `${base}.url`)}
                        />
                      )}
                    </Field>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {!readOnly && (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full sm:w-auto"
            onClick={addItem}
            disabled={state.wishlist.length >= WISHLIST_MAX_ITEMS || disabled}
          >
            <Plus aria-hidden /> {state.wishlist.length >= WISHLIST_MAX_ITEMS ? `That’s ${WISHLIST_MAX_ITEMS}, the most you can add` : "Add a gift idea"}
          </Button>
        )}
      </Card>

      <Card>
        <CardHeader title="Good to know" />
        <div className="space-y-5">
          <Field id="dislikes" label="Things I don’t want" optional hint="Allergies, things you already have, no-gos." error={errors.dislikes}>
            {(aria) => (
              <Textarea
                {...aria}
                data-field="dislikes"
                maxLength={1000}
                readOnly={readOnly}
                value={state.dislikes}
                onChange={(e) => update({ dislikes: e.target.value })}
              />
            )}
          </Field>
          <Field id="notes" label="Additional notes" optional error={errors.notes}>
            {(aria) => (
              <Textarea
                {...aria}
                data-field="notes"
                maxLength={1000}
                readOnly={readOnly}
                value={state.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            )}
          </Field>
        </div>
      </Card>

      {readOnly && formError && <Alert tone="error">{formError}</Alert>}

      {!readOnly && (
        <div className="sticky bottom-0 z-10 -mx-4 border-t-[2.5px] border-midnight bg-paper px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:rounded-xl sm:border-[2.5px] sm:px-5 sm:shadow-[var(--shadow-paper)]">
          {/* A failed save keeps everything typed; the reason sits right beside the action. */}
          {formError && (
            <p role="alert" className="mb-3 rounded-xl border-2 border-cranberry-deep bg-berry-100 px-3 py-2 text-sm font-bold text-cranberry-deep">
              {formError}
            </p>
          )}
          <div className="flex items-center justify-between gap-4">
            <p role="status" className="flex min-w-0 items-center gap-2 text-sm">
              {justSaved && !dirty ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-evergreen">
                  <NoddingElf key={savedCount} />
                  <Check className="size-4" aria-hidden /> Saved
                </span>
              ) : dirty ? (
                <span className="font-bold text-gold-700">Unsaved changes</span>
              ) : (
                <span className="text-ink-500">All changes saved</span>
              )}
            </p>
            <Button type="submit" variant="primary" loading={pending} disabled={!dirty && !pending}>
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

/** The Gift House elf nods once when the wishlist is saved. Decorative; the "Saved" text carries the meaning. */
function NoddingElf() {
  return (
    <svg viewBox="0 0 40 40" className="size-8 origin-bottom motion-safe:animate-[elf-nod_700ms_var(--ease-out-quint)_1]" aria-hidden focusable="false">
      <path d="M9 22c-4-1-7-4-9-6 1 6 4 10 9 11zM31 22c4-1 7-4 9-6-1 6-4 10-9 11z" fill="#F2C6A0" stroke="#172D38" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={20} cy={24} r={12} fill="#F2C6A0" stroke="#172D38" strokeWidth={1.5} />
      <path d="M15.5 23.5q1.5-1.6 3 0M21.5 23.5q1.5-1.6 3 0" fill="none" stroke="#172D38" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M16.5 28.5q3.5 3 7 0" fill="none" stroke="#172D38" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M8 17c1-8 9-14 18-14 4 0 8 1 9 4-5 1-8 4-8 8z" fill="#175541" stroke="#172D38" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M7 15.5c9-2.5 18-2.5 26 0V19c-8-2.5-17-2.5-26 0z" fill="#B52F46" stroke="#172D38" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
