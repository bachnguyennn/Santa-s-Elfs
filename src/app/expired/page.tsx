import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

export const metadata: Metadata = {
  title: "Link expired",
  robots: { index: false, follow: false },
};

export default async function ExpiredPage({ searchParams }: PageProps<"/expired">) {
  const { reason } = await searchParams;
  const rateLimited = reason === "rate";

  return (
    <StatusPage
      title={rateLimited ? "Too many tries for now" : "This private link has expired or isn’t valid"}
      actions={
        <>
          <Button asChild variant="primary">
            <Link href="/recover">Email me a new link</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back to SantaElf</Link>
          </Button>
        </>
      }
    >
      {rateLimited ? (
        <p>The elves paused this link for a few minutes to keep your group safe. Wait a little, then open it again.</p>
      ) : (
        <>
          <p>Private links stop working after a while, or once a newer link has replaced them.</p>
          <p className="mt-3">
            Enter the email address you joined with and we’ll send a new link there. Only that address can receive it.
          </p>
        </>
      )}
    </StatusPage>
  );
}
