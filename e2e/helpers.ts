import { randomUUID } from "node:crypto";
import type { Browser, Page } from "@playwright/test";

/** Each test looks like a distinct visitor so per-IP rate limits don't interfere. */
export async function visitor(browser: Browser, opts: Parameters<Browser["newContext"]>[0] = {}) {
  const ctx = await browser.newContext({ ...opts, extraHTTPHeaders: { "x-real-ip": `10.${randomUUID().slice(0, 2).charCodeAt(0)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` } });
  return { ctx, page: await ctx.newPage() };
}

// Credentials for a local test account come from the environment; none are stored in the repository.
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "", password: process.env.E2E_ADMIN_PASSWORD ?? "" };
if (!ADMIN.email || !ADMIN.password) throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (a local test owner account) to run the e2e tests.");

export async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

/** The anti-spam timer rejects forms submitted within 2.5 s of loading. */
export const humanPause = (page: Page) => page.waitForTimeout(2700);

/** Removes records created by the e2e suite (also after an interrupted run). Local databases only. */
export async function cleanupTestData() {
  const { existsSync } = await import("node:fs");
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL;
  if (!url || !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) return;
  const { Client } = await import("pg");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    await c.query("delete from enquiries where name like 'E2E %' or name = 'Bot'");
    await c.query("delete from properties where title like 'E2E listing %'");
    await c.query("delete from rate_limits where key like 'login:%'");
  } finally {
    await c.end();
  }
}
