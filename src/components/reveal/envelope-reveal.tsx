"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Envelope } from "@/components/village/envelope";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import type { RecipientViewDTO } from "@/lib/contracts";
import { RecipientProfile } from "./recipient-profile";

/**
 * The participant's envelope, wired to POST /api/p/[pid]/reveal. The server already holds the
 * assignment; the seal only asks for it, once. A returning participant (`initialView`) reads the open
 * letter immediately. The recipient's name enters the page only with the authorized answer.
 */
export function EnvelopeReveal({
  participantId,
  participantName,
  initialView,
}: {
  participantId: string;
  participantName: string;
  initialView: RecipientViewDTO | null;
}) {
  const [view, setView] = React.useState<RecipientViewDTO | null>(initialView);
  const base = `/p/${participantId}`;

  return (
    <Envelope
      participantName={participantName}
      initial={initialView ? { recipientName: initialView.recipient.name, alias: initialView.myAlias } : null}
      requestLetter={async () => {
        const v = await apiFetch<RecipientViewDTO>(`/api/p/${participantId}/reveal`, { method: "POST" });
        setView(v);
        return { recipientName: v.recipient.name, alias: v.myAlias };
      }}
      errorMessage={(err) => {
        const e = err instanceof ApiRequestError ? err : null;
        if (e?.code === "NOT_DRAWN") return "The elves haven’t drawn names yet. You’ll get an email as soon as they do.";
        if (e?.code === "UNAUTHORIZED") return "This private link has expired. Get a new one from the “Recover my link” page.";
        return e?.message ?? "We couldn’t reach the elves. Check your connection, then press the seal again.";
      }}
    >
      {() =>
        view && (
          <div className="mx-auto mt-10 max-w-2xl">
            <RecipientProfile view={view} />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-auto w-full py-3 text-center whitespace-normal sm:w-auto">
                <Link href={`${base}/messages?thread=recipient`}>
                  <MessageCircle aria-hidden /> Ask {view.recipient.name} an anonymous question
                </Link>
              </Button>
              <Link href={base} className="inline-flex min-h-11 items-center justify-center px-2 font-bold text-evergreen underline decoration-2 underline-offset-4">
                Back to your village
              </Link>
            </div>
          </div>
        )
      }
    </Envelope>
  );
}
