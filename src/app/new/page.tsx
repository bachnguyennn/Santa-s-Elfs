import type { Metadata } from "next";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/ui/page-shell";
import { WorkshopDoor } from "@/components/village/doors";
import { CreateGroupWizard } from "./create-group-wizard";

export const metadata: Metadata = {
  title: "Start a group",
  description: "Set up a free Secret Santa for 3 to 20 people in a couple of minutes. No account needed.",
};

/** Through the Workshop's green door: group setup on the workbench. */
export default function NewGroupPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 bg-[#F6EBD6] outline-none">
        <div className="relative border-b-[2.5px] border-midnight bg-[#EFDDBA]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-3 bg-timber" />
          <div className="mx-auto flex max-w-xl items-end gap-4 px-4 pt-8 pb-6 sm:gap-6 sm:px-6 sm:pt-10">
            <WorkshopDoor className="h-20 w-auto shrink-0 sm:h-24" />
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">Start a group</h1>
              <p className="mt-1 text-lg text-midnight-soft">A couple of minutes at the workbench, no account. You can change everything later.</p>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-10">
          <CreateGroupWizard />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
