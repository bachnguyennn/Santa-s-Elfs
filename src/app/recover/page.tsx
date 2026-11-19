import type { Metadata } from "next";
import { connection } from "next/server";
import { isEmailSimulated } from "@/components/participant/demo-note";
import { RecoverForm } from "@/components/participant/recover-form";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { SceneBanner } from "@/components/workshop/art";

export const metadata: Metadata = {
  title: "Recover your private link",
  description: "Lost your SantaElf link? We’ll email a fresh one to the address you signed up with.",
};

/** The Post Office counter: one email field. The answer never says whether an address exists. */
export default async function RecoverPage() {
  await connection(); // demo-mode check reads the runtime environment
  const demoMode = isEmailSimulated();

  return (
    <>
      <SkipLink />
      <SiteHeader action={<span />} />
      <main id="main" tabIndex={-1} className="flex-1 bg-parchment pb-16 outline-none">
        <SceneBanner name="post-office" position="80% 78%" className="h-[clamp(14rem,30vw,22rem)]">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] font-bold">Recover your private link</h1>
            <p className="mt-2 max-w-[44ch] text-lg text-buttercream/90">The Post Office emails a fresh link for every group you’re in, organizing or taking part.</p>
          </div>
        </SceneBanner>
        <div className="mx-auto w-full max-w-xl px-4 pt-8 sm:px-8 sm:pt-10">
          <div className="rounded-lg border border-paper-line bg-cream-50 p-6 shadow-[var(--shadow-paper)] sm:p-8">
            <RecoverForm demoMode={demoMode} />
          </div>
          <ul className="mt-8 space-y-3 text-[0.9375rem] leading-relaxed text-ink-700">
            <li>
              <strong className="text-ink">Only that inbox gets the link.</strong> We never show links on screen, so nobody can open your page by
              typing your email.
            </li>
            <li>
              <strong className="text-ink">Older links stop working</strong> once they expire, so use the newest email.
            </li>
            <li>
              <strong className="text-ink">Nothing arrived?</strong> Check spam, and make sure it’s the address you joined with.
            </li>
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
