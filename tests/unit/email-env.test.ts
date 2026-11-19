import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "@/server/env";

afterEach(() => vi.unstubAllEnvs());

describe("email provider selection", () => {
  it("keeps demo mode as the unconfigured default and preserves Resend auto-selection", () => {
    vi.stubEnv("EMAIL_MODE", "");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(env.emailMode).toBe("simulate");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    expect(env.emailMode).toBe("resend");
  });

  it("respects explicit Gmail and never exposes the demo outbox", () => {
    vi.stubEnv("EMAIL_MODE", "gmail");
    vi.stubEnv("RESEND_API_KEY", "re_stale");
    vi.stubEnv("ENABLE_DEV_OUTBOX", "true");
    expect(env.emailMode).toBe("gmail");
    expect(env.devOutboxAvailable).toBe(false);
  });

  it("does not silently simulate an explicitly selected Resend provider", () => {
    vi.stubEnv("EMAIL_MODE", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(env.emailMode).toBe("resend");
    expect(env.devOutboxAvailable).toBe(false);
  });

  it("rejects an unknown mode without including its value in the error", () => {
    vi.stubEnv("EMAIL_MODE", "private-value");
    expect(() => env.emailMode).toThrow("EMAIL_MODE must be simulate, resend or gmail.");
  });
});
