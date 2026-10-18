import { expect, test } from "@playwright/test";
import { cleanupTestData, humanPause, visitor } from "./helpers";

test.afterAll(cleanupTestData);

test("valuation form validates, then stores the request with a reference", async ({ browser }) => {
  const { ctx, page } = await visitor(browser);
  await page.goto("/valuation");
  await humanPause(page);
  await page.getByRole("button", { name: "Request my valuation" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Please check the highlighted fields");
  await expect(page.getByText("Please enter the property address or suburb")).toBeVisible();
  await expect(page.getByText("Please confirm you have read the privacy notice")).toBeVisible();

  await page.getByLabel("Property address or suburb").fill("12 Test Street, Parow");
  await page.getByLabel("Property type").selectOption("House");
  await page.getByLabel("Full name").fill("E2E Valuation Tester");
  await page.getByLabel("Contact number").fill("082 000 0000");
  await page.getByLabel(/I have read the privacy notice/).check();
  await expect(page.getByLabel(/send me occasional property updates/)).not.toBeChecked();
  await humanPause(page);
  await page.getByRole("button", { name: "Request my valuation" }).click();
  await expect(page.getByRole("status").filter({ hasText: /ENQ-/ })).toContainText(/ENQ-\d{6}-[A-Z0-9]{4}/);
  await expect(page.getByText("What happens next")).toBeVisible();
  await ctx.close();
});

test("honeypot submissions are refused without a false success", async ({ browser }) => {
  const { ctx, page } = await visitor(browser);
  await page.goto("/contact");
  await page.getByLabel("Full name").fill("Bot");
  await page.getByLabel("Contact number").fill("0820000001");
  await page.getByLabel("Message").fill("Spam message here");
  await page.getByLabel(/I have read the privacy notice/).check();
  await page.locator('input[name="ere_website_url"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
  await humanPause(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("couldn't send your enquiry");
  await expect(page.getByText(/ENQ-\d{6}/)).toHaveCount(0);
  await ctx.close();
});
