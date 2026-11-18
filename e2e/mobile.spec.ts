import { apiJson, createGroup, email, expect, joinViaUi, newPerson, privateLink, revealViaUi, test, waitForEmail } from "./helpers";

test.describe("phone flow", () => {
  test("@mobile join from the invite link and reveal on a phone", async ({ page, context, browser }) => {
    // The organizer and two friends (separate contexts); the phone user is `page`.
    const organizer = await newPerson(browser);
    const group = await createGroup(organizer.context, { name: "Climbing Crew" });
    const friends = await Promise.all([newPerson(browser), newPerson(browser)]);
    await joinViaUi(friends[0].page, group.inviteCode, "Noor Haddad", email("noor"));
    await joinViaUi(friends[1].page, group.inviteCode, "Otto Weiss", email("otto"));

    const myEmail = email("pia");
    const pid = await joinViaUi(page, group.inviteUrl, "Pia Lindqvist", myEmail);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // No horizontal scroll on the phone viewport.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await apiJson(organizer.context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true });

    // Open the emailed link like on a phone that lost the join cookie.
    await context.clearCookies();
    const mail = await waitForEmail(page.request, myEmail, /picked your Secret Santa recipient/);
    await page.goto(privateLink(mail));
    await expect(page).toHaveURL(new RegExp(`/p/${pid}$`));
    const name = await revealViaUi(page, pid);
    expect(["Noor Haddad", "Otto Weiss"]).toContain(name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
