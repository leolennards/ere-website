import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a running app (dev or `next start`) with a
 * migrated database containing the demo listings and a test owner account:
 *   npm run db:seed-demo
 *   ADMIN_PASSWORD=... npm run admin:create -- --email owner@ere.test --name "Test Owner"
 *   E2E_ADMIN_EMAIL=owner@ere.test E2E_ADMIN_PASSWORD=... npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
