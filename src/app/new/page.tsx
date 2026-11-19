import type { Metadata } from "next";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { SceneBanner } from "@/components/workshop/art";
import { WorkshopDesk } from "./workshop-desk";

export const metadata: Metadata = {
  title: "Start a group",
  description: "Set up a free Secret Santa for 3 to 20 people in a couple of minutes. No account needed.",
};

/** Inside the Workshop: group setup at the writing desk. */
export default function NewGroupPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 bg-parchment pb-16 outline-none">
        <SceneBanner name="writing-desk" position="62% 70%" className="h-[clamp(15rem,32vw,24rem)]">
          <div className="pb-12 lg:pb-24">
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] font-bold">Start a group</h1>
            <p className="mt-2 max-w-[32ch] text-lg text-buttercream/90">A couple of minutes at the desk. No account, and you can change everything later.</p>
          </div>
        </SceneBanner>
        <WorkshopDesk />
      </main>
      <SiteFooter />
    </>
  );
}
