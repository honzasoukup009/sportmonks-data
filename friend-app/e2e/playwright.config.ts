import { defineConfig } from "@playwright/test";

// Purely a reader of the deployed app — no test here writes/mutates
// anything. Every fetch to Sportmonks happens server-side inside the
// Worker, so each test run against a live baseURL costs real API quota;
// keep the suite small (see ../REQUIREMENTS.md) rather than exhaustive.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // one PIN session at a time is plenty for this suite
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.LIGASTAT_BASE_URL || "https://sportmonks-friend-lookup.cumpelda.workers.dev",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
