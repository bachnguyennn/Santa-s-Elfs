import { randomBytes, randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { request, type APIRequestContext } from "@playwright/test";
import { emailSchema, type CreateGroupResult, type JoinResult, type OrganizerDashboardDTO, type ParticipantHomeDTO, type ProfileDTO, type RecipientViewDTO, type ThreadDTO } from "../../src/lib/contracts";

// Fixed messages only: HTTP errors and assertion dumps can expose private data.
export class CheckFailure extends Error {}
function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new CheckFailure(message);
}

export function deploymentOrigin(value: string | undefined): string {
  let url: URL;
  try { url = new URL(value ?? ""); } catch { throw new CheckFailure("Set SANTAELF_URL to the deployed website URL."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  check(url.protocol === "https:" || (local && url.protocol === "http:"), "Use HTTPS for a remote deployment.");
  check(!url.username && !url.password && !url.search && !url.hash && url.pathname === "/", "SANTAELF_URL must be a website origin without credentials, a path or query.");
  return url.origin;
}

export function rehearsalEmails(value: string | undefined): string[] {
  const emails = (value ?? "").split(",").map((v) => emailSchema.safeParse(v));
  check(emails.length === 3 && emails.every((v) => v.success), "Set SANTAELF_TEST_EMAILS to three comma-separated test inboxes you control.");
  const result = emails.map((v) => v.data!);
  check(new Set(result).size === 3, "Use three distinct test email addresses.");
  return result;
}

export async function json<T>(client: APIRequestContext, method: string, path: string, data?: unknown): Promise<T> {
  const res = await client.fetch(path, { method, data });
  check(res.status() === 200, `An application request failed (HTTP ${res.status()}); check the server logs.`);
  return await res.json() as T;
}

export async function smoke(origin: string, log: (message: string) => void) {
  const client = await request.newContext({ baseURL: origin, timeout: 20_000, maxRedirects: 0 });
  try {
    for (const path of ["/", "/new", "/recover"]) {
      const res = await client.get(path);
      check(res.status() === 200, "A public page is unavailable or deployment protection is blocking the check.");
      check(res.headers()["content-type"]?.includes("text/html"), "A public page did not return HTML.");
      check(Boolean(res.headers()["content-security-policy"]), "A public page is missing its Content-Security-Policy.");
    }
    log("PASS: public pages and security headers");
    check((await client.get("/dev/outbox")).status() === 404, "The development outbox must be disabled on a deployed app.");
    log("PASS: development outbox is disabled");
    check((await client.get("/api/cron/tick")).status() === 401, "Cron must reject requests without a secret; configure CRON_SECRET if it returns 503.");
    log("PASS: cron requires authentication");
    // A valid but nonexistent invite code reaches the public database lookup.
    const invite = await client.get(`/j/${randomBytes(12).toString("base64url")}`);
    check(invite.status() === 404, `The database-backed invite lookup returned HTTP ${invite.status()} instead of 404; check database connectivity and migrations.`);
    for (const role of ["o", "p"]) {
      check((await client.get(`/api/${role}/${randomUUID()}`)).status() === 401, "Private API access failed its database/authentication check.");
    }
    log("PASS: database-backed invite lookup and anonymous API isolation");
  } finally { await client.dispose(); }
}

interface SentEmail {
  id: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event: string;
  html?: string | null;
  text?: string | null;
}

async function resend<T>(key: string, path: string): Promise<T> {
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${key}`, "User-Agent": "SantaElf-deployment-check" },
    signal: AbortSignal.timeout(20_000), redirect: "error",
  });
  check(res.ok, `Resend read access failed (HTTP ${res.status}); the rehearsal key needs permission to list and retrieve sent emails.`);
  return await res.json() as T;
}

async function until<T>(work: () => Promise<T | undefined>, timeout: number, message: string, signal?: AbortSignal): Promise<T> {
  const end = Date.now() + timeout;
  while (true) {
    signal?.throwIfAborted();
    const result = await work();
    if (result !== undefined) return result;
    check(Date.now() < end, message);
    await sleep(Math.min(10_000, end - Date.now()), undefined, { signal });
  }
}

export async function deliveredEmail(key: string, to: string, subject: string, since: number, signal?: AbortSignal): Promise<SentEmail> {
  return until(async () => {
    let after = "";
    for (let page = 0; page < 10; page++) {
      const list = await resend<{ data: SentEmail[]; has_more: boolean }>(key, `/emails?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`);
      const match = list.data.find((mail) => mail.to.some((address) => address.toLowerCase() === to) && mail.subject === subject && Date.parse(mail.created_at) >= since);
      if (match) {
        check(!["bounced", "failed", "complained", "suppressed"].includes(match.last_event), "A rehearsal email bounced, failed, was suppressed or received a complaint.");
        if (["delivered", "opened", "clicked"].includes(match.last_event)) {
          // Pace provider reads independently of the app's sending worker.
          await sleep(600, undefined, { signal });
          return resend<SentEmail>(key, `/emails/${encodeURIComponent(match.id)}`);
        }
        return undefined;
      }
      const last = list.data.at(-1);
      if (!list.has_more || !last || Date.parse(last.created_at) < since) break;
      after = last.id;
      await sleep(600, undefined, { signal });
    }
    return undefined;
  }, 180_000, "Timed out waiting for Resend delivery; inspect the test inboxes and provider dashboard.", signal);
}

export function emailLink(mail: Pick<SentEmail, "text" | "html">, origin: string): string {
  const value = `${mail.text ?? ""}\n${mail.html ?? ""}`.match(/https?:\/\/[^\s<>"')]+\/a\/[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/)?.[0];
  check(value, "An email did not contain a private access link.");
  const url = new URL(value);
  check(url.origin === origin && !url.username && !url.password && !url.search && !url.hash, "An email link targets the wrong website; check APP_URL.");
  check(/^\/a\/[A-Za-z0-9_-]{43}$/.test(url.pathname), "An email contained an invalid private link.");
  return url.pathname;
}

async function openPrivateLink(client: APIRequestContext, mail: SentEmail, origin: string, expectedPath: string) {
  const res = await client.get(emailLink(mail, origin));
  check(res.status() === 303, "A private link did not exchange for a session.");
  check(new URL(res.headers().location, origin).href === `${origin}${expectedPath}`, "A private link opened the wrong page or expired.");
  const page = await client.get(expectedPath);
  check(page.status() === 200, "The page reached through a private link did not load.");
}

export interface RehearsalOptions {
  origin: string;
  emails: string[];
  resendKey: string;
  log: (message: string) => void;
  signal?: AbortSignal;
}

export async function rehearse({ origin, emails, resendKey, log, signal }: RehearsalOptions) {
  check(emails.length === 3 && Boolean(resendKey), "Rehearsal requires three test inboxes and SANTAELF_RESEND_READ_KEY.");
  // Fail before creating anything if provider read permissions are missing.
  await resend(resendKey, "/emails?limit=1");
  const contexts: APIRequestContext[] = [];
  const person = async () => {
    const client = await request.newContext({ baseURL: origin, extraHTTPHeaders: { origin }, timeout: 20_000, maxRedirects: 0 });
    contexts.push(client);
    return client;
  };
  const organizer = await person();
  let groupId: string | undefined;
  let failure: unknown;
  const since = Date.now();
  const tag = randomBytes(6).toString("hex");
  const groupName = `Deployment check ${tag}`;
  const names = [0, 1, 2].map((i) => `Test participant ${i + 1} ${tag}`);
  try {
    const drawAt = new Date(Math.ceil((Date.now() + 120_000) / 60_000) * 60_000).toISOString().slice(0, 16);
    const created = await json<CreateGroupResult>(organizer, "POST", "/api/groups", {
      name: groupName, organizerName: names[0], organizerEmail: emails[0], organizerParticipates: true,
      currency: "CAD", drawMethod: "scheduled", drawAt, timezone: "UTC", requiresApproval: false,
    });
    check(/^[0-9a-f-]{36}$/.test(created.groupId), "Group creation returned an invalid identifier.");
    groupId = created.groupId;
    const dashboard = () => json<OrganizerDashboardDTO>(organizer, "GET", `/api/o/${groupId}`);
    check(!(await dashboard()).emailSimulated, "Production is simulating email; configure RESEND_API_KEY and EMAIL_MODE.");
    const invite = new URL(created.inviteUrl);
    check(invite.origin === origin && /^\/j\/[A-Za-z0-9_-]{16}$/.test(invite.pathname), "The invite URL is incorrect; check APP_URL.");
    check(created.organizerParticipantId, "Organizer participation was not created.");
    const participants = [{ client: organizer, id: created.organizerParticipantId }];
    for (let i = 1; i < 3; i++) {
      const client = await person();
      const joined = await json<JoinResult>(client, "POST", `/api/join/${invite.pathname.split("/")[2]}`, { name: names[i], email: emails[i] });
      check(joined.status === "approved", "A rehearsal participant was not approved.");
      participants.push({ client, id: joined.participantId });
    }
    for (const p of participants) {
      const profile = await json<ProfileDTO>(p.client, "PUT", `/api/p/${p.id}/profile`, { interests: ["Reading"], wishlist: [{ name: "A book" }] });
      check(profile.wishlist[0]?.name === "A book", "Wishlist persistence failed.");
    }
    log("PASS: temporary group, three participants and wishlists");
    const orgMail = await deliveredEmail(resendKey, emails[0], `Your Secret Santa group "${groupName}" is ready`, since, signal);
    const returningOrganizer = await person();
    await openPrivateLink(returningOrganizer, orgMail, origin, `/o/${groupId}`);
    await json<OrganizerDashboardDTO>(returningOrganizer, "GET", `/api/o/${groupId}`);
    log("PASS: organizer email delivery and private link in a fresh session");
    log("WAIT: configured scheduler must draw names (up to 20 minutes); this test does not call cron");
    await until(async () => {
      const d = await dashboard();
      check(!d.group.drawError, "The scheduled draw reported an error.");
      return d.group.status === "drawn" ? true : undefined;
    }, 20 * 60_000, "The scheduled draw did not run within 20 minutes; check the scheduler and its secrets.", signal);
    log("PASS: configured scheduler completed the draw");
    const returned = [];
    for (let i = 0; i < participants.length; i++) {
      const mail = await deliveredEmail(resendKey, emails[i], "SantaElf has picked your Secret Santa recipient! 🎁", since, signal);
      const content = `${mail.subject}\n${mail.text ?? ""}\n${mail.html ?? ""}`;
      check(names.every((name) => !content.includes(name)), "An assignment email leaked a participant name.");
      const client = await person();
      const id = participants[i].id;
      await openPrivateLink(client, mail, origin, `/p/${id}`);
      const home = await json<ParticipantHomeDTO>(client, "GET", `/api/p/${id}`);
      check(home.assignment.state === "ready", "An assignment was not ready after the scheduled draw.");
      // Check each person's private view in memory; never log the mapping.
      const revealed = await json<RecipientViewDTO>(client, "POST", `/api/p/${id}/reveal`, {});
      const again = await json<RecipientViewDTO>(client, "POST", `/api/p/${id}/reveal`, {});
      check(revealed.recipient.name !== names[i] && names.includes(revealed.recipient.name), "The draw returned an invalid recipient.");
      check(revealed.recipient.name === again.recipient.name && revealed.myAlias === again.myAlias, "Revealing twice changed the assignment.");
      check(revealed.recipient.profile.wishlist[0]?.name === "A book", "The recipient wishlist did not survive the draw.");
      returned.push({ client, id, recipient: revealed.recipient.name, alias: revealed.myAlias });
    }
    check(new Set(returned.map((p) => p.recipient)).size === 3, "The draw assigned a recipient more than once.");
    log("PASS: assignment delivery, private links, wishlists and stable recipient reveals");
    const giver = returned[0];
    const receiver = returned[names.indexOf(giver.recipient)];
    await json<ThreadDTO>(giver.client, "POST", `/api/p/${giver.id}/messages`, { thread: "recipient", body: "Test gift question" });
    const thread = await json<ThreadDTO>(receiver.client, "GET", `/api/p/${receiver.id}/messages?thread=santa`);
    const serialized = JSON.stringify(thread);
    check(thread.santaAlias === giver.alias && thread.messages.some((m) => m.body === "Test gift question" && !m.fromMe), "The anonymous message did not reach its recipient.");
    check(![names[0], emails[0], giver.id].some((secret) => serialized.includes(secret)), "The recipient's thread exposed their Santa's identity.");
    await json<ThreadDTO>(receiver.client, "POST", `/api/p/${receiver.id}/messages`, { thread: "santa", body: "Test gift reply" });
    const reply = await json<ThreadDTO>(giver.client, "GET", `/api/p/${giver.id}/messages?thread=recipient`);
    check(reply.messages.some((m) => m.body === "Test gift reply" && !m.fromMe), "The anonymous reply did not reach its Santa.");
    check((await receiver.client.get(`/api/p/${giver.id}`)).status() === 401, "A participant could access another participant's private API.");
    check((await receiver.client.get(`/api/o/${groupId}`)).status() === 401, "A participant could access organizer data.");
    log("PASS: anonymous message round-trip and role isolation");
    const recoverySince = Date.now();
    await json(giver.client, "POST", "/api/recover", { email: emails[0], inviteCode: invite.pathname.split("/")[2] });
    const recoveryMail = await deliveredEmail(resendKey, emails[0], `Your private link for "${groupName}"`, recoverySince, signal);
    const recovered = await person();
    await openPrivateLink(recovered, recoveryMail, origin, `/p/${giver.id}`);
    await json<ParticipantHomeDTO>(recovered, "GET", `/api/p/${giver.id}`);
    log("PASS: recovery email delivery and restored access in a fresh session");
  } catch (error) { failure = error; }
  finally {
    if (groupId) {
      let deleted = false;
      for (let attempt = 0; attempt < 3 && !deleted; attempt++) {
        try { await json(organizer, "DELETE", `/api/o/${groupId}`); deleted = true; }
        catch { if (attempt < 2) await sleep(1000); }
      }
      if (deleted) log("PASS: temporary group deleted");
      else failure = new CheckFailure("Cleanup failed. Find the group named Deployment check in the test organizer inbox and delete it before rerunning.");
    }
    await Promise.allSettled(contexts.map((client) => client.dispose()));
  }
  if (failure) throw failure;
}
