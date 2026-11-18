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
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
