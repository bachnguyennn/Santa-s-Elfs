import {
  apiJson,
  drawViaUi,
  email,
  expect,
  expectDerangement,
  joinViaUi,
  newPerson,
  revealViaUi,
  test,
} from "./helpers";
import type { ThreadDTO } from "../src/lib/contracts";

test.describe("A: three friends complete a normal exchange", () => {
  test("create wizard → two friends join → draw → everyone reveals → message round-trip", async ({ page, browser }) => {
    const organizer = { name: "Hannah Brooks", email: email("hannah") };
    const friends = [
      { name: "Marcus Lee", email: email("marcus") },
      { name: "Priya Shah", email: email("priya") },
    ];

    // Organizer creates the group through the wizard and takes part.
    await page.goto("/new");
    await page.getByLabel("Group name").fill("Book Club Gift Swap");
    await page.getByLabel("Your name").fill(organizer.name);
    await page.getByLabel("Your email").fill(organizer.email);
    await page.getByText("I’m taking part in the exchange too").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Minimum").fill("15");
    await page.getByLabel("Maximum").fill("30");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("When I press the button")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Book Club Gift Swap")).toBeVisible();
    await page.getByRole("button", { name: "Create group" }).click();
    await page.waitForURL(/\/o\/[0-9a-f-]{36}\?created=1/);
    const groupId = new URL(page.url()).pathname.split("/")[2];
    const inviteUrl = await page.getByLabel("Invite link").first().inputValue();
    expect(inviteUrl).toMatch(/\/j\/[A-Za-z0-9_-]{16,}$/);

    // Two friends join from their own browsers.
    const people = [];
    for (const f of friends) {
      const person = await newPerson(browser);
      const pid = await joinViaUi(person.page, inviteUrl, f.name, f.email);
      people.push({ ...f, ...person, pid });
    }

    // Organizer sees everyone and draws.
    await page.goto(`/o/${groupId}`);
    await expect(page.getByText("Taking part (3 of 20)")).toBeVisible();
    await drawViaUi(page, groupId);

    // Organizer opens their own card from the draw page.
    await page.getByRole("link", { name: "Open your own card" }).click();
    await page.waitForURL(/\/p\/[0-9a-f-]{36}\/reveal/);
    const orgPid = new URL(page.url()).pathname.split("/")[2];
    const mapping: Record<string, string> = { [organizer.name]: await revealViaUi(page, orgPid) };
    for (const p of people) mapping[p.name] = await revealViaUi(p.page, p.pid);
    expectDerangement(mapping, [organizer.name, ...friends.map((f) => f.name)]);

    // Message round-trip: Marcus writes to his recipient anonymously; they reply.
    const marcus = people[0];
    const recipientName = mapping[marcus.name];
    await marcus.page.getByRole("link", { name: `Ask ${recipientName} an anonymous question` }).click();
    await marcus.page.waitForURL(/messages\?thread=recipient/);
    await marcus.page.getByLabel(`Message to ${recipientName}`).fill("Hi! What's your favourite kind of tea?");
    await marcus.page.getByRole("button", { name: "Send message" }).click();
    await expect(marcus.page.getByText("Hi! What's your favourite kind of tea?")).toBeVisible();

    const recipient = recipientName === organizer.name ? { page, pid: orgPid } : people.find((p) => p.name === recipientName)!;
    await recipient.page.goto(`/p/${recipient.pid}/messages?thread=santa`);
    await expect(recipient.page.getByText("Hi! What's your favourite kind of tea?")).toBeVisible();
    await expect(recipient.page.getByRole("heading", { name: /— Your Secret Santa$/ })).toBeVisible();
    await expect(recipient.page.getByRole("main")).not.toContainText(marcus.name);
    await recipient.page.getByLabel(/your Secret Santa$/).fill("Earl Grey, please!");
    await recipient.page.getByRole("button", { name: "Send message" }).click();
    await expect(recipient.page.getByText("Earl Grey, please!")).toBeVisible();

    await marcus.page.reload();
    await expect(marcus.page.getByText("Earl Grey, please!")).toBeVisible();
    const thread = await apiJson<ThreadDTO>(marcus.context.request, "GET", `/api/p/${marcus.pid}/messages?thread=recipient`);
    expect(thread.messages.map((m) => [m.fromMe, m.body])).toEqual([
      [true, "Hi! What's your favourite kind of tea?"],
      [false, "Earl Grey, please!"],
    ]);
    for (const p of people) await p.context.close();
  });
});
