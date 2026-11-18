import { expect, test as base, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { CreateGroupInput, CreateGroupResult, JoinResult, RecipientViewDTO } from "../src/lib/contracts";

/**
 * E2E helpers. The server runs with TRUSTED_IP_HEADER=x-forwarded-for, so each
 * simulated person gets their own client IP (and rate-limit bucket) through
 * that header. Private links come from the simulated outbox (/dev/outbox) or
 * from the cookie the server sets at create/join time.
 */

export const CRON_AUTH = { Authorization: "Bearer e2e-cron-secret" };

let ipCounter = 0;
const RUN = Date.now().toString(36);
/** A fresh simulated client IP (unique within this test run). */
export function nextIp(): string {
  ipCounter++;
  return `10.${(process.pid % 250) + 1}.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

/** Unique, realistic email for this run. */
export function email(local: string): string {
  return `${local}.${RUN}@example.com`;
}

/** `test` whose default page/context gets its own simulated client IP. */
export const test = base.extend({
  // (Playwright's fixture callback is conventionally named `use`; renamed so the React hooks lint rule doesn't misfire.)
  extraHTTPHeaders: async ({}, provide) => {
    await provide({ "x-forwarded-for": nextIp() });
  },
});
export { expect };

/** A separate person: own browser context (own cookies) and own client IP. */
export async function newPerson(browser: Browser, options: Parameters<Browser["newContext"]>[0] = {}): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ ...options, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const page = await context.newPage();
  return { context, page };
}

function origin(baseURL: string | undefined): string {
  return new URL(baseURL ?? "http://localhost:3100").origin;
}

/** JSON API call with the same-origin header the server requires for mutations. */
export async function apiJson<T>(
  req: APIRequestContext,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
  expectedStatus = 200,
): Promise<T> {
  const res = await req.fetch(path, { method, data, headers: { origin: origin(test.info().project.use.baseURL) } });
  const body = await res.text();
  expect(res.status(), `${method} ${path} -> ${body.slice(0, 300)}`).toBe(expectedStatus);
  return JSON.parse(body) as T;
}

/** "YYYY-MM-DDTHH:mm" in UTC, `minutes` from now (rounded up to the next minute). */
export function utcLocalIn(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60_000);
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  return d.toISOString().slice(0, 16);
}

let groupCounter = 0;
export function groupInput(overrides: Partial<CreateGroupInput> = {}): CreateGroupInput {
  return {
    name: "Miller Family Christmas",
    organizerName: "Olivia Miller",
    organizerEmail: email(`olivia${++groupCounter}`), // creation is limited to 5 groups/day per organizer email
    organizerParticipates: false,
    budgetMin: 20,
    budgetMax: 40,
    currency: "USD",
    drawMethod: "manual",
    timezone: "UTC",
    requiresApproval: false,
    ...overrides,
  };
}

/** Organizer creates a group through the API in their own context (sets organizer cookie). */
export async function createGroup(context: BrowserContext, overrides: Partial<CreateGroupInput> = {}) {
  const input = groupInput(overrides);
  const res = await apiJson<CreateGroupResult>(context.request, "POST", "/api/groups", input);
  return { ...res, input, inviteCode: res.inviteUrl.split("/j/")[1] };
}

/** Join through the API from the given context (its cookie jar gets the participant cookie). */
export async function joinApi(req: APIRequestContext, inviteCode: string, name: string, mail: string, expectedStatus = 200) {
  return apiJson<JoinResult>(req, "POST", `/api/join/${inviteCode}`, { name, email: mail }, expectedStatus);
}

/** A person (own context + IP) joins via the invite page UI. Returns their participant id. */
export async function joinViaUi(page: Page, inviteUrlOrCode: string, name: string, mail: string): Promise<string> {
  const path = inviteUrlOrCode.includes("/j/") ? new URL(inviteUrlOrCode).pathname : `/j/${inviteUrlOrCode}`;
  await page.goto(path);
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page.getByLabel("Your email", { exact: true }).fill(mail);
  await page.getByRole("button", { name: /Join the exchange|Ask to join/ }).click();
  await page.waitForURL(/\/p\/[0-9a-f-]{36}/);
  return new URL(page.url()).pathname.split("/")[2];
}

/** Run the cron tick (scheduled draws + email queue). */
export async function cronTick(req: APIRequestContext) {
  const res = await req.get("/api/cron/tick", { headers: CRON_AUTH });
  expect(res.status()).toBe(200);
  const body = await res.json();
  for (const step of ["draws", "emails", "purged", "rateLimits"]) {
    expect(body[step], `cron step ${step}`).toBeDefined();
    expect(body[step], `cron step ${step}`).not.toHaveProperty("error");
  }
  return body as { draws: { drawn: number; failed: number }; emails: { sent: number } };
}

export interface OutboxEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** All emails in the simulated outbox (latest 50, newest first). */
export async function readOutbox(req: APIRequestContext): Promise<OutboxEmail[]> {
  const res = await req.get("/dev/outbox");
  expect(res.status()).toBe(200);
  const page = await res.text();
  const emails: OutboxEmail[] = [];
  const unescape = (s: string) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  for (const li of page.split("<li>").slice(1)) {
    const subject = li.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "";
    const to = li.match(/>To: (?:<!-- -->)?([^<]+)</)?.[1] ?? "";
    const text = li.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)?.[1] ?? "";
    const html = li.match(/srcDoc="([^"]*)"/i)?.[1] ?? "";
    emails.push({ to: unescape(to).trim(), subject: unescape(subject), text: unescape(text), html: unescape(html) });
  }
  return emails;
}

/** Wait until an email matching `to` + `subject` exists (nudging the queue), return the newest. */
export async function waitForEmail(req: APIRequestContext, to: string, subject: RegExp): Promise<OutboxEmail> {
  let found: OutboxEmail | undefined;
  await expect
    .poll(
      async () => {
        found = (await readOutbox(req)).find((e) => e.to === to.toLowerCase() && subject.test(e.subject));
        if (!found) await cronTick(req);
        return Boolean(found);
      },
      { timeout: 20_000, message: `email to ${to} matching ${subject}` },
    )
    .toBe(true);
  return found!;
}

/** First private link (/a/<token>) in an email. */
export function privateLink(e: OutboxEmail): string {
  const m = e.text.match(/https?:\/\/[^\s)\]]+\/a\/[A-Za-z0-9_-]+/);
  expect(m, `private link in "${e.subject}"`).toBeTruthy();
  return new URL(m![0]).pathname;
}

/** Reveal via the API (idempotent): the giver's own recipient view. */
export async function revealApi(req: APIRequestContext, participantId: string) {
  return apiJson<RecipientViewDTO>(req, "POST", `/api/p/${participantId}/reveal`, {});
}

/** Organizer draws names via the draw page UI. */
export async function drawViaUi(page: Page, groupId: string) {
  await page.goto(`/o/${groupId}/draw`);
  await page.getByRole("button", { name: "Draw Secret Santa Names" }).click();
  await page.getByRole("button", { name: "Yes, draw names" }).click();
  await expect(page.getByRole("heading", { name: "What happens now" })).toBeVisible();
}

/** Giver reveals their card in the UI (skipping the animation); returns the recipient name shown. */
export async function revealViaUi(page: Page, participantId: string): Promise<string> {
  await page.goto(`/p/${participantId}/reveal`);
  await page.getByRole("button", { name: "Reveal My Person" }).click();
  // The shuffle lasts at least 2.6 s (no reduced motion in these browsers), so Skip is always offered.
  await expect(page.getByRole("heading", { name: "The elves are shuffling…" })).toBeVisible();
  await page.getByRole("button", { name: "Skip animation" }).click();
  return readRevealedName(page);
}

export async function readRevealedName(page: Page): Promise<string> {
  const slip = page.getByText("This is the name").locator("span.font-bold");
  await expect(slip).toBeVisible();
  return (await slip.textContent())!.trim();
}

/** Assert a mapping giver -> recipient is a derangement of the given people. */
export function expectDerangement(mapping: Record<string, string>, people: string[]) {
  expect(Object.keys(mapping).sort()).toEqual([...people].sort());
  expect(Object.values(mapping).sort()).toEqual([...people].sort());
  for (const [giver, recipient] of Object.entries(mapping)) expect(recipient, `${giver} drew themself`).not.toBe(giver);
}
