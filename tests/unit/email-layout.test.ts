import { describe, expect, it } from "vitest";
import { renderEmail } from "@/server/email/render";
import { assignmentReady, emergencyCode, participantWelcome } from "@/server/email/templates/emails";

const LINK = "https://santa.test/a/abc123";

describe("Workshop email layout", () => {
  it("uses buttercream paper, oxblood heading and button, ink body text, and no images", async () => {
    const { html } = await renderEmail(participantWelcome({ groupName: "Office Elves", link: LINK, pending: false }));
    expect(html).toMatch(/background-color:#fff0cc/i);
    expect(html).toMatch(/<h1[^>]*color:#430c15/i);
    expect(html).toMatch(/<a[^>]*background-color:#430c15[^>]*color:#fff0cc/i);
    expect(html).toMatch(/color:#301c22/i);
    expect(html).not.toMatch(/<img/i);
  });

  it("keeps the plain-text version, the pasteable link and the private-link warning", async () => {
    const { text } = await renderEmail(participantWelcome({ groupName: "Office Elves", link: LINK, pending: false }));
    expect(text).toContain("You're in!");
    expect(text).toContain(`Or paste this link into your browser: ${LINK}`);
    expect(text).toContain("This link opens your private page. Please don't forward this email.");
  });

  it("assignment notification carries the link but never a name", async () => {
    const { subject, html, text } = await renderEmail(assignmentReady({ link: LINK }));
    for (const part of [subject, html, text]) expect(part).not.toMatch(/Office Elves|Alice|Bertram/);
    expect(text).toContain(LINK);
  });

  it("emails without a private link leave out the warning", async () => {
    const { text } = await renderEmail(emergencyCode({ groupName: "Office Elves", code: "123456" }));
    expect(text).not.toContain("This link opens your private page");
    expect(text).toContain("123456");
  });
});
