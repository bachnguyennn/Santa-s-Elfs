import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      title="The elves can’t find this page"
      actions={
        <>
          <Button asChild variant="primary">
            <Link href="/">Back to the Village Square</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/recover">Recover my link</Link>
          </Button>
        </>
      }
    >
      <p>
        The address may have a typo, or the group may have been deleted. If you were opening your private link, ask for a
        new one and we’ll email it to you.
      </p>
    </StatusPage>
  );
}
