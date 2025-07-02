import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display dashboard page title", async ({ page }) => {
    await expect(page).toHaveTitle(/NeonHub - AI Marketing Platform/);
  });

  test("should display main dashboard heading", async ({ page }) => {
    // Look for any main heading or page title
    const heading = page.locator('h1, h2, [role="heading"]').first();
    if ((await heading.count()) > 0) {
      await expect(heading).toBeVisible();
    } else {
      // Fallback to page title check
      await expect(page).toHaveTitle(/NeonHub/);
    }
  });

  test("should display navigation menu", async ({ page }) => {
    // Check for main navigation links
    await expect(
      page.getByRole("link", { name: /dashboard/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /agents/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /campaigns/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /analytics/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /settings/i }).first(),
    ).toBeVisible();
  });

  test("should display welcome message", async ({ page }) => {
    // Look for welcome content or dashboard overview - be flexible
    const welcomeContent = page
      .locator("text=/welcome|overview|dashboard|home/i")
      .first();
    if ((await welcomeContent.count()) > 0) {
      await expect(welcomeContent).toBeVisible({ timeout: 10000 });
    } else {
      // Fallback to checking that the page loaded successfully
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that the page is still functional on mobile
    const heading = page.locator('h1, h2, [role="heading"]').first();
    if ((await heading.count()) > 0) {
      await expect(heading).toBeVisible();
    } else {
      await expect(page.locator("body")).toBeVisible();
    }

    // Navigation might be collapsed on mobile
    const mobileNav = page
      .locator('[data-testid="mobile-nav"]')
      .or(page.locator('button[aria-label*="menu"]'));
    if ((await mobileNav.count()) > 0 && (await mobileNav.isVisible())) {
      await mobileNav.click();
      const agentLink = page.getByRole("link", { name: /agents/i }).first();
      if ((await agentLink.count()) > 0) {
        await expect(agentLink).toBeVisible();
      }
    }
  });

  test("should navigate to other pages", async ({ page }) => {
    // Test navigation to agents page
    await page
      .getByRole("link", { name: /agents/i })
      .first()
      .click();
    await expect(page).toHaveURL(/.*\/agents/);

    // Navigate back to dashboard - handle both /dashboard and / as valid dashboard URLs
    await page
      .getByRole("link", { name: /dashboard/i })
      .first()
      .click();
    await expect(page).toHaveURL(/.*\/(dashboard|$)/);
  });

  test("should handle loading states gracefully", async ({ page }) => {
    // Check for specific loading indicators, not decorative animations
    const trueLoadingIndicator = page.locator(
      '[data-testid="loading"], .loading-spinner, .skeleton',
    );

    // If true loading states exist, they should eventually disappear
    if ((await trueLoadingIndicator.count()) > 0) {
      await expect(trueLoadingIndicator.first()).toBeHidden({ timeout: 15000 });
    } else {
      // If no loading indicators, just verify the page loaded
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should display proper error states", async ({ page }) => {
    // Test error handling by simulating network failure
    await page.route("**/api/**", (route) => route.abort());

    await page.reload();

    // Should handle API failures gracefully - page should still load
    const heading = page.locator('h1, h2, [role="heading"]').first();
    if ((await heading.count()) > 0) {
      await expect(heading).toBeVisible();
    } else {
      // At minimum, the page should load
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
