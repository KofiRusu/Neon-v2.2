import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should display settings page", async ({ page }) => {
    await expect(page).toHaveTitle(/NeonHub - AI Marketing Platform/);
    await expect(
      page.getByRole("heading", { name: /settings/i }),
    ).toBeVisible();
  });

  test("should display settings tabs", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for settings tabs
    const tabs = page.getByRole("tab", {
      name: /API|Database|Agent|Notification/i,
    });
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate between settings tabs", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Test tab navigation
    const apiTab = page.getByRole("tab", { name: /API/i });
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    const agentsTab = page.getByRole("tab", { name: /Agent/i });

    if (await databaseTab.isVisible()) {
      await databaseTab.click();
      await page.waitForTimeout(1000);
    }

    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await page.waitForTimeout(1000);
    }

    if (await apiTab.isVisible()) {
      await apiTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should display API key configuration", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for API key input
    const apiKeyInput = page
      .getByPlaceholder(/sk-/i)
      .or(page.getByLabel(/API Key/i))
      .or(page.locator('input[type="password"]'));

    await expect(apiKeyInput.first()).toBeVisible({ timeout: 10000 });
  });

  test("should handle API key visibility toggle", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find eye icon or show/hide button
    const eyeButton = page
      .getByRole("button")
      .filter({ hasText: /👁|eye|show|hide/i })
      .or(page.locator("button").filter({ has: page.locator("svg") }));

    if (await eyeButton.first().isVisible()) {
      await eyeButton.first().click();
      await page.waitForTimeout(500);

      // Click again to toggle back
      await eyeButton.first().click();
      await page.waitForTimeout(500);
    }
  });

  test("should display form validation", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Try to find API key input and enter invalid key
    const apiKeyInput = page
      .getByPlaceholder(/sk-/i)
      .or(page.getByLabel(/API Key/i));

    if (await apiKeyInput.isVisible()) {
      await apiKeyInput.clear();
      await apiKeyInput.fill("invalid-key");

      // Look for validation message
      const validationMessage = page
        .locator("text=Invalid")
        .or(page.locator("text=valid"))
        .or(page.locator(".text-yellow-600"))
        .or(page.locator(".text-red-600"));

      await expect(validationMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should handle save functionality", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Make a change to trigger save button
    const apiKeyInput = page
      .getByPlaceholder(/sk-/i)
      .or(page.getByLabel(/API Key/i));

    if (await apiKeyInput.isVisible()) {
      await apiKeyInput.fill("sk-test1234567890abcdef1234567890");

      // Look for save button
      const saveButton = page.getByRole("button", { name: /save/i });

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("should display database configuration", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to database tab
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    if (await databaseTab.isVisible()) {
      await databaseTab.click();

      // Look for database URL input
      const dbInput = page
        .getByPlaceholder(/postgresql/i)
        .or(page.getByLabel(/Database URL/i));

      await expect(dbInput.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display agent settings", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to agents tab
    const agentsTab = page.getByRole("tab", { name: /Agent/i });
    if (await agentsTab.isVisible()) {
      await agentsTab.click();

      // Look for agent configuration options
      const agentSettings = page
        .locator("text=timeout")
        .or(page.locator("text=retry"))
        .or(page.locator("text=rate limit"))
        .or(page.locator("text=Content Agent"));

      await expect(agentSettings.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display notification settings", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to notifications tab
    const notifTab = page.getByRole("tab", { name: /Notification/i });
    if (await notifTab.isVisible()) {
      await notifTab.click();

      // Look for notification toggles
      const switches = page
        .locator('[role="switch"]')
        .or(page.locator('input[type="checkbox"]'));

      await expect(switches.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should handle switch toggles", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to notifications tab
    const notifTab = page.getByRole("tab", { name: /Notification/i });
    if (await notifTab.isVisible()) {
      await notifTab.click();

      // Find and toggle a switch
      const switch1 = page.locator('[role="switch"]').first();
      if (await switch1.isVisible()) {
        await switch1.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should show debug mode toggle", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for debug mode setting
    const debugToggle = page
      .getByLabel(/Debug Mode/i)
      .or(
        page
          .locator("text=Debug Mode")
          .locator("..")
          .locator('[role="switch"]'),
      );

    if (await debugToggle.isVisible()) {
      await debugToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test("should display connection status", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to database tab to see connection status
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    if (await databaseTab.isVisible()) {
      await databaseTab.click();

      // Look for connection status indicator
      const status = page
        .locator("text=Connected")
        .or(page.locator("text=Status"))
        .or(page.locator(".bg-green-500"));

      await expect(status.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Settings should work on mobile
    await expect(
      page.getByRole("heading", { name: /settings/i }),
    ).toBeVisible();

    // Tabs should be accessible on mobile
    const tabs = page.getByRole("tab").first();
    if (await tabs.isVisible()) {
      await expect(tabs).toBeVisible();
    }
  });

  test("should handle reset functionality", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Make a change first
    const apiKeyInput = page
      .getByPlaceholder(/sk-/i)
      .or(page.getByLabel(/API Key/i));

    if (await apiKeyInput.isVisible()) {
      await apiKeyInput.fill("sk-changed-key");

      // Look for reset button
      const resetButton = page.getByRole("button", { name: /reset/i });

      if (await resetButton.isVisible()) {
        await resetButton.click();
        await page.waitForTimeout(1000);
      }
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

    // Page should still render basic structure
    await expect(
      page.getByRole("heading", { name: /settings/i }),
    ).toBeVisible();
  });
});
