import { apiJson, createGroup, email, expect, joinApi, newPerson, revealApi, test, waitForEmail } from "./helpers";
import type { APIRequestContext } from "@playwright/test";

test.describe("G: organizer emergency reveal", () => {
  test("wrong code fails; the emailed code reveals exactly that participant's real assignment", async ({ page, context, browser }) => {
    const group = await createGroup(context, { name: "Harbor Street Cousins" });
    const people: { name: string; pid: string; request: APIRequestContext }[] = [];
    for (const name of ["Imogen Vale", "Jasper Kwan", "Keziah Stone", "Lorcan Abbott"]) {
      const person = await newPerson(browser);
      const res = await joinApi(person.context.request, group.inviteCode, name, email(name.split(" ")[0].toLowerCase()));
      people.push({ name, pid: res.participantId, request: person.context.request });
    }
    await apiJson(context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true });
    const target = people[1];

    await page.goto(`/o/${group.groupId}/emergency`);
    await page.getByLabel("Whose match do you need?").selectOption({ label: target.name });
    await page.getByText("I understand, and I really need this").click();
    const challengeResponse = page.waitForResponse((r) => r.url().endsWith("/emergency/challenge") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Email me a code" }).click();
    const { challengeId } = (await (await challengeResponse).json()) as { challengeId: string };
    await expect(page.getByText(/We emailed a 6-digit code to o•••@example\.com/)).toBeVisible();

    const mail = await waitForEmail(context.request, group.input.organizerEmail, /emergency reveal code/);
    const code = mail.text.match(/\b(\d{6})\b/)![1];
    expect(mail.text + mail.html).not.toContain(target.name); // the code email names nobody

    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, "0");
    await page.getByLabel("6-digit code").fill(wrong);
    await page.getByRole("button", { name: "Show the match" }).click();
    await expect(page.getByText("Not revealed")).toBeVisible();
    await expect(page.getByText(/is giving a gift to/)).toHaveCount(0);

    await page.getByLabel("6-digit code").fill(code);
    await page.getByRole("button", { name: "Show the match" }).click();
    const result = page.getByText(/is giving a gift to/);
    await expect(result).toBeVisible();

    const actual = await revealApi(target.request, target.pid);
    await expect(result).toHaveText(`${target.name} is giving a gift to ${actual.recipient.name}`);

    // Single use: the same code can't be replayed.
    const replay = await apiJson<{ error: { code: string } }>(context.request, "POST", `/api/o/${group.groupId}/emergency/reveal`, { challengeId, code }, 403);
    expect(replay.error.code).toBe("CHALLENGE_FAILED");
  });
});
