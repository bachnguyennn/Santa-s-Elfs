"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";
  return (
    <StatusPage
      title="We couldn’t load this page"
      actions={
        <>
          <Button variant="primary" onClick={() => retry()}>
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back to the homepage</Link>
          </Button>
        </>
      }
    >
      <p>Something went wrong on our side. Give it another try; if it keeps happening, come back in a little while.</p>
      {digest && <p className="mt-3 text-sm text-ink-500">Reference: {digest}</p>}
    </StatusPage>
  );
}
