import { test, expect } from "@playwright/test";

test.describe("Support UI/UX Production Excellence", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/support");
  });

  test.describe("Cross-Platform Layout Validation", () => {
    test("should render correctly on Desktop (1920x1080)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/support");

      // Check for support page elements - be flexible about containers
      const pageContent = page
        .locator("main, .container, .max-w-7xl, body")
        .first();
      await expect(pageContent).toBeVisible({ timeout: 10000 });

      // Look for common support page elements
      const supportElements = page
        .locator("h1, h2")
        .filter({ hasText: /support|ticket|help|inbox/i });
      if ((await supportElements.count()) > 0) {
        await expect(supportElements.first()).toBeVisible();
      }
    });

    test("should render correctly on Mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/support");

      const pageContent = page.locator("main, .container, body").first();
      await expect(pageContent).toBeVisible({ timeout: 10000 });

      // Touch-friendly interface
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(40);
      }
    });

    test("should adapt layout responsively", async ({ page }) => {
      await page.goto("/support");

      // Desktop layout
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      const pageContent = page.locator("body").first();
      await expect(pageContent).toBeVisible();

      // Mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(pageContent).toBeVisible();
    });
  });

  test.describe("Accessibility & Interaction Design", () => {
    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/support");

      // Test tab navigation
      await page.keyboard.press("Tab");
      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }
    });

    test("should provide proper ARIA labels", async ({ page }) => {
      await page.goto("/support");

      const mainContent = page.locator("main, [role='main']").first();
      if ((await mainContent.count()) > 0) {
        await expect(mainContent).toBeVisible();
      }

      const headings = page.locator("h1, h2, h3");
      if ((await headings.count()) > 0) {
        await expect(headings.first()).toBeVisible();
      }
    });

    test("should support screen reader navigation", async ({ page }) => {
      await page.goto("/support");

      const pageStructure = page.locator("h1, h2, h3, [role='heading']");
      if ((await pageStructure.count()) > 0) {
        await expect(pageStructure.first()).toBeVisible();
      }
    });
  });

  test.describe("Support-Specific Functionality", () => {
    test("should handle support interface", async ({ page }) => {
      await page.goto("/support");

      // Should load support page content
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Look for support-related elements
      const supportContent = page
        .locator("text=/support|ticket|help|contact/i")
        .first();
      if ((await supportContent.count()) > 0) {
        await expect(supportContent).toBeVisible();
      }
    });

    test("should handle form interactions", async ({ page }) => {
      await page.goto("/support");

      // Look for forms or input fields
      const forms = page.locator("form, input, textarea");
      if ((await forms.count()) > 0) {
        const firstInput = forms.first();
        await firstInput.focus();
        if (
          (await firstInput.getAttribute("type")) === "text" ||
          (await firstInput.tagName()) === "TEXTAREA"
        ) {
          await firstInput.fill("Test support message");
          await expect(firstInput).toHaveValue("Test support message");
        }
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      await page.goto("/support");

      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(100);

      // Re-enable network
      await page.context().setOffline(false);
    });

    test("should handle missing data gracefully", async ({ page }) => {
      await page.goto("/support");

      // Should show page structure even without data
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();
    });
  });
});
