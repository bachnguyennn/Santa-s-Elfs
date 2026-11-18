import "server-only";
import { env } from "@/server/env";
import { DemoEmailAlert } from "./demo-alert";

/** True when emails are simulated (local demo). Server components only. */
export function isEmailSimulated(): boolean {
  return env.emailMode === "simulate";
}

/** Subtle note shown in demo mode so testers can find their private links. Server component. */
export function DemoEmailNote({ className }: { className?: string }) {
  if (!isEmailSimulated()) return null;
  return <DemoEmailAlert className={className} />;
}
