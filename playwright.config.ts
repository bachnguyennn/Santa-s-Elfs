import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * E2E runs against a production build in local demo mode: a throwaway PGlite
 * database and simulated email (links are read from /dev/outbox).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `rm -rf .data/e2e && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      APP_URL: `http://localhost:${PORT}`,
      EMAIL_MODE: "simulate",
      PGLITE_DIR: ".data/e2e",
      CRON_SECRET: "e2e-cron-secret",
      // The outbox is off in production builds unless opted in; E2E reads private links from it.
      ENABLE_DEV_OUTBOX: "true",
      // Simulated emails count toward the daily cap; the full suite sends a few hundred.
      EMAIL_DAILY_LIMIT: "10000",
      // No proxy in E2E: trusting X-Forwarded-For lets tests deliberately simulate distinct clients.
      TRUSTED_IP_HEADER: "x-forwarded-for",
    },
  },
});
