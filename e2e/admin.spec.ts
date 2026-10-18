import path from "node:path";
import { expect, test } from "@playwright/test";
import { ADMIN, cleanupTestData, humanPause, signIn, visitor } from "./helpers";

test.beforeAll(cleanupTestData);
test.afterAll(cleanupTestData);

test("protected pages redirect and wrong passwords are rejected", async ({ page }) => {
  await page.goto("/admin/enquiries");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("not correct");
});

test("owner creates, illustrates and publishes a listing, then handles its enquiry", async ({ page, browser }) => {
  const title = `E2E listing ${Date.now()}`;
  await signIn(page);
  await expect(page.getByRole("heading", { name: /Hello/ })).toBeVisible();

  // Create as draft.
  await page.goto("/admin/properties/new");
  await page.getByLabel("Title *").fill(title);
  await page.getByLabel("Suburb *").fill("Goodwood");
  await page.getByLabel("Price (R)").fill("1 800 000");
  await page.getByLabel("Bedrooms").fill("3");
  await page.getByLabel("Description").fill("A property created by the automated end-to-end test suite. It is deleted at the end.");
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.waitForURL(/\/admin\/properties\/[0-9a-f-]{36}\?created=1/);
  const adminUrl = page.url().split("?")[0];

  // Draft is not public.
  const { ctx: anon, page: pub } = await visitor(browser);
  await pub.goto("/buy?q=Goodwood");
  await expect(pub.getByText(title)).toHaveCount(0);

  // Upload a photo (validated and re-encoded server-side).
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../scripts/demo-images/KQA30E4YCM.jpg"));
  await expect(page.getByText("Uploaded")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();

  // A non-image is rejected even with an image extension.
  await page.locator('input[type="file"]').setInputFiles({ name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<?php echo 'x'; ?>") });
  await expect(page.getByText("not a readable image")).toBeVisible({ timeout: 30_000 });

  // Publish and feature check.
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Visible on the website")).toBeVisible();
  await pub.goto("/buy?q=Goodwood");
  await pub.getByRole("link", { name: title }).click();
  await pub.waitForURL(/\/properties\//);
  await expect(pub.getByRole("heading", { level: 1 })).toHaveText(title);

  // Visitor enquires about it.
  await pub.getByLabel("Full name").fill("E2E Buyer");
  await pub.getByLabel("Contact number").fill("082 111 2222");
  await pub.getByLabel(/I have read the privacy notice/).check();
  await humanPause(pub);
  await pub.getByRole("button", { name: "Send enquiry" }).click();
  const status = pub.getByRole("status").filter({ hasText: /ENQ-/ });
  await expect(status).toContainText(/ENQ-/);
  const ref = (await status.textContent())!.match(/ENQ-\d{6}-[A-Z0-9]{4}/)![0];
  await anon.close();

  // Enquiry reaches the dashboard; status can be updated.
  await page.goto(`/admin/enquiries?q=${ref}`);
  await page.getByRole("link", { name: /E2E Buyer/ }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole("combobox", { name: "Status" }).selectOption("contacted");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByText("Enquiry updated.")).toBeVisible();
  await page.getByLabel("New note").fill("Called the buyer (automated test).");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Called the buyer (automated test).")).toBeVisible();

  // Clean up: delete the enquiry (POPIA erasure) and the listing.
  await page.getByRole("button", { name: "Delete enquiry…" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/admin\/enquiries\?deleted=1/);

  await page.goto(adminUrl);
  await page.getByRole("button", { name: "Delete permanently…" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete listing" }).click();
  await expect(page).toHaveURL(/\/admin\/properties\?deleted=1/);
});

test("settings persist and affect the public site", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/settings");
  const hours = page.getByLabel("Office hours");
  await hours.fill("Mon–Fri: 08:30–17:00 (E2E)");
  await hours.locator("xpath=ancestor::form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Settings saved.").first()).toBeVisible();
  await page.goto("/contact");
  await expect(page.getByText("Mon–Fri: 08:30–17:00 (E2E)").first()).toBeVisible();
  await page.goto("/admin/settings");
  await page.getByLabel("Office hours").fill("");
  await page.getByLabel("Office hours").locator("xpath=ancestor::form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Settings saved.").first()).toBeVisible();
});

test("sign out ends the session", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
