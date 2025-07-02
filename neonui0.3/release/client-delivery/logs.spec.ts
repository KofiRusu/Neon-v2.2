import { test, expect } from "@playwright/test";

test.describe("Agent Logs Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agents/logs");
  });

  test("should load logs dashboard", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Agent Logs Dashboard");
  });

  test("should display filters", async ({ page }) => {
    await expect(page.locator("text=Filters & Search")).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("should show table view", async ({ page }) => {
    await expect(
      page.locator('[role="tab"]:has-text("Table View")'),
    ).toBeVisible();
  });
});
