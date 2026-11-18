import { request as playwrightRequest } from "@playwright/test";
import { apiJson, createGroup, email, expect, joinApi, nextIp, test } from "./helpers";
import type { OrganizerParticipantDTO } from "../src/lib/contracts";

const FIRST = ["Ava", "Ben", "Chloe", "Diego", "Emma", "Farah", "Gus", "Hiro", "Isla", "Jonah", "Kemi", "Liam", "Maya", "Nico", "Omar", "Paige", "Quinn", "Rosa", "Sven", "Tara", "Uma"];

test.describe("B: twenty people with organizer approval", () => {
  test("21 requests → organizer approves 20 (some in the dashboard UI) → the 21st can't be approved", async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);
    const group = await createGroup(context, { name: "Northwind Office Party", requiresApproval: true });

    // 21 distinct people request to join, each from their own simulated client IP.
    const joined: { pid: string; name: string }[] = [];
    for (const [i, first] of FIRST.entries()) {
      const req = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
      const name = `${first} Example${i + 1}`;
      const res = await joinApi(req, group.inviteCode, name, email(first.toLowerCase()));
      expect(res.status).toBe("pending");
      joined.push({ pid: res.participantId, name });
      await req.dispose();
    }

    // The first 5 are approved by clicking in the dashboard.
    await page.goto(`/o/${group.groupId}`);
    await expect(page.getByText("Waiting for you (21)")).toBeVisible();
    for (const p of joined.slice(0, 5)) {
      const row = page.getByRole("listitem").filter({ hasText: p.name });
      await row.getByRole("button", { name: "Approve" }).click();
      await expect(page.getByText(`${p.name} is in. We emailed them.`)).toBeVisible();
    }

    // The next 14 via the organizer API (same browser session), for speed: 19 approved.
    for (const p of joined.slice(5, 19)) {
      const dto = await apiJson<OrganizerParticipantDTO>(context.request, "PATCH", `/api/o/${group.groupId}/participants/${p.pid}`, { action: "approve" });
      expect(dto.status).toBe("approved");
    }

    // Two dashboard tabs open at 19/20: approve #20 in one, then try #21 from the stale other tab.
    await page.reload();
    await expect(page.getByText("Taking part (19 of 20)")).toBeVisible();
    const stale = await context.newPage();
    await stale.goto(`/o/${group.groupId}`);
    await expect(stale.getByText("Waiting for you (2)")).toBeVisible();

    const twentieth = joined[19];
    await page.getByRole("listitem").filter({ hasText: twentieth.name }).getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(`${twentieth.name} is in. We emailed them.`)).toBeVisible();
    await expect(page.getByText("Taking part (20 of 20)")).toBeVisible();

    const last = joined[20];
    await stale.getByRole("listitem").filter({ hasText: last.name }).getByRole("button", { name: "Approve" }).click();
    await expect(stale.getByText("The group is full (20 of 20). Decline or remove someone before approving another request.")).toBeVisible();

    // A fresh dashboard shows the group as full with approval disabled; the API refuses too.
    await page.reload();
    await expect(page.getByText("The group is full. Decline a request or remove someone to make room.")).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: last.name }).getByRole("button", { name: "Approve" })).toBeDisabled();
    const res = await apiJson<{ error: { code: string } }>(context.request, "PATCH", `/api/o/${group.groupId}/participants/${last.pid}`, { action: "approve" }, 409);
    expect(res.error.code).toBe("GROUP_FULL");
  });
});
