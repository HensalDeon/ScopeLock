import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests of the main journeys against the production build, on a
 * throwaway in-memory database (e2e/serve.mjs). Run `npm run build` first.
 */
export default defineConfig({
  testDir: "e2e",
  // One app and one database: tests run one after another.
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "e2e/.output/report" }],
      ]
    : "list",
  outputDir: "e2e/.output/results",
  use: {
    baseURL: "http://localhost:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node e2e/serve.mjs",
    url: "http://localhost:3200/api/health",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
