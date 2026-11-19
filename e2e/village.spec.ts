import { apiJson, createGroup, email, expect, joinApi, newPerson, readRevealedName, revealApi, revealViaUi, test } from "./helpers";
import type { Page } from "@playwright/test";

/** Three people in a drawn group; returns their participant ids and pages (each with its own cookie). */
async function drawnGroup(context: Parameters<typeof createGroup>[0], browser: import("@playwright/test").Browser, name: string) {
  const group = await createGroup(context, { name });
  const people: { name: string; pid: string; page: Page }[] = [];
  for (const n of ["Ines Kowalczyk", "Theo Marchetti", "Ruth Adeyemi"]) {
    const person = await newPerson(browser);
    const res = await joinApi(person.context.request, group.inviteCode, n, email(n.split(" ")[0].toLowerCase()));
    people.push({ name: n, pid: res.participantId, page: person.page });
  }
  await apiJson(context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true });
  return { group, people };
}

test.describe("Village journeys", () => {
  test("an organizer starts a group from the square and reaches the draw controls in the Workshop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start a group" }).first().click();
    await page.waitForURL(/\/new$/);
    await page.getByLabel("Group name").fill("Lantern Lane Swap");
    await page.getByLabel("Your name").fill("Mira Okafor");
    await page.getByLabel("Your email").fill(email("mira"));
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Create group" }).click();
    await page.waitForURL(/\/o\/[0-9a-f-]{36}\?created=1/);
    const groupId = new URL(page.url()).pathname.split("/")[2];
    await expect(page.getByRole("link", { name: "Workbench" })).toHaveAttribute("aria-current", "page");

    // Three people join, so the workbench offers the draw.
    const invite = await page.getByLabel("Invite link").first().inputValue();
    for (const n of ["Ada", "Bo", "Cy"]) {
      const person = await newPerson(page.context().browser()!);
      await joinApi(person.context.request, invite.split("/j/")[1], n, email(n.toLowerCase()));
    }
    await page.goto(`/o/${groupId}`);
    await page.getByRole("link", { name: "Draw names", exact: true }).first().click();
    await page.waitForURL(new RegExp(`/o/${groupId}/draw$`));
    await expect(page.getByRole("button", { name: "Draw Secret Santa Names" })).toBeVisible();
    // Destructive tools stay out of the way until asked for, and the emergency reveal is locked before the draw.
    await expect(page.getByRole("link", { name: "Emergency reveal" })).toHaveCount(0);
  });

  test("@mobile a participant enters the Post Office, keeps a draft per mail slot, and Back returns to the same doorstep", async ({ context, browser }) => {
    const { people } = await drawnGroup(context, browser, "Doorstep Street");
    const me = people[0];
    await revealApi(me.page.context().request, me.pid); // the recipient slot opens once the envelope is opened

    for (const width of [375, 1440]) {
      await me.page.setViewportSize({ width, height: width < 600 ? 812 : 900 });
      await me.page.goto(`/p/${me.pid}`);
      // Phones use the large sign links under the panning street; wider screens use the painted building.
      const door =
        width < 768
          ? me.page.getByRole("navigation", { name: "Village stops" }).getByRole("link", { name: /Post Office/ })
          : me.page.locator("#post-office");
      await door.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await door.hover(); // settles any scroll the tap itself would cause, so we measure where the tap happens
      await me.page.waitForTimeout(200);
      const doorstep = await me.page.evaluate(() => Math.round(window.scrollY));
      expect(doorstep).toBeGreaterThan(0);

      await door.click();
      await me.page.waitForURL(new RegExp(`/p/${me.pid}/messages`));
      await expect(me.page.getByRole("heading", { level: 1, name: "Post Office" })).toBeVisible();
      // The slot-to-cabinet hand-off is decorative and short: it never lingers over the room.
      await expect(me.page.locator("[data-room-entrance]")).toHaveCount(0);

      // Each mail slot keeps its own draft.
      const box = me.page.locator("#message-body");
      await box.fill(`Draft for my person at ${width}px`);
      await me.page.getByRole("tab", { name: /From your Santa/ }).click();
      await me.page.waitForURL(/thread=santa/);
      await expect(box).toHaveValue("");
      await me.page.getByRole("tab", { name: /^To / }).click();
      await me.page.waitForURL(/thread=recipient/);
      await expect(box).toHaveValue(`Draft for my person at ${width}px`);

      // Slot switches replace history, so one Back returns to the village, on the same doorstep.
      await me.page.goBack();
      await me.page.waitForURL(new RegExp(`/p/${me.pid}$`));
      await expect.poll(() => me.page.evaluate(() => Math.round(window.scrollY))).toBe(doorstep);
    }

    // Reduced motion: the room simply appears, with no hand-off layer at all.
    await me.page.emulateMedia({ reducedMotion: "reduce" });
    await me.page.locator("#post-office").click();
    expect(await me.page.locator("[data-room-entrance]").count()).toBe(0);
    await me.page.waitForURL(new RegExp(`/p/${me.pid}/messages`));
    await expect(me.page.locator("[data-room-entrance]")).toHaveCount(0);
  });

  test("@mobile only the participant can open their envelope, and returning shows the same recipient", async ({ context, browser }) => {
    const { people } = await drawnGroup(context, browser, "Envelope Row");
    const me = people[1];

    // Sealed: the recipient's name is nowhere in the page.
    await me.page.goto(`/p/${me.pid}/reveal`);
    const others = people.filter((p) => p !== me).map((p) => p.name);
    const sealed = await me.page.content();
    for (const n of others) expect(sealed).not.toContain(n);

    const name = await revealViaUi(me.page, me.pid);
    expect(others).toContain(name);
    await expect(me.page.getByRole("heading", { name: /^You’re the Secret Santa for/ })).toBeFocused();

    // Returning: the letter is already open, with the same name, and the seal is gone.
    await me.page.reload();
    expect(await readRevealedName(me.page)).toBe(name);
    await expect(me.page.getByRole("button", { name: "Open my envelope" })).toHaveCount(0);
    await me.page.goto(`/p/${me.pid}`);
    await expect(me.page.getByText(`You’re the Secret Santa for ${name}.`)).toBeVisible();

    // Someone without this participant's private link can't open it.
    const stranger = await newPerson(browser);
    await stranger.page.goto(`/p/${me.pid}/reveal`);
    expect(await stranger.page.content()).not.toContain(name);
    const res = await stranger.context.request.post(`/api/p/${me.pid}/reveal`, { data: {}, headers: { origin: new URL(me.page.url()).origin } });
    expect(res.status()).toBe(401);
  });

  test("Start a group opens the Workshop door, Skip lands on the form, and the name writes the invitation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start a group" }).first().click();
    await page.waitForURL(/\/new$/);
    const skip = page.getByRole("button", { name: "Skip to form" });
    await expect(skip).toBeFocused();
    await skip.click();
    await expect(skip).toHaveCount(0);
    const field = page.getByLabel("Group name");
    await expect(field).toBeFocused();
    await field.fill("Lantern Lane Swap");
    await expect(page.getByText("Lantern Lane Swap", { exact: true }).filter({ visible: true })).toBeVisible();

    // Direct visits and reloads open straight at the desk: no doorway.
    await page.reload();
    await expect(page.getByLabel("Group name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip to form" })).toHaveCount(0);
  });

  test("with reduced motion the door never plays", async ({ browser }) => {
    const person = await newPerson(browser, { reducedMotion: "reduce" });
    await person.page.goto("/");
    await person.page.getByRole("link", { name: "Start a group" }).first().click();
    await person.page.waitForURL(/\/new$/);
    await expect(person.page.getByLabel("Group name")).toBeVisible();
    await expect(person.page.getByRole("button", { name: "Skip to form" })).toHaveCount(0);
  });

  test("@mobile a pending send stays with its own mail slot, and a failed send keeps the letter", async ({ context, browser }) => {
    const { people } = await drawnGroup(context, browser, "Pending Post");
    const me = people[2];
    await revealApi(me.page.context().request, me.pid);
    await me.page.goto(`/p/${me.pid}/messages?thread=recipient`);
    const box = me.page.locator("#message-body");

    // Slow the real send so we can switch slots while it is pending.
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    await me.page.route("**/api/p/*/messages", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await gate;
      await route.continue();
    });
    await box.fill("Is green still your colour?");
    await me.page.getByRole("button", { name: "Send letter" }).click();
    await me.page.getByRole("tab", { name: /From your Santa/ }).click();
    await box.fill("Thank you, Santa!");
    release();
    await me.page.waitForTimeout(800);
    // The santa slot is untouched: its draft and no stray feedback.
    await expect(box).toHaveValue("Thank you, Santa!");
    await expect(me.page.getByText(/^Sent, signed/)).toHaveCount(0);
    await me.page.getByRole("tab", { name: /^To / }).click();
    await expect(me.page.getByText("Is green still your colour?")).toBeVisible();
    await expect(me.page.getByText(/^Sent, signed/)).toBeVisible();
    await expect(box).toHaveValue("");

    // A failed send keeps the letter and shows the error in this slot only.
    await me.page.unroute("**/api/p/*/messages");
    await me.page.route("**/api/p/*/messages", (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
    await box.fill("This one will not send");
    await me.page.getByRole("button", { name: "Send letter" }).click();
    await expect(me.page.locator("#message-error")).toBeVisible();
    await expect(box).toHaveValue("This one will not send");
    await me.page.getByRole("tab", { name: /From your Santa/ }).click();
    await expect(me.page.locator("#message-error")).toHaveCount(0);
    await expect(box).toHaveValue("Thank you, Santa!");
  });
});
