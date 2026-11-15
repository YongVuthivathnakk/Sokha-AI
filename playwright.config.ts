import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  use: { baseURL: "http://localhost:3100", ...devices["Desktop Chrome"], channel: "chrome", trace: "retain-on-failure" },
  webServer: { command: "bun run start --port 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
