import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  timeout: 30_000,

  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm --filter @trud-calendar/demo dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    cwd: "..",
    timeout: 30_000,
  },
});
