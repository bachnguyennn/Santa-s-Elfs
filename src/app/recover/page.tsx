import type { Metadata } from "next";
import { connection } from "next/server";
import { Elf } from "@/components/brand/elf";
import { isEmailSimulated } from "@/components/participant/demo-note";
import { RecoverForm } from "@/components/participant/recover-form";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "Get your private link again",
  description: "Lost your SantaElf link? We’ll email a fresh one to the address you signed up with.",
};

export default async function RecoverPage() {
  await connection(); // demo-mode check reads the runtime environment
  const demoMode = isEmailSimulated();

  return (
    <PageShell width="narrow">
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-pine-900 [text-wrap:balance]">
            Lost your link? The elves will send it again.
          </h1>
        </div>
        <Elf pose="wave" className="hidden h-28 shrink-0 sm:block" />
      </div>
      <p className="mt-4 text-lg leading-relaxed text-ink-700">
        SantaElf has no passwords. Your private link is your key. Enter the email you used and we’ll send a fresh link for every
        group you’re in, whether you organize it or take part.
      </p>

      <Card className="mt-8">
        <RecoverForm demoMode={demoMode} />
      </Card>

      <ul className="mt-8 space-y-3 text-sm leading-relaxed text-ink-700">
        <li>
          <strong className="text-ink-900">Only that inbox gets the link.</strong> We never show links on screen, so nobody can
          open your page by typing your email.
        </li>
        <li>
          <strong className="text-ink-900">Older links stop working</strong> once they expire, so use the newest email.
        </li>
        <li>
          <strong className="text-ink-900">Nothing arrived?</strong> Check spam, and make sure it’s the address you joined with.
        </li>
      </ul>
    </PageShell>
  );
}
