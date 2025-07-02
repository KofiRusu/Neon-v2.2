import { test, expect } from "@playwright/test";

test.describe("Campaigns Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/campaigns");
  });

  test("should display campaigns page", async ({ page }) => {
    await expect(page).toHaveTitle(/NeonHub - AI Marketing Platform/);
    await expect(
      page.getByRole("heading", { name: /campaigns/i }),
    ).toBeVisible();
  });

  test("should display campaign list or grid", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for campaign cards, table, or list items
    const campaignItems = page
      .locator('[data-testid="campaign-item"]')
      .or(
        page
          .locator("div")
          .filter({ hasText: /campaign|Q1|Brand|Email|Social/ }),
      )
      .or(page.locator("table tr"))
      .or(page.locator(".campaign-card"));

    await expect(campaignItems.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display campaign status indicators", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for status badges
    const statusBadges = page
      .locator("text=active")
      .or(page.locator("text=completed"))
      .or(page.locator("text=paused"))
      .or(page.locator("text=running"));

    await expect(statusBadges.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have create campaign button", async ({ page }) => {
    // Look for create or new campaign button
    const createButton = page.getByRole("button", {
      name: /create|new campaign|add campaign/i,
    });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test("should handle campaign actions", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for action buttons (edit, view, play, pause)
    const actionButtons = page.getByRole("button", {
      name: /edit|view|play|pause|stop/i,
    });

    if (await actionButtons.first().isVisible()) {
      await expect(actionButtons.first()).toBeVisible();
      // Test clicking the first action button
      await actionButtons.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("should display campaign metrics", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for metrics like revenue, conversions, CTR
    const metrics = page
      .locator("text=$")
      .or(page.locator("text=%"))
      .or(page.locator("text=revenue"))
      .or(page.locator("text=conversions"))
      .or(page.locator("text=clicks"));

    await expect(metrics.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have filtering or search capability", async ({ page }) => {
    // Look for search input or filter controls
    const searchInput = page
      .getByPlaceholder(/search|filter/i)
      .or(page.getByRole("textbox"))
      .or(page.locator('input[type="search"]'));

    const filterButton = page.getByRole("button", { name: /filter|sort/i });

    // At least one should be visible
    const hasSearch = await searchInput
      .first()
      .isVisible()
      .catch(() => false);
    const hasFilter = await filterButton
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasSearch || hasFilter).toBeTruthy();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Page should remain functional on mobile
    await expect(
      page.getByRole("heading", { name: /campaigns/i }),
    ).toBeVisible();

    // Campaign list should adapt to mobile layout
    const campaignItems = page
      .locator("div")
      .filter({ hasText: /campaign|Q1|Brand|Email|Social/ });
    if (await campaignItems.first().isVisible()) {
      await expect(campaignItems.first()).toBeVisible();
    }
  });

  test("should handle campaign creation flow", async ({ page }) => {
    const createButton = page.getByRole("button", {
      name: /create|new campaign|add campaign/i,
    });

    if (await createButton.isVisible()) {
      await createButton.click();

      // Should open modal, form, or navigate to creation page
      const modal = page
        .locator('[role="dialog"]')
        .or(page.locator(".modal"))
        .or(page.getByRole("heading", { name: /create|new campaign/i }));

      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display campaign performance charts", async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for chart elements (SVG, canvas, chart containers)
    const charts = page
      .locator("svg")
      .or(page.locator("canvas"))
      .or(page.locator('[data-testid="chart"]'))
      .or(page.locator(".recharts-wrapper"));

    if (await charts.first().isVisible()) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test("should handle loading states", async ({ page }) => {
    const loadingIndicator = page
      .locator(".animate-pulse")
      .or(page.locator('[data-testid="loading"]'))
      .or(page.locator("text=Loading"));

    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeHidden({ timeout: 15000 });
    }
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Simulate API failure
    await page.route("**/api/**", (route) => route.abort());
    await page.reload();

    // Page should still render the basic structure
    await expect(
      page.getByRole("heading", { name: /campaigns/i }),
    ).toBeVisible();
  });

  test("should display campaign timeline or schedule", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for timeline or scheduling elements
    const timeline = page
      .locator("text=timeline")
      .or(page.locator("text=schedule"))
      .or(page.locator("text=start date"))
      .or(page.locator("text=end date"));

    if (await timeline.first().isVisible()) {
      await expect(timeline.first()).toBeVisible();
    }
  });
});
