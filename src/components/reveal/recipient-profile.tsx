import { ExternalLink, Gift } from "lucide-react";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { RecipientViewDTO } from "@/lib/contracts";

/** Only http(s) links become anchors (the API validates too; this is belt and braces). */
function safeLink(url: string | null): { href: string; host: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return { href: u.toString(), host: u.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

/** The recipient's Santa profile, as their Santa sees it. Plain text only. */
export function RecipientProfile({ view }: { view: RecipientViewDTO }) {
  const { name, profile } = view.recipient;
  const empty = !profile.about && profile.interests.length === 0 && profile.wishlist.length === 0 && !profile.dislikes && !profile.notes;

  return (
    <Card className="sm:p-8">
      <h2 className="font-display text-2xl leading-tight font-bold tracking-normal break-words text-pine-900">What {name} would love</h2>
      {empty ? (
        <p className="mt-3 rounded-xl bg-cream-100 px-4 py-5 text-ink-700">
          {name} hasn’t filled in a wishlist yet. Check back closer to the exchange, or ask them a question below. They won’t know it’s you.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <Section title="Gift ideas">
            {profile.wishlist.length === 0 ? (
              <Empty>No gift ideas yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.wishlist.map((item) => {
                  const link = safeLink(item.url);
                  return (
                    <li key={item.id} className="flex gap-3 rounded-xl border border-line bg-white px-4 py-3">
                      <Gift className="mt-1 size-5 shrink-0 text-berry-600" aria-hidden />
                      <div className="min-w-0">
                        <p className="font-bold break-words text-ink-900">{item.name}</p>
                        {item.description && <p className="mt-0.5 text-sm whitespace-pre-wrap text-ink-700 [overflow-wrap:anywhere]">{item.description}</p>}
                        {link && (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold break-all text-pine-600 underline"
                          >
                            View on {link.host}
                            <ExternalLink className="size-4 shrink-0" aria-hidden />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="About them">
            {profile.about ? <Prose>{profile.about}</Prose> : <Empty>Nothing written yet.</Empty>}
          </Section>

          <Section title="Interests">
            {profile.interests.length === 0 ? (
              <Empty>No interests listed yet.</Empty>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {profile.interests.map((t) => (
                  <li key={t} className="rounded-full border border-pine-200 bg-pine-100 px-3 py-1 text-sm font-bold break-all text-pine-900">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Please don’t get them">
            {profile.dislikes ? <Prose>{profile.dislikes}</Prose> : <Empty>Nothing to avoid, as far as we know.</Empty>}
          </Section>

          {profile.notes && (
            <Section title="Other notes">
              <Prose>{profile.notes}</Prose>
            </Section>
          )}
        </div>
      )}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-lg font-bold tracking-normal text-pine-900">{title}</h3>
      {children}
    </section>
  );
}

function Prose({ children }: { children: string }) {
  return <p className="max-w-[65ch] whitespace-pre-wrap text-ink-900 [overflow-wrap:anywhere]">{children}</p>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-500">{children}</p>;
}
