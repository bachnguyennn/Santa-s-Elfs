import { createGroup, email, expect, joinApi, test } from "./helpers";

test("the frosted window is reachable at each size and reveals its scene with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const glass = page.getByRole("button", { name: "Peek through the frosted Workshop window" });
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await glass.click();
    await expect(glass).toHaveAttribute("aria-pressed", "true");
    await expect(glass.getByRole("status")).toContainText("skis");
    await glass.press("Space");
    await expect(glass).toHaveAttribute("aria-pressed", "false");
  }
});

test("invite copy and the workbench lamp follow real action states", async ({ context, page }) => {
  const group = await createGroup(context, { organizerParticipates: true });
  await page.goto(`/o/${group.groupId}`);
  await expect(page.locator(".workbench-lamp")).toHaveCount(0);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy Invite link", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied Invite link", exact: true })).toBeVisible();
  const copiedCorrectly = await page.evaluate(async (value) => (await navigator.clipboard.readText()) === value, group.inviteUrl);
  expect(copiedCorrectly).toBe(true);
  await joinApi(context.request, group.inviteCode, "Rowan", email("motion-rowan"));
  await joinApi(context.request, group.inviteCode, "Lee", email("motion-lee"));
  await page.reload();
  await expect(page.getByRole("link", { name: "Draw names", exact: true }).filter({ has: page.locator("svg.lucide-lamp-desk") }).first()).toHaveClass(/workbench-lamp/);
});

test("@mobile arrows carry the elf to every house and back without leaving the village", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const nav = page.getByRole("group", { name: "Explore village houses" });
  const next = nav.getByRole("button", { name: "Next house" });
  const previous = nav.getByRole("button", { name: "Previous house" });
  const guide = page.locator(".village-guide");
  await expect(previous).toBeDisabled();
  const elfPosition = () => guide.evaluate((el) => (el as HTMLElement).offsetLeft);
  const start = await elfPosition();
  await next.click();
  await expect(nav).toContainText("Post Office");
  await expect.poll(elfPosition).toBeGreaterThan(start);
  const middle = await elfPosition();
  await next.click();
  await expect(nav).toContainText("Gift House");
  await expect(next).toBeDisabled();
  await expect.poll(elfPosition).toBeGreaterThan(middle);
  await previous.click();
  await previous.click();
  await expect(nav).toContainText("Workshop");
  await expect(previous).toBeDisabled();
  await expect.poll(elfPosition).toBe(start);
});
