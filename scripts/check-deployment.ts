import { CheckFailure, deploymentOrigin, rehearse, rehearsalEmails, smoke } from "./deployment/check";

const abort = new AbortController();
process.once("SIGINT", () => abort.abort());
process.once("SIGTERM", () => abort.abort());

async function main() {
  const mode = process.argv[2] ?? "smoke";
  if (!["smoke", "rehearsal"].includes(mode)) throw new CheckFailure("Choose smoke or rehearsal mode.");
  const origin = deploymentOrigin(process.env.SANTAELF_URL);
  // Validate before any network traffic or group creation.
  const emails = mode === "rehearsal" ? rehearsalEmails(process.env.SANTAELF_TEST_EMAILS) : [];
  const key = process.env.SANTAELF_RESEND_READ_KEY;
  if (mode === "rehearsal" && !key) throw new CheckFailure("Set SANTAELF_RESEND_READ_KEY to a Resend key with sent-email read access.");
  await smoke(origin, console.log);
  if (mode === "rehearsal") {
    await rehearse({ origin, emails, resendKey: key!, log: console.log, signal: abort.signal });
    console.log("PASS: deployed rehearsal. Delivery means recipient mail-server acceptance; check inbox/spam placement separately.");
  } else console.log("PASS: read-only smoke checks. Run rehearsal mode to test drawing, email delivery and recovery.");
}

main().catch((error: unknown) => {
  // Never print provider bodies, request URLs, cookies, tokens or stack traces.
  console.error(error instanceof CheckFailure ? error.message : "Deployment check failed or was interrupted. Inspect server/provider logs; no private request data is printed here.");
  process.exitCode = 1;
});
