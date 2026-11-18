import "server-only";

/** Centralised, validated server configuration. Never import from client code. */
export const env = {
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get emailMode(): "resend" | "simulate" {
    if (process.env.EMAIL_MODE === "simulate") return "simulate";
    return process.env.RESEND_API_KEY ? "resend" : "simulate";
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "SantaElf <onboarding@resend.dev>";
  },
  get emailDailyLimit() {
    return Number(process.env.EMAIL_DAILY_LIMIT ?? 100);
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  /**
   * /dev/outbox shows every simulated email, i.e. every private link and code.
   * Available in simulate mode outside production; production builds (E2E,
   * private demos) need the explicit opt-in ENABLE_DEV_OUTBOX=true.
   */
  get devOutboxAvailable() {
    return this.emailMode === "simulate" && (!this.isProduction || process.env.ENABLE_DEV_OUTBOX === "true");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
