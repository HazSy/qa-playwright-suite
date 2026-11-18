import { defineConfig, devices } from "@playwright/test";

/**
 * Suite E2E y de accesibilidad.
 *
 * - Proyecto `chromium`: prueba OpsDesk (la app del portfolio) en local o en CI.
 * - Proyecto `portfolio`: audita el sitio público https://hazsy.github.io.
 *
 * Variables:
 *   BASE_URL        URL de OpsDesk (por defecto http://localhost:3000)
 *   E2E_AUTOSTART   "1" para que Playwright arranque OpsDesk desde ../opsdesk
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /portfolio\.spec\.ts/,
    },
    {
      name: "portfolio",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /portfolio\.spec\.ts/,
    },
  ],

  webServer:
    process.env.E2E_AUTOSTART === "1"
      ? {
          command: "npm --prefix ../opsdesk run start",
          url: "http://localhost:3000/login",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : undefined,
});
