import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { cleanupTestData } from "./helpers";

test.beforeAll(cleanupTestData);

const PAGES = ["/", "/buy", "/rent", "/sell", "/valuation", "/bond-calculator", "/about", "/contact", "/privacy", "/credits"];

test("every public page responds and has a unique title and one h1", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of PAGES) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1"), path).toHaveCount(1);
    titles.add(await page.title());
    expect(await page.locator('meta[name="description"]').getAttribute("content"), path).toBeTruthy();
  }
  expect(titles.size).toBe(PAGES.length);
});

test("header and footer links never lead to missing pages", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator("header a[href^='/'], footer a[href^='/']").evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  expect(hrefs.length).toBeGreaterThan(8);
  for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
});

test("legacy WordPress URLs redirect", async ({ request }) => {
  for (const [from, to] of [["/about-us", "/about"], ["/contact-us", "/contact"], ["/listings", "/buy"]]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toContain(to);
  }
});

test("a renamed listing URL permanently redirects to the current one", async ({ page, request }) => {
  await page.goto("/buy");
  const href = await page.locator("main article h3 a").first().getAttribute("href");
  const ref = href!.match(/ere-[a-z0-9]{6}$/)![0];
  const res = await request.get(`/properties/an-old-title-${ref}`, { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(new URL(res.headers()["location"], "http://site.test").pathname).toBe(href);
});

test("homepage search finds matching listings and filters combine and clear", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Suburb or area").fill("Bellville");
  await page.getByRole("button", { name: "Search" }).click();
  await page.waitForURL(/\/buy\?q=Bellville/);
  await expect(page.getByRole("heading", { name: "1 property" })).toBeVisible();
  await expect(page.locator("main article h3")).toHaveText(["Two-bedroom apartment close to amenities"]);

  await page.goto("/buy?beds=3&maxPrice=2000000");
  await expect(page.locator("main article h3")).toHaveText(["Contemporary townhouse in a secure complex"]);
  await page.getByRole("link", { name: "Remove filter: 3+ beds" }).click();
  await expect(page).toHaveURL(/\/buy\?maxPrice=2000000$/);
  await page.getByRole("link", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/buy$/);
  await expect(page.getByRole("heading", { name: "3 properties" })).toBeVisible();
});

test("drafts and sold listings are hidden; empty results are handled", async ({ page }) => {
  await page.goto("/buy");
  await expect(page.getByText("Unpublished draft")).toHaveCount(0);
  await expect(page.getByText("Sold family home")).toHaveCount(0);
  await page.goto("/buy?q=Nowhereville");
  await expect(page.getByRole("heading", { name: "No properties match these filters" })).toBeVisible();
  const res = await page.goto("/properties/not-a-real-listing");
  expect(res?.status()).toBe(404);
});

test("property page: gallery, facts, WhatsApp link and calculator", async ({ page }) => {
  await page.goto("/buy?q=Parow");
  await page.locator("main article h3 a").first().click();
  await page.waitForURL(/\/properties\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modern family home with a north-facing garden");
  await expect(page.getByText("1 / 4")).toBeVisible();
  await page.getByRole("button", { name: "Next photo" }).first().click();
  await expect(page.getByText("2 / 4")).toBeVisible();
  await page.getByRole("button", { name: "View full screen" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Photo 3 of 4")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  // Unknown facts are omitted rather than shown as zero.
  await expect(page.locator("dd", { hasText: /^2\.5$/ })).toBeVisible();
  await expect(page.locator("dd", { hasText: /^0$/ })).toHaveCount(0);

  const wa = await page.getByRole("link", { name: "WhatsApp about this property" }).getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/27824741178\?text=/);
  expect(decodeURIComponent(wa!.split("text=")[1])).toMatch(/Ref ERE-[A-Z0-9]{6}/);

  // R2 450 000 less 10% deposit, 11% over 20 years ≈ R22 760 (see tests/unit/mortgage.test.ts).
  await expect(page.locator("output").first()).toHaveText(/R\s?22\s?760/);
});

test("bond calculator responds to input and handles zero interest", async ({ page }) => {
  await page.goto("/bond-calculator");
  const out = page.locator("output");
  await expect(out).toHaveText(/R\s?13\s?935/); // R1.5m − 10%, 11%, 20 years
  await page.getByLabel("Interest rate (% a year)").fill("0");
  await expect(out).toHaveText(/R\s?5\s?625/); // 1 350 000 / 240
  await page.getByLabel("Interest rate (% a year)").fill("abc");
  await expect(page.getByText("Enter an interest rate between 0 and 40%.")).toBeVisible();
});

test("key pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/buy", "/contact", "/valuation", "/bond-calculator"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${path}: ${v.id} — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  }
});

test("mobile navigation opens, links work and there is no horizontal scroll @mobile", async ({ page }) => {
  for (const path of ["/", "/buy", "/contact"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), path).toBeLessThanOrEqual(0);
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Property valuation" }).click();
  await expect(page).toHaveURL(/\/valuation$/);
});
