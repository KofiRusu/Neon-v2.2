import { test, expect } from "@playwright/test";

test.describe("Agent Logs Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agents/logs");
  });

  test("should load logs dashboard correctly", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Agent Logs Dashboard");
    await expect(
      page.locator("text=Monitor and audit all AI agent activity in real-time"),
    ).toBeVisible();
  });

  test("should display filters and search", async ({ page }) => {
    await expect(page.locator("text=Filters & Search")).toBeVisible();
    await expect(
      page.locator('input[placeholder*="Search messages, agents, tasks"]'),
    ).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible();
  });

  test("should show table and timeline views", async ({ page }) => {
    await expect(
      page.locator('[role="tab"]:has-text("Table View")'),
    ).toBeVisible();
    await expect(
      page.locator('[role="tab"]:has-text("Timeline View")'),
    ).toBeVisible();
  });

  test("should filter logs by search", async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.fill(
      'input[placeholder*="Search messages, agents, tasks"]',
      "content",
    );
    await page.waitForTimeout(500);
    await expect(page.locator('text=Search: "content"')).toBeVisible();
  });

  test("should switch between views", async ({ page }) => {
    await page.click('[role="tab"]:has-text("Timeline View")');
    await expect(page.locator("text=Agent Activity Timeline")).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Agent Logs Dashboard");
  });
});
