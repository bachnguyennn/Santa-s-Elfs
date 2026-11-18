import { apiJson, createGroup, drawViaUi, email, expect, joinApi, newPerson, revealApi, revealViaUi, test } from "./helpers";
import type { Page } from "@playwright/test";

async function addRule(page: Page, first: string, second: string) {
  await page.getByLabel("First person", { exact: true }).selectOption({ label: first });
  await page.getByLabel("Second person", { exact: true }).selectOption({ label: second });
  await page.getByRole("button", { name: "Keep them apart" }).click();
  await expect(page.getByRole("button", { name: new RegExp(`Remove rule: .*${first}.*${second}|Remove rule: .*${second}.*${first}`) })).toBeVisible();
}

test.describe("exclusions", () => {
  test("C: a symmetric exclusion is respected by the drawing", async ({ page, context, browser }) => {
    const group = await createGroup(context, { name: "Garcia Household" });
    const names = ["Lucia Garcia", "Mateo Garcia", "Sofia Ruiz", "Tomas Ruiz"];
    const people: Record<string, { pid: string; page: Page }> = {};
    for (const name of names) {
      const person = await newPerson(browser);
      const res = await joinApi(person.context.request, group.inviteCode, name, email(name.split(" ")[0].toLowerCase()));
      people[name] = { pid: res.participantId, page: person.page };
    }

    await page.goto(`/o/${group.groupId}/exclusions`);
    await addRule(page, "Lucia Garcia", "Mateo Garcia");
    await expect(page.getByText("Rules (1)")).toBeVisible();
    await expect(page.getByText("A fair drawing is still possible")).toBeVisible();
    await drawViaUi(page, group.groupId);

    // Each partner reveals in their own browser: neither drew the other.
    const lucia = await revealViaUi(people["Lucia Garcia"].page, people["Lucia Garcia"].pid);
    const mateo = await revealViaUi(people["Mateo Garcia"].page, people["Mateo Garcia"].pid);
    expect(lucia).not.toBe("Mateo Garcia");
    expect(mateo).not.toBe("Lucia Garcia");
    // Everyone else's reveal completes a valid derangement.
    const mapping: Record<string, string> = { "Lucia Garcia": lucia, "Mateo Garcia": mateo };
    for (const name of ["Sofia Ruiz", "Tomas Ruiz"]) {
      mapping[name] = (await revealApi(people[name].page.context().request, people[name].pid)).recipient.name;
    }
    expect(new Set(Object.values(mapping)).size).toBe(4);
    for (const [g, r] of Object.entries(mapping)) expect(r).not.toBe(g);
  });

  test("D: impossible exclusions block the drawing", async ({ page, context, browser }) => {
    const group = await createGroup(context, { name: "Tiny Trio" });
    for (const name of ["Ada Park", "Ben Park", "Cy Park"]) {
      const person = await newPerson(browser);
      await joinApi(person.context.request, group.inviteCode, name, email(name.split(" ")[0].toLowerCase()));
      await person.context.close();
    }

    await page.goto(`/o/${group.groupId}/exclusions`);
    await expect(page.getByText("Anyone can draw anyone", { exact: true })).toBeVisible();
    // With three people every drawing is a 3-cycle, so keeping one pair apart (both ways) is impossible.
    await addRule(page, "Ada Park", "Ben Park");
    await expect(page.getByText("These rules leave no fair drawing")).toBeVisible();

    await page.goto(`/o/${group.groupId}/draw`);
    await expect(page.getByText("We couldn’t find a valid drawing with the current exclusions. Please adjust your rules and try again.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Adjust exclusions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Draw Secret Santa Names" })).toBeDisabled();

    // The server refuses too, and nothing was drawn.
    const res = await apiJson<{ error: { code: string } }>(context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true }, 422);
    expect(res.error.code).toBe("IMPOSSIBLE_EXCLUSIONS");
    await page.reload();
    await expect(page.getByRole("button", { name: "Draw Secret Santa Names" })).toBeDisabled();
  });
});
