import type { Metadata } from "next";
import { PageShell } from "@/components/ui/page-shell";
import { CreateGroupWizard } from "./create-group-wizard";

export const metadata: Metadata = {
  title: "Start a group",
  description: "Set up a free Secret Santa for 3 to 20 people in a couple of minutes. No account needed.",
};

export default function NewGroupPage() {
  return (
    <PageShell width="narrow">
      <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900">
        Start a group
      </h1>
      <p className="mt-2 text-lg text-ink-700">A couple of minutes, no account. You can change everything later.</p>
      <CreateGroupWizard />
    </PageShell>
  );
}
