/**
 * Regression tests for the independent security review (see SECURITY.md).
 * Each block pins down one finding or one verified claim.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { groupInput, insertDrawnGroup } from "../helpers/services";
import { clientKey, trustedIpHeader } from "@/server/rateLimit";
import { createGroup, getOrganizerDashboard } from "@/server/services/groups";
import { decideParticipant, joinGroup, resendParticipantLink } from "@/server/services/enrollment";
import { addExclusion } from "@/server/services/exclusions";
import { completeEmergencyReveal, startEmergencyChallenge } from "@/server/services/emergency";
import { getThread, reportMessage, sendMessage } from "@/server/services/messaging";
import { revealAssignment } from "@/server/services/participant";
import { drawGroup } from "@/server/draw/draw";
import { processEmailJobs } from "@/server/email/worker";
import { emergencyCodeHash } from "@/server/tokens";
import { env } from "@/server/env";
import { api } from "@/server/http";
import { renderEmail } from "@/server/email/render";
import { organizerWelcome } from "@/server/email/templates/emails";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await db.close();
});

const req = (headers: Record<string, string>) => new Request("http://localhost/api/join/x", { method: "POST", headers });

describe("rate-limit client key (X-Forwarded-For spoofing)", () => {
  it("ignores client-supplied forwarding headers unless a trusted header is configured", () => {
    vi.stubEnv("TRUSTED_IP_HEADER", "");
    vi.stubEnv("VERCEL", "");
    expect(trustedIpHeader()).toBeNull();
    const a = clientKey(req({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "1.1.1.1" }));
    const b = clientKey(req({ "x-forwarded-for": "2.2.2.2", "x-real-ip": "2.2.2.2" }));
    expect(a).toBe(b); // one shared bucket: rotating the header doesn't buy new quota
  });

  it("uses x-real-ip on Vercel (platform-overwritten) and ignores X-Forwarded-For there", () => {
    vi.stubEnv("TRUSTED_IP_HEADER", "");
    vi.stubEnv("VERCEL", "1");
    expect(clientKey(req({ "x-real-ip": "3.3.3.3", "x-forwarded-for": "9.9.9.9" }))).toBe(
      clientKey(req({ "x-real-ip": "3.3.3.3", "x-forwarded-for": "8.8.8.8" })),
    );
    expect(clientKey(req({ "x-real-ip": "3.3.3.3" }))).not.toBe(clientKey(req({ "x-real-ip": "4.4.4.4" })));
  });

  it("honours TRUSTED_IP_HEADER and uses the proxy-appended (last) list entry", () => {
    vi.stubEnv("TRUSTED_IP_HEADER", "X-Forwarded-For");
    expect(clientKey(req({ "x-forwarded-for": "6.6.6.6, 5.5.5.5" }))).toBe(clientKey(req({ "x-forwarded-for": "7.7.7.7, 5.5.5.5" })));
    vi.stubEnv("TRUSTED_IP_HEADER", "none");
    vi.stubEnv("VERCEL", "1");
    expect(trustedIpHeader()).toBeNull();
  });
});

describe("organizer dashboard anonymity", () => {
  it("doesn't expose new_message notifications (their timing links a reply to the Santa it notifies)", async () => {
    const created = await createGroup(db, groupInput({ organizerParticipates: true }));
    const g = await db.query<{ invite_code: string }>(`select invite_code from groups where id = $1`, [created.groupId]);
    await joinGroup(db, g[0].invite_code, { name: "Bea", email: "bea@example.com" });
    await joinGroup(db, g[0].invite_code, { name: "Cal", email: "cal@example.com" });
    await drawGroup(db, created.groupId, { trigger: "manual" });
    const orgPid = created.organizerParticipant!.participantId;
    const me = { groupId: created.groupId, participantId: orgPid };

    // The organizer (a participant) replies to their anonymous Santa -> the Santa gets a new_message email.
    await sendMessage(db, me, { thread: "santa", body: "Thanks, Santa!" });
    const [santa] = await db.query<{ giver_id: string }>(`select giver_id from assignments where recipient_id = $1`, [orgPid]);
    const dash = await getOrganizerDashboard(db, { groupId: created.groupId });
    const santaRow = dash.participants.find((p) => p.id === santa.giver_id)!;
    expect(santaRow.lastEmail?.template).toBe("assignment_ready");
    expect(JSON.stringify(dash)).not.toContain("new_message");
  });
});

describe("IDOR: organizer of group A acting on group B", () => {
  it("decide / resend / exclusion / emergency reject a participant id from another group", async () => {
    const a = await insertGroup(db);
    const b = await insertDrawnGroup(db);
    const [a1] = await insertParticipants(db, a.id, 2);
    const [bp] = await insertParticipants(db, (await insertGroup(db)).id, 1, "pending");
    const ctxA = { groupId: a.id };

    await expect(decideParticipant(db, ctxA, bp, { action: "approve" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(decideParticipant(db, ctxA, b.participants[0], { action: "remove" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(resendParticipantLink(db, ctxA, b.participants[0])).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addExclusion(db, ctxA, { giverId: a1, receiverId: b.participants[0] })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(startEmergencyChallenge(db, ctxA, b.participants[0])).rejects.toMatchObject({ code: "NOT_DRAWN" });

    // Drawn group C's organizer can't open a challenge for B's participant, nor redeem B's challenge.
    const c = await insertDrawnGroup(db);
    await expect(startEmergencyChallenge(db, { groupId: c.id }, b.participants[0])).rejects.toMatchObject({ code: "NOT_FOUND" });
    const ch = await startEmergencyChallenge(db, { groupId: b.id }, b.participants[0]);
    await db.query(`update emergency_challenges set code_hash = $2 where id = $1`, [ch.challengeId, emergencyCodeHash(ch.challengeId, "111111")]);
    await expect(completeEmergencyReveal(db, { groupId: c.id }, { challengeId: ch.challengeId, code: "111111" })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    });
    expect((await db.query(`select 1 from participants where id = $1 and status = 'approved'`, [b.participants[0]])).length).toBe(1);
  });

  it("a participant can't report a message from another thread", async () => {
    const g = await insertDrawnGroup(db, 4); // 0→1→2→3→0
    await db.query(`update assignments set revealed_at = now() where group_id = $1`, [g.id]);
    const ctx = (i: number) => ({ groupId: g.id, participantId: g.participants[i] });
    await sendMessage(db, ctx(0), { thread: "recipient", body: "for p1" }); // santa 0 -> recipient 1
    const [{ id }] = await db.query<{ id: string }>(`select id from messages`);
    await expect(reportMessage(db, ctx(2), id)).rejects.toMatchObject({ code: "NOT_FOUND" }); // not 2's thread
    await expect(reportMessage(db, ctx(0), id)).rejects.toMatchObject({ code: "NOT_FOUND" }); // sender can't report own
    await reportMessage(db, ctx(1), id);
  });
});

describe("concurrency", () => {
  it("simultaneous approvals never exceed 20 approved", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    await insertParticipants(db, g.id, 18);
    const pending = await insertParticipants(db, g.id, 5, "pending");
    const results = await Promise.allSettled(pending.map((p) => decideParticipant(db, { groupId: g.id }, p, { action: "approve" })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((r) => r.status === "rejected").every((r) => (r as PromiseRejectedResult).reason.code === "GROUP_FULL")).toBe(true);
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from participants where group_id = $1 and status = 'approved'`, [g.id]);
    expect(n).toBe(20);
  });

  it("parallel wrong emergency guesses are capped at 5 attempts; the right code then fails", async () => {
    const g = await insertDrawnGroup(db);
    const ch = await startEmergencyChallenge(db, { groupId: g.id }, g.participants[0]);
    await db.query(`update emergency_challenges set code_hash = $2 where id = $1`, [ch.challengeId, emergencyCodeHash(ch.challengeId, "424242")]);
    const guesses = Array.from({ length: 12 }, (_, i) => String(100000 + i));
    await Promise.allSettled(guesses.map((code) => completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code })));
    const [{ attempts }] = await db.query<{ attempts: number }>(`select attempts from emergency_challenges where id = $1`, [ch.challengeId]);
    expect(attempts).toBe(5);
    await expect(completeEmergencyReveal(db, { groupId: g.id }, { challengeId: ch.challengeId, code: "424242" })).rejects.toMatchObject({
      code: "CHALLENGE_FAILED",
    });
  });
});

describe("same-origin check", () => {
  const handler = api(async () => ({ ok: true }));
  const call = (headers: Record<string, string>) =>
    handler(new Request("http://app.example/api/x", { method: "POST", headers }), { params: Promise.resolve({}) });

  it("rejects missing, cross-site and opaque ('null') origins with 403, not 500", async () => {
    for (const origin of [undefined, "https://evil.example", "null"]) {
      const res = await call({ host: "app.example", ...(origin ? { origin } : {}) });
      expect(res.status).toBe(403);
    }
  });
});

describe("dev outbox exposure", () => {
  it("is unavailable in production unless explicitly enabled, and never with real email", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_MODE", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_OUTBOX", "");
    expect(env.devOutboxAvailable).toBe(false); // e.g. deployed without RESEND_API_KEY
    vi.stubEnv("ENABLE_DEV_OUTBOX", "true");
    expect(env.devOutboxAvailable).toBe(true);
    vi.stubEnv("RESEND_API_KEY", "re_x");
    expect(env.devOutboxAvailable).toBe(false);
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("ENABLE_DEV_OUTBOX", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(env.devOutboxAvailable).toBe(true);
  });
});

describe("logs never contain sensitive values", () => {
  it("full flow (join, draw, reveal, message, emergency, errors) logs no tokens, emails, names or message bodies", async () => {
    vi.stubEnv("EMAIL_MODE", "simulate");
    const lines: string[] = [];
    const capture = (...args: unknown[]) => void lines.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : String(a))).join(" "));
    for (const m of ["log", "info", "warn", "error", "debug"] as const) vi.spyOn(console, m).mockImplementation(capture);

    const secrets: string[] = ["Olive Organizer-Secret", "olive.secret@example.com", "Bea Secretname", "bea.secret@example.com", "Cal Hiddenname", "cal.hidden@example.com"];
    const created = await createGroup(
      db,
      groupInput({ organizerName: secrets[0], organizerEmail: secrets[1], organizerParticipates: true }),
    );
    const [{ invite_code }] = await db.query<{ invite_code: string }>(`select invite_code from groups where id = $1`, [created.groupId]);
    const bea = await joinGroup(db, invite_code, { name: secrets[2], email: secrets[3] });
    const cal = await joinGroup(db, invite_code, { name: secrets[4], email: secrets[5] });
    secrets.push(created.organizerToken, created.organizerParticipant!.token, bea.token, cal.token);
    await expect(joinGroup(db, invite_code, { name: "Dup", email: secrets[3] })).rejects.toMatchObject({ code: "DUPLICATE_EMAIL" });

    await drawGroup(db, created.groupId, { trigger: "manual" });
    const ctx = (participantId: string) => ({ groupId: created.groupId, participantId });
    const view = await revealAssignment(db, ctx(bea.participantId));
    const body = "Secret message body: do you like jasmine tea?";
    secrets.push(body);
    await sendMessage(db, ctx(bea.participantId), { thread: "recipient", body });
    await getThread(db, ctx(bea.participantId), "santa");

    const ch = await startEmergencyChallenge(db, { groupId: created.groupId }, cal.participantId);
    // A provider failure path is logged too: make one delivery throw with PII in the message.
    const realQuery = db.query.bind(db);
    let failed = false;
    vi.spyOn(db, "query").mockImplementation(async (text: string, params?: unknown[]) => {
      if (!failed && text.includes("insert into dev_outbox") && !String(params?.[1]).includes("emergency")) {
        failed = true;
        throw new Error(`boom for ${secrets[3]} ${secrets[2]}`);
      }
      return realQuery(text, params);
    });
    await processEmailJobs(db, { limit: 100 });
    await processEmailJobs(db, { limit: 100 });
    vi.mocked(db.query).mockRestore();
    const outbox = await db.query<{ text: string; subject: string }>(`select text, subject from dev_outbox`);
    const codeMail = outbox.find((o) => o.subject.includes("emergency"));
    const code = codeMail?.text.match(/\b\d{6}\b/)?.[0];
    expect(code).toBeTruthy();
    secrets.push(code!, ...outbox.flatMap((o) => o.text.match(/\/a\/[A-Za-z0-9_-]{20,}/g) ?? []));
    const reveal = await completeEmergencyReveal(db, { groupId: created.groupId }, { challengeId: ch.challengeId, code: code! });
    expect(reveal.participantName).toBe(secrets[4]);

    // Unhandled errors in API routes are logged by name only.
    const res = await api(async () => {
      throw new Error(`db exploded for ${secrets[1]}`);
    })(new Request("http://x/api/y"), { params: Promise.resolve({}) });
    expect(res.status).toBe(500);

    expect(view.recipient.name).toBeTruthy();
    expect(lines.length).toBeGreaterThan(0); // the failure paths above did log
    const all = lines.join("\n").toLowerCase();
    for (const s of secrets) expect(all, `log leaked ${s.slice(0, 12)}…`).not.toContain(s.toLowerCase());
  });
});

describe("Supabase lockdown", () => {
  it("row level security is enabled on every table, including schema_migrations", async () => {
    const rows = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where c.relkind = 'r' and n.nspname = current_schema() order by c.relname`,
    );
    expect(rows.map((r) => r.relname)).toContain("schema_migrations");
    expect(rows.filter((r) => !r.relrowsecurity).map((r) => r.relname)).toEqual([]);
  });
});

describe("email rendering of attacker-controlled text", () => {
  it("strips CR/LF from subjects (no header injection) and escapes group names in the body", async () => {
    const out = await renderEmail(organizerWelcome({ groupName: 'Evil\r\nBcc: victim@example.com <img src=x onerror=alert(1)>', link: "https://app/a/x" }));
    expect(out.subject).not.toMatch(/[\r\n]/);
    expect(out.html).not.toContain("<img src=x");
    expect(out.html).toContain("&lt;img src=x");
  });
});
