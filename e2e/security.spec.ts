import { apiJson, createGroup, email, expect, joinApi, newPerson, privateLink, revealViaUi, test, waitForEmail } from "./helpers";

test.describe("security controls in the running app", () => {
  test("headers, cookie flags, CSRF, link exchange, and no CSP violations on real pages", async ({ page, context, browser, baseURL }) => {
    const cspErrors: string[] = [];
    page.on("console", (m) => {
      if (/Content Security Policy|Refused to/i.test(m.text())) cspErrors.push(m.text());
    });

    const group = await createGroup(context, { name: "Header Check Group", organizerParticipates: true });
    const friend = await newPerson(browser);
    const friendEmail = email("quinn");
    const joined = await joinApi(friend.context.request, group.inviteCode, "Quinn Harper", friendEmail);
    await joinApi((await newPerson(browser)).context.request, group.inviteCode, "Remy Fox", email("remy"));

    // Security headers on a private page.
    const res = await page.goto(`/o/${group.groupId}`);
    const h = res!.headers();
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("no-referrer");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["cache-control"]).toContain("no-store");
    expect(h["x-robots-tag"]).toContain("noindex");

    // Capability cookies: httpOnly, SameSite=Lax, Secure (production build), scoped per role.
    const cookies = await context.cookies();
    const org = cookies.find((c) => c.name === `se_o_${group.groupId}`)!;
    expect(org).toMatchObject({ httpOnly: true, sameSite: "Lax", secure: true });
    expect(await page.evaluate(() => document.cookie)).toBe("");

    // Cross-site and origin-less mutations are refused even with valid cookies.
    for (const origin of ["https://evil.example", "null"]) {
      const r = await context.request.post(`/api/o/${group.groupId}/close`, { headers: { origin } });
      expect(r.status()).toBe(403);
    }
    expect((await context.request.post(`/api/o/${group.groupId}/close`)).status()).toBe(403);

    // A participant's cookie never opens another participant's or the organizer's API.
    const other = await friend.context.request.get(`/api/p/${group.organizerParticipantId}`);
    expect(other.status()).toBe(401);
    expect((await friend.context.request.get(`/api/o/${group.groupId}`)).status()).toBe(401);
    // An invite code is not a credential.
    expect((await page.goto(`/a/${group.inviteCode}`))!.url()).toContain("/expired");

    // Emailed link: exchanged for a cookie, then redirected to a token-free URL.
    const welcome = await waitForEmail(context.request, friendEmail, /You've joined/);
    const link = privateLink(welcome);
    const fresh = await newPerson(browser);
    await fresh.page.goto(link);
    await expect(fresh.page).toHaveURL(new RegExp(`/p/${joined.participantId}$`));
    expect(fresh.page.url()).not.toContain(link.split("/a/")[1]);

    // Real pages under the CSP: draw, reveal (client JS), outbox (srcdoc iframes).
    await apiJson(context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true });
    await revealViaUi(page, group.organizerParticipantId!);
    await page.goto("/dev/outbox");
    await expect(page.locator("iframe").first()).toBeVisible();
    await page.goto("/new");
    await page.getByLabel("Group name").fill("CSP smoke");
    expect(cspErrors).toEqual([]);

    // Positive control: the policy is enforced (a third-party script is refused and reported).
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.src = "https://cdn.evil.example/x.js";
      document.head.appendChild(s);
    });
    await expect.poll(() => cspErrors.length).toBeGreaterThan(0);
    expect(baseURL).toBeTruthy();
  });
});
