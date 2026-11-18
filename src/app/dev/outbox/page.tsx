import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/server/db";
import { env } from "@/server/env";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Simulated outbox", robots: { index: false } };

interface OutboxRow {
  id: string;
  to_email: string;
  subject: string;
  html: string;
  text: string;
  created_at: string | Date;
}

/** Local demo only: emails "sent" in simulate mode, so testers can follow private links. */
export default async function OutboxPage() {
  await connection();
  if (!env.devOutboxAvailable) notFound();
  const db = await getDb();
  const emails = await db.query<OutboxRow>(
    `select id, to_email, subject, html, text, created_at from dev_outbox order by created_at desc limit 50`,
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-pine-900">Simulated outbox</h1>
      <Alert tone="warning" title="Simulated email — nothing was actually sent" className="mt-4">
        SantaElf is running in local demo mode. Every email the app would have sent appears here instead (latest 50). Private links work
        — copy them from the text version.
      </Alert>

      {emails.length === 0 ? (
        <p className="mt-8 text-ink-700">No emails yet. Create a group or join one to see them appear here.</p>
      ) : (
        <ol className="mt-8 space-y-6">
          {emails.map((e) => (
            <li key={e.id}>
              <Card className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold">Simulated</Badge>
                  <time className="text-sm text-ink-500" dateTime={new Date(e.created_at).toISOString()}>
                    {new Date(e.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-ink-900 break-words">{e.subject}</h2>
                <p className="text-sm text-ink-700 break-all">To: {e.to_email}</p>
                <iframe
                  title={`Email preview: ${e.subject}`}
                  sandbox=""
                  srcDoc={e.html}
                  className="mt-4 h-[520px] w-full rounded-xl border border-line bg-white"
                />
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-pine-800">Plain-text version (copy links from here)</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all rounded-xl bg-cream-100 p-3 text-sm text-ink-900">{e.text}</pre>
                </details>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
