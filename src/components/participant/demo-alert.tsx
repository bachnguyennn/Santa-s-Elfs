import Link from "next/link";
import { Alert } from "@/components/ui/alert";

/** Demo-mode note (no env check; client-safe). Render only when the server said emails are simulated. */
export function DemoEmailAlert({ className }: { className?: string }) {
  return (
    <Alert tone="warning" title="Demo mode: emails are simulated" className={className}>
      Nothing is actually sent. Open the{" "}
      <Link href="/dev/outbox" className="font-bold underline">
        simulated outbox
      </Link>{" "}
      to find the private links.
    </Alert>
  );
}
