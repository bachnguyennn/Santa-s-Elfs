import path from "node:path";
import type { Page } from "@playwright/test";
import { apiJson, createGroup, email, expect, joinApi, newPerson, revealApi, test } from "./helpers";

const AXE = path.join(process.cwd(), "node_modules/axe-core/axe.min.js");

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: string[] }[];
}

/** Run axe-core in the page; return serious/critical violations. */
async function seriousViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run(ctx: Document): Promise<{ violations: AxeViolation[] }> } }).axe;
    return (await axe.run(document)).violations;
  });
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.impact} ${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
}

test.describe("accessibility & responsive sanity", () => {
  test("main pages have no serious/critical axe violations at 375 and 1440 px", async ({ context, browser }) => {
    test.setTimeout(180_000);
    // A drawn group where the organizer takes part, has revealed, and has a message thread.
    const group = await createGroup(context, { name: "Accessible Elves", organizerParticipates: true, rules: "Handmade gifts welcome." });
    const orgPid = group.organizerParticipantId!;
    for (const name of ["Quentin Ash", "Rhea Lowe"]) {
      const person = await newPerson(browser);
      await joinApi(person.context.request, group.inviteCode, name, email(name.split(" ")[0].toLowerCase()));
      await person.context.close();
    }
    await apiJson(context.request, "PUT", `/api/p/${orgPid}/profile`, {
      about: "Tea, books and long walks.",
      interests: ["tea", "mystery novels"],
      wishlist: [{ name: "Loose-leaf tea sampler", url: "https://example.com/tea" }],
    });
    const preDraw = [`/o/${group.groupId}/draw`, `/o/${group.groupId}/exclusions`, `/p/${orgPid}/reveal`];
    const postDraw = [
      "/",
      "/new",
      `/j/${group.inviteCode}`,
      "/recover",
      "/expired",
      `/o/${group.groupId}`,
      `/o/${group.groupId}/settings`,
      `/o/${group.groupId}/emergency`,
      `/p/${orgPid}`,
      `/p/${orgPid}/profile`,
      `/p/${orgPid}/reveal`,
      `/p/${orgPid}/messages?thread=recipient`,
      `/p/${orgPid}/messages?thread=santa`,
    ];

    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" }); // scan settled states, not mid-animation frames
    const failures: string[] = [];
    const scan = async (paths: string[]) => {
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
        for (const p of paths) {
          const res = await page.goto(p);
          expect(res?.status(), p).toBeLessThan(400);
          await page.waitForLoadState("networkidle");
          for (const v of await seriousViolations(page)) failures.push(`[${width}px ${p}] ${v}`);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 0) failures.push(`[${width}px ${p}] horizontal overflow of ${overflow}px`);
        }
      }
    };

    await scan(preDraw);
    await apiJson(context.request, "POST", `/api/o/${group.groupId}/draw`, { confirm: true });
    await revealApi(context.request, orgPid);
    await apiJson(context.request, "POST", `/api/p/${orgPid}/messages`, { thread: "recipient", body: "Hello from your Santa!" });
    await scan(postDraw);
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
