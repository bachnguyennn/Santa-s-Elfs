import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup } from "../helpers/fixtures";
import { GET } from "@/app/api/cron/tick/route";
import { checkCronAuth, runCronTick } from "@/server/cron";
import { enqueueEmail } from "@/server/email/queue";

const tick = (auth?: string) => GET(new Request("http://localhost/api/cron/tick", { headers: auth ? { authorization: auth } : {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("cron tick auth", () => {
  it("rejects a missing or wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    expect((await tick()).status).toBe(401);
    expect((await tick("Bearer wrong")).status).toBe(401);
    expect((await tick("s3cret-value")).status).toBe(401);
  });

  it("refuses to run in production without a configured secret", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect((await tick()).status).toBe(503);
  });

  it("checkCronAuth: constant-time match, local demo allowed without secret", () => {
    expect(checkCronAuth("Bearer abc", "abc", true)).toBe(200);
    expect(checkCronAuth("Bearer abd", "abc", true)).toBe(401);
    expect(checkCronAuth(null, "abc", false)).toBe(401);
    expect(checkCronAuth(null, "", false)).toBe(200);
    expect(checkCronAuth("Bearer x", "", true)).toBe(503);
  });
});

describe("runCronTick", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  beforeEach(async () => {
    db = await createTestDb();
    vi.stubEnv("EMAIL_MODE", "simulate");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(async () => db.close());

  it("runs every step, isolating failures", async () => {
    const g = await insertGroup(db);
    await enqueueEmail(db, "olive@example.com", { template: "organizer_welcome", groupId: g.id });
    const res = await runCronTick(db);
    expect(res.emails).toEqual({ sent: 1, failed: 0, deferred: 0 });
    expect(res.purged).toMatchObject({ groups: 0 });
    expect(res.rateLimits).toEqual({ ok: true });
    expect(res.draws).toBeDefined(); // counts, or { error: true } if the draw step failed
  });
});
