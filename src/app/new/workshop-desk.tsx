"use client";

import * as React from "react";
import { DoorArrival } from "@/components/workshop/door-entry";
import { Invitation } from "@/components/workshop/invitation";
import { CreateGroupWizard } from "./create-group-wizard";

/**
 * The Workshop desk: the four-step form and the invitation it writes. When the visitor came through
 * the door, the doorway plays first; when it opens, the invitation slides onto the desk and the
 * group-name field takes focus. Direct visits, reloads, Back and reduced motion start here directly.
 */
export function WorkshopDesk() {
  const [draft, setDraft] = React.useState({ name: "", organizerName: "", step: 0 });
  const [arriveKey, setArriveKey] = React.useState(0);

  const onOpened = React.useCallback((how: "played" | "skipped" | "direct") => {
    if (how === "direct") return;
    setArriveKey(Date.now());
    requestAnimationFrame(() => document.getElementById("name")?.focus({ preventScroll: true }));
  }, []);

  return (
    <>
      <DoorArrival onOpened={onOpened} />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-8 lg:grid-cols-[minmax(0,35rem)_minmax(0,1fr)] lg:gap-14">
        {/* Phones: the invitation first, small, so the mirrored name stays in view while typing. */}
        <Invitation name={draft.name} arriveKey={arriveKey} settleKey={draft.step} compact className="relative z-10 -mt-10 lg:hidden" />
        <div className="relative lg:-mt-24">
          <CreateGroupWizard onDraft={setDraft} />
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-8 z-10 -mt-28">
            <Invitation name={draft.name} organizer={draft.organizerName} arriveKey={arriveKey} settleKey={draft.step} className="max-w-sm" />
          </div>
        </div>
      </div>
    </>
  );
}
