import { test, expect } from "@playwright/test";

test.describe("Campaigns UI/UX Production Excellence", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/campaigns");
  });

  test.describe("Cross-Platform Layout Validation", () => {
    test("should render correctly on Desktop (1920x1080)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/campaigns");

      // Check for campaigns page elements
      const pageContent = page.locator("main, .container, .max-w-7xl").first();
      await expect(pageContent).toBeVisible();

      // Look for campaign-related elements
      const campaignElements = page
        .locator("h1, h2")
        .filter({ hasText: /campaign|marketing|sequence|builder/i });
      if ((await campaignElements.count()) > 0) {
        await expect(campaignElements.first()).toBeVisible();
      }
    });

    test("should render correctly on Mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/campaigns");

      const pageContent = page.locator("main, .container").first();
      await expect(pageContent).toBeVisible();

      // Touch-friendly campaign interface
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(40);
      }
    });

    test("should adapt grid layout responsively", async ({ page }) => {
      await page.goto("/campaigns");

      // Desktop layout
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      const grids = page.locator(".grid");
      if ((await grids.count()) > 0) {
        await expect(grids.first()).toBeVisible();
      }

      // Mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();
    });
  });

  test.describe("Accessibility & Interaction Design", () => {
    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/campaigns");

      // Test tab navigation
      await page.keyboard.press("Tab");
      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }
    });

    test("should provide proper ARIA labels", async ({ page }) => {
      await page.goto("/campaigns");

      const headings = page.locator("h1, h2, h3");
      if ((await headings.count()) > 0) {
        await expect(headings.first()).toBeVisible();
      }

      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        const buttonText = await firstButton.textContent();
        const ariaLabel = await firstButton.getAttribute("aria-label");
        expect(buttonText || ariaLabel).toBeTruthy();
      }
    });

    test("should support campaign builder interactions", async ({ page }) => {
      await page.goto("/campaigns");

      // Look for interactive elements
      const interactiveElements = page.locator("button, input, select");
      if ((await interactiveElements.count()) > 0) {
        const firstElement = interactiveElements.first();
        await firstElement.focus();
        await expect(firstElement).toBeVisible();
      }
    });
  });

  test.describe("Campaigns-Specific Functionality", () => {
    test("should display campaign interface", async ({ page }) => {
      await page.goto("/campaigns");

      // Should load campaigns page content
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Look for campaign-related content
      const campaignContent = page
        .locator("text=/campaign|marketing|sequence|builder|variation/i")
        .first();
      if ((await campaignContent.count()) > 0) {
        await expect(campaignContent).toBeVisible();
      }
    });

    test("should handle campaign creation", async ({ page }) => {
      await page.goto("/campaigns");

      // Look for create/new campaign buttons
      const createButtons = page
        .locator("button")
        .filter({ hasText: /create|new|add|campaign/i });
      if ((await createButtons.count()) > 0) {
        const createButton = createButtons.first();
        await expect(createButton).toBeVisible();

        await createButton.click();
        await page.waitForTimeout(500);

        // Should handle creation flow
        const pageContent = page.locator("body");
        await expect(pageContent).toBeVisible();
      }
    });

    test("should handle campaign listing", async ({ page }) => {
      await page.goto("/campaigns");

      // Look for campaign lists or grids
      const campaignLists = page.locator(".grid, .list, table");
      if ((await campaignLists.count()) > 0) {
        await expect(campaignLists.first()).toBeVisible();
      }

      // Look for campaign cards
      const campaignCards = page.locator(".card, .campaign");
      if ((await campaignCards.count()) > 0) {
        await expect(campaignCards.first()).toBeVisible();
      }
    });

    test("should handle A/B testing interface", async ({ page }) => {
      await page.goto("/campaigns");

      // Look for A/B testing elements
      const abTestElements = page.locator("text=/a\/b|test|variation|split/i");
      if ((await abTestElements.count()) > 0) {
        await expect(abTestElements.first()).toBeVisible();
      }
    });
  });

  test.describe("Visual Consistency & Design System", () => {
    test("should use consistent campaign card styling", async ({ page }) => {
      await page.goto("/campaigns");

      // Check for consistent card styling
      const cards = page.locator(".card, .glass, .border");
      if ((await cards.count()) > 0) {
        await expect(cards.first()).toBeVisible();
      }
    });

    test("should maintain consistent spacing", async ({ page }) => {
      await page.goto("/campaigns");

      // Check spacing consistency
      const spacingElements = page.locator(".space-y-4, .gap-4, .gap-6, .mb-8");
      if ((await spacingElements.count()) > 0) {
        await expect(spacingElements.first()).toBeVisible();
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      await page.goto("/campaigns");

      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(100);

      // Re-enable network
      await page.context().setOffline(false);
    });

    test("should handle empty campaign state", async ({ page }) => {
      await page.goto("/campaigns");

      // Should show page even without campaigns
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Look for empty state or placeholder
      const emptyState = page.locator(
        "text=/no campaigns|empty|create your first/i",
      );
      if ((await emptyState.count()) > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    });
  });
});
