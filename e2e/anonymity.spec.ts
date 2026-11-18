import { apiJson, createGroup, email, expect, joinApi, newPerson, readRevealedName, revealViaUi, test, waitForEmail } from "./helpers";
import type { Page } from "@playwright/test";

test.describe("F: reveal and anonymous messaging", () => {
  test("a giver reveals their recipient and messages them; the recipient only ever sees the alias", async ({ context, browser }) => {
    const group = await createGroup(context, { name: "Studio Seven Swap" });
    const names = ["Zebediah Quill", "Philippa Moss", "Anselm Grey"]; // 3 people: always a 3-cycle
    const people: { name: string; email: string; pid: string; page: Page }[] = [];
    for (const name of names) {
      const person = await newPerson(browser);
      const mail = email(name.split(" ")[0].toLowerCase());
      const res = await joinApi(person.context.request, group.inviteCode, name, mail);
      people.push({ name, email: mail, pid: res.participantId, page: person.page });
    }
    await apiJson(context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true });

    // Giver reveals with the animation, skips it, and reload shows the same person.
    const giver = people[0];
    const recipientName = await revealViaUi(giver.page, giver.pid);
    expect(names).toContain(recipientName);
    expect(recipientName).not.toBe(giver.name);
    const alias = (await giver.page.getByText("Your secret alias:").locator("span").first().textContent())!.trim();
    expect(alias.length).toBeGreaterThan(0);
    await giver.page.reload();
    expect(await readRevealedName(giver.page)).toBe(recipientName);

    // Giver sends an anonymous message.
    await giver.page.goto(`/p/${giver.pid}/messages?thread=recipient`);
    await expect(giver.page.getByText(`You appear as ${alias}`)).toBeVisible();
    await giver.page.getByLabel(`Message to ${recipientName}`).fill("Do you prefer dark or milk chocolate?");
    await giver.page.getByRole("button", { name: "Send message" }).click();
    await expect(giver.page.getByText("Do you prefer dark or milk chocolate?")).toBeVisible();

    // The recipient (who hasn't revealed their own card) reads it; record every response they receive.
    const recipient = people.find((p) => p.name === recipientName)!;
    const bodies: string[] = [];
    recipient.page.on("response", async (res) => {
      const type = res.headers()["content-type"] ?? "";
      if (/json|html|text|x-component/.test(type)) bodies.push(await res.text().catch(() => ""));
    });
    await recipient.page.goto(`/p/${recipient.pid}`);
    await recipient.page.goto(`/p/${recipient.pid}/messages?thread=santa`);
    await expect(recipient.page.getByRole("heading", { name: `${alias} — Your Secret Santa` })).toBeVisible();
    await expect(recipient.page.getByText("Do you prefer dark or milk chocolate?")).toBeVisible();
    await recipient.page.getByLabel(/your Secret Santa$/).fill("Dark, always!");
    await recipient.page.getByRole("button", { name: "Send message" }).click();
    await expect(recipient.page.getByText("Dark, always!")).toBeVisible();
    bodies.push(await recipient.page.content());
    bodies.push(JSON.stringify(await apiJson(recipient.page.context().request, "GET", `/api/p/${recipient.pid}/messages?thread=santa`)));
    bodies.push(JSON.stringify(await apiJson(recipient.page.context().request, "GET", `/api/p/${recipient.pid}`)));

    expect(bodies.length).toBeGreaterThan(3);
    const all = bodies.join("\n");
    expect(all).toContain(alias);
    for (const secret of [giver.name, giver.email, giver.pid]) expect(all, `recipient saw ${secret}`).not.toContain(secret);

    // The new-message email to the recipient names nobody either.
    const mail = await waitForEmail(context.request, recipient.email, /new message from your Secret Santa/);
    for (const secret of [giver.name, giver.email, alias, "Do you prefer"]) expect(mail.text + mail.html + mail.subject).not.toContain(secret);
  });
});
