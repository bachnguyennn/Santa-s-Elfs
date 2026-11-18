import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "@playwright/test";
import { CheckFailure, deliveredEmail, deploymentOrigin, emailLink, rehearse, rehearsalEmails, smoke } from "../../scripts/deployment/check";

const origin = "https://santa.test";
const token = "a".repeat(43);
const emails = ["one@example.com", "two@example.com", "three@example.com"];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("deployment check configuration and private links", () => {
  it("requires an explicit origin and HTTPS except for local testing", () => {
    for (const value of [undefined, "http://santa.test", "https://user:password@santa.test", "https://santa.test/path", "https://santa.test?key=secret"]) {
      expect(() => deploymentOrigin(value)).toThrow(CheckFailure);
    }
    expect(deploymentOrigin(origin + "/")).toBe(origin);
    expect(deploymentOrigin("http://127.0.0.1:3100")).toBe("http://127.0.0.1:3100");
  });

  it("requires three distinct valid inboxes without exposing invalid input", () => {
    for (const input of [undefined, "invalid-secret", "one@example.com,two@example.com", "one@example.com,ONE@example.com,three@example.com"]) {
      expect(() => rehearsalEmails(input)).toThrow(CheckFailure);
    }
    expect(rehearsalEmails(emails.join(", "))).toEqual(emails);
  });

  it("accepts a private link only on the configured origin", () => {
    expect(emailLink({ text: `Open ${origin}/a/${token}` }, origin)).toBe(`/a/${token}`);
    for (const link of [`https://other.test/a/${token}`, `https://user:password@santa.test/a/${token}`, `${origin}/a/short`]) {
      expect(() => emailLink({ text: link }, origin)).toThrow(CheckFailure);
    }
  });
});

const sentMail = { id: "test-email", to: [emails[0]], subject: "Test assignment", created_at: new Date().toISOString(), last_event: "delivered" };

describe("provider delivery verification", () => {
  it("does not treat provider acceptance as delivery", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ data: [{ ...sentMail, last_event: "sent" }], has_more: false }))
      .mockResolvedValueOnce(Response.json({ data: [sentMail], has_more: false }))
      .mockResolvedValueOnce(Response.json({ ...sentMail, text: `${origin}/a/${token}` }));
    vi.stubGlobal("fetch", fetchMock);
    let completed = false;
    const result = deliveredEmail("test-key", emails[0], sentMail.subject, Date.parse(sentMail.created_at) - 1000).then((mail) => { completed = true; return mail; });
    await vi.advanceTimersByTimeAsync(9999);
    expect(completed).toBe(false);
    await vi.advanceTimersByTimeAsync(602);
    expect((await result).text).toContain(`/a/${token}`);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects delivery failures immediately without including addresses or response bodies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [{ ...sentMail, last_event: "bounced" }], has_more: false })));
    await expect(deliveredEmail("test-key", emails[0], sentMail.subject, 0)).rejects.toThrow("A rehearsal email bounced");
  });

  it("rejects provider permission errors without exposing the provider body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ secret: token }, { status: 403 })));
    await expect(deliveredEmail("test-key", emails[0], sentMail.subject, 0)).rejects.toThrow("Resend read access failed (HTTP 403)");
  });
});

describe("rehearsal safety and cleanup", () => {
  it("does not create a group when provider read permission fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 403 })));
    const create = vi.spyOn(request, "newContext");
    await expect(rehearse({ origin, emails, resendKey: "test-key", log: vi.fn() })).rejects.toThrow(CheckFailure);
    expect(create).not.toHaveBeenCalled();
  });

  it.each([false, true])("cleans up after detecting simulated production email (cleanup failure: %s)", async (cleanupFails) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [] })));
    const groupId = "12345678-1234-1234-1234-123456789012";
    const call = vi.fn(async (_path: string, options: { method: string }) => {
      if (options.method === "DELETE") {
        if (cleanupFails) throw new Error("secret request data must not escape");
        return { status: () => 200, json: async () => ({ ok: true }) };
      }
      return { status: () => 200, json: async () => options.method === "POST" ? { groupId } : { emailSimulated: true } };
    });
    const dispose = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(request, "newContext").mockResolvedValue({ fetch: call, dispose } as unknown as Awaited<ReturnType<typeof request.newContext>>);
    const log = vi.fn();
    await expect(rehearse({ origin, emails, resendKey: "test-key", log })).rejects.toThrow(cleanupFails ? "Cleanup failed." : "Production is simulating email");
    expect(call).toHaveBeenCalledWith(`/api/o/${groupId}`, { method: "DELETE", data: undefined });
    expect(dispose).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain(groupId);
    expect(JSON.stringify(log.mock.calls)).not.toContain(emails[0]);
  });
});


describe("read-only deployment probes", () => {
  it.each([404, 500])("distinguishes a missing invite from a server failure (HTTP %s)", async (inviteStatus) => {
    const get = vi.fn(async (path: string) => ({
      status: () => path.startsWith("/j/") ? inviteStatus : path.startsWith("/api/") ? 401 : path === "/dev/outbox" ? 404 : 200,
      headers: () => ({ "content-type": "text/html", "content-security-policy": "default-src 'self'" }),
    }));
    const dispose = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(request, "newContext").mockResolvedValue({ get, dispose } as unknown as Awaited<ReturnType<typeof request.newContext>>);
    const run = smoke(origin, vi.fn());
    if (inviteStatus === 404) await expect(run).resolves.toBeUndefined();
    else await expect(run).rejects.toThrow("invite lookup returned HTTP 500");
    expect(dispose).toHaveBeenCalled();
    expect(get.mock.calls.every(([path]) => typeof path === "string")).toBe(true);
  });
});
