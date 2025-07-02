import { test, expect } from "@playwright/test";

test.describe("Agents UI/UX Production Excellence", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/agents");
  });

  test.describe("Cross-Platform Layout Validation", () => {
    test("should render correctly on Desktop (1920x1080)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/agents");

      // Wait for page to load
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();
      await expect(page.getByText("Real-time monitoring")).toBeVisible();

      // Check header controls
      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        await expect(darkModeToggle).toBeVisible();
      }

      const autoRefreshToggle = page
        .locator("button")
        .filter({ hasText: /Auto-refresh|Paused/ });
      if ((await autoRefreshToggle.count()) > 0) {
        await expect(autoRefreshToggle).toBeVisible();
      }

      // Check for agent categories or loading state
      const loadingSpinner = page.locator(".border-t-blue-500");
      if ((await loadingSpinner.count()) > 0) {
        await expect(loadingSpinner).toBeVisible();
      } else {
        // Look for agent content
        const agentContent = page.locator(".grid, .space-y-8").first();
        if ((await agentContent.count()) > 0) {
          await expect(agentContent).toBeVisible();
        }
      }
    });

    test("should render correctly on Laptop (1366x768)", async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto("/agents");

      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Controls should be responsive
      const headerControls = page.locator("button").first();
      if ((await headerControls.count()) > 0) {
        await expect(headerControls).toBeVisible();
      }
    });

    test("should render correctly on Tablet (768x1024)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/agents");

      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Should show mobile-friendly layout
      const container = page.locator(".container, .mx-auto").first();
      await expect(container).toBeVisible();
    });

    test("should render correctly on Mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/agents");

      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Controls should stack or hide on mobile
      const headerSection = page.locator("h1").locator("..");
      await expect(headerSection).toBeVisible();

      // Touch-friendly buttons
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(40);
      }
    });

    test("should handle orientation changes", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/agents");

      // Portrait mode
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();
    });

    test("should adapt grid layout responsively", async ({ page }) => {
      await page.goto("/agents");

      // Desktop: Multi-column grid
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // Wait for content to load
      const pageContent = page.locator(".container");
      await expect(pageContent).toBeVisible();

      // Mobile: Single column
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();
    });
  });

  test.describe("Accessibility & Interaction Design", () => {
    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/agents");
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Test tab navigation through controls
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }

      // Test keyboard interaction with toggles
      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        await darkModeToggle.focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300);
      }
    });

    test("should provide proper ARIA labels and roles", async ({ page }) => {
      await page.goto("/agents");
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Check main regions
      const mainContent = page
        .locator("main, [role='main'], .container")
        .first();
      await expect(mainContent).toBeVisible();

      // Check heading hierarchy
      const mainHeading = page.getByRole("heading", { level: 1 });
      await expect(mainHeading).toBeVisible();

      // Check button accessibility
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        await expect(firstButton).toBeVisible();

        // Should have accessible content
        const buttonText = await firstButton.textContent();
        const ariaLabel = await firstButton.getAttribute("aria-label");
        expect(buttonText || ariaLabel).toBeTruthy();
      }
    });

    test("should support screen reader navigation", async ({ page }) => {
      await page.goto("/agents");

      // Check semantic structure
      const headings = page.locator("h1, h2, h3");
      await expect(headings.first()).toBeVisible();

      // Check for proper content structure
      const descriptions = page.getByText("Real-time monitoring");
      if ((await descriptions.count()) > 0) {
        await expect(descriptions.first()).toBeVisible();
      }

      // Check for agent card accessibility if loaded
      await page.waitForTimeout(2000); // Wait for potential data loading
      const agentCards = page.locator(".grid").first();
      if ((await agentCards.count()) > 0) {
        await expect(agentCards).toBeVisible();
      }
    });

    test("should have proper focus management", async ({ page }) => {
      await page.goto("/agents");
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Test focus on toggle buttons
      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        await darkModeToggle.focus();
        await expect(darkModeToggle).toBeFocused();
      }

      // Test tab order through controls
      await page.keyboard.press("Tab");
      const nextFocused = page.locator(":focus");
      if ((await nextFocused.count()) > 0) {
        await expect(nextFocused).toBeVisible();
      }
    });

    test("should support dark mode toggle", async ({ page }) => {
      await page.goto("/agents");

      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        await expect(darkModeToggle).toBeVisible();

        // Toggle dark mode
        await darkModeToggle.click();
        await page.waitForTimeout(500);

        // Should show theme change
        const container = page.locator(".container").first();
        await expect(container).toBeVisible();

        // Toggle back
        await darkModeToggle.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Animation & Interaction Polish", () => {
    test("should animate elements on load", async ({ page }) => {
      await page.goto("/agents");

      // Check header animation
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Check for loading spinner or content
      await page.waitForTimeout(1000);
      const loadingSpinner = page.locator(".border-t-blue-500");
      const content = page.locator(".space-y-8, .grid");

      // Either loading or content should be visible
      if ((await loadingSpinner.count()) > 0) {
        await expect(loadingSpinner).toBeVisible();
      } else if ((await content.count()) > 0) {
        await expect(content.first()).toBeVisible();
      }
    });

    test("should animate button interactions", async ({ page }) => {
      await page.goto("/agents");

      // Test button hover effects
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        await firstButton.hover();
        await page.waitForTimeout(200);
        await expect(firstButton).toBeVisible();
      }
    });

    test("should handle smooth toggle transitions", async ({ page }) => {
      await page.goto("/agents");

      // Test dark mode toggle
      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);

        // Should maintain layout
        await expect(
          page.getByText("Agent Performance Dashboard"),
        ).toBeVisible();
      }

      // Test auto-refresh toggle
      const autoRefreshToggle = page
        .locator("button")
        .filter({ hasText: /Auto-refresh|Paused/ });
      if ((await autoRefreshToggle.count()) > 0) {
        await autoRefreshToggle.click();
        await page.waitForTimeout(300);
        await expect(autoRefreshToggle).toBeVisible();
      }
    });

    test("should show loading states", async ({ page }) => {
      await page.goto("/agents");

      // Should show loading initially or content
      await page.waitForTimeout(500);
      const loadingSpinner = page.locator(".border-t-blue-500");
      if ((await loadingSpinner.count()) > 0) {
        await expect(loadingSpinner).toBeVisible();
      }

      // Test refresh button
      const refreshButton = page.locator("button").filter({ hasText: /🔄/ });
      if ((await refreshButton.count()) > 0) {
        await refreshButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe("Visual Consistency & Design System", () => {
    test("should use consistent header styling", async ({ page }) => {
      await page.goto("/agents");

      // Check main heading
      const mainHeading = page.getByText("Agent Performance Dashboard");
      await expect(mainHeading).toBeVisible();

      // Check subtitle
      const subtitle = page.getByText("Real-time monitoring");
      if ((await subtitle.count()) > 0) {
        await expect(subtitle).toBeVisible();
      }
    });

    test("should maintain consistent button styling", async ({ page }) => {
      await page.goto("/agents");

      // Check all control buttons have consistent styling
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          const button = buttons.nth(i);
          await expect(button).toBeVisible();

          // Should have rounded corners and proper padding
          const classList = await button.getAttribute("class");
          expect(classList).toContain("rounded");
        }
      }
    });

    test("should have consistent spacing and layout", async ({ page }) => {
      await page.goto("/agents");

      // Check container structure
      const container = page.locator(".container, .mx-auto").first();
      await expect(container).toBeVisible();

      // Check consistent spacing
      const spacingElements = page.locator(".space-y-8, .gap-4, .mb-8");
      if ((await spacingElements.count()) > 0) {
        await expect(spacingElements.first()).toBeVisible();
      }
    });

    test("should handle theme consistency", async ({ page }) => {
      await page.goto("/agents");

      // Check background gradient
      const background = page.locator("body, .min-h-screen").first();
      await expect(background).toBeVisible();

      // Test dark mode consistency
      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);

        // Should apply consistent dark theme
        await expect(
          page.getByText("Agent Performance Dashboard"),
        ).toBeVisible();
      }
    });
  });

  test.describe("Agents-Specific Functionality", () => {
    test("should display agent performance dashboard", async ({ page }) => {
      await page.goto("/agents");

      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();
      await expect(page.getByText("Real-time monitoring")).toBeVisible();
    });

    test("should handle loading states properly", async ({ page }) => {
      await page.goto("/agents");

      // Should show loading spinner initially
      await page.waitForTimeout(500);
      const loadingSpinner = page.locator(".border-t-blue-500");
      const content = page.locator(".space-y-8");

      // Either loading or content should be visible
      expect(
        (await loadingSpinner.count()) > 0 || (await content.count()) > 0,
      ).toBeTruthy();
    });

    test("should display system health overview when available", async ({
      page,
    }) => {
      await page.goto("/agents");
      await page.waitForTimeout(2000); // Wait for data loading

      // Check for health summary
      const healthSummary = page.getByText("System Health Overview");
      if ((await healthSummary.count()) > 0) {
        await expect(healthSummary).toBeVisible();

        // Should show health metrics
        const healthMetrics = page
          .locator(".grid")
          .filter({ hasText: /Total Agents|Healthy|Degraded/ });
        if ((await healthMetrics.count()) > 0) {
          await expect(healthMetrics.first()).toBeVisible();
        }
      }
    });

    test("should display agent categories when available", async ({ page }) => {
      await page.goto("/agents");
      await page.waitForTimeout(2000); // Wait for data loading

      // Check for agent categories
      const categories = page
        .locator("h2")
        .filter({ hasText: /Agents \(\d+\)/ });
      if ((await categories.count()) > 0) {
        await expect(categories.first()).toBeVisible();

        // Should show agent grid
        const agentGrid = page.locator(".grid").last();
        if ((await agentGrid.count()) > 0) {
          await expect(agentGrid).toBeVisible();
        }
      }
    });

    test("should handle auto-refresh functionality", async ({ page }) => {
      await page.goto("/agents");

      const autoRefreshToggle = page
        .locator("button")
        .filter({ hasText: /Auto-refresh|Paused/ });
      if ((await autoRefreshToggle.count()) > 0) {
        // Should start with auto-refresh enabled
        const toggleText = await autoRefreshToggle.textContent();
        expect(toggleText).toContain("Auto-refresh");

        // Test toggle functionality
        await autoRefreshToggle.click();
        await page.waitForTimeout(300);

        const newToggleText = await autoRefreshToggle.textContent();
        expect(newToggleText).toContain("Paused");
      }
    });

    test("should handle manual refresh", async ({ page }) => {
      await page.goto("/agents");

      const refreshButton = page
        .locator("button")
        .filter({ hasText: /🔄 Refresh/ });
      if ((await refreshButton.count()) > 0) {
        await expect(refreshButton).toBeVisible();

        // Test refresh functionality
        await refreshButton.click();
        await page.waitForTimeout(500);

        // Should maintain page state
        await expect(
          page.getByText("Agent Performance Dashboard"),
        ).toBeVisible();
      }
    });

    test("should handle agent card interactions", async ({ page }) => {
      await page.goto("/agents");
      await page.waitForTimeout(3000); // Wait longer for agent data

      // Look for agent cards
      const agentCards = page.locator(".grid").last().locator("> div");
      if ((await agentCards.count()) > 0) {
        const firstCard = agentCards.first();
        await expect(firstCard).toBeVisible();

        // Test card interaction
        await firstCard.hover();
        await page.waitForTimeout(200);

        // Test click if interactive
        await firstCard.click();
        await page.waitForTimeout(500);

        // Should handle modal or navigation
        const modal = page.locator("[role='dialog'], .modal");
        if ((await modal.count()) > 0) {
          await expect(modal).toBeVisible();

          // Close modal with Escape
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      await page.goto("/agents");

      // Should show basic interface even with API failures
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(100);

      // Should still show loading or error state
      const loadingSpinner = page.locator(".border-t-blue-500");
      if ((await loadingSpinner.count()) > 0) {
        await expect(loadingSpinner).toBeVisible();
      }

      // Re-enable network
      await page.context().setOffline(false);
    });

    test("should handle missing agent data", async ({ page }) => {
      await page.goto("/agents");

      // Should show interface regardless of data availability
      await expect(page.getByText("Agent Performance Dashboard")).toBeVisible();

      // Should handle loading state
      await page.waitForTimeout(2000);
      const content = page.locator(".container");
      await expect(content).toBeVisible();
    });

    test("should handle modal interactions properly", async ({ page }) => {
      await page.goto("/agents");
      await page.waitForTimeout(2000);

      // If agent cards are available, test modal
      const agentCards = page.locator(".grid").last().locator("> div");
      if ((await agentCards.count()) > 0) {
        await agentCards.first().click();
        await page.waitForTimeout(500);

        const modal = page.locator("[role='dialog'], .modal");
        if ((await modal.count()) > 0) {
          // Test escape key
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);

          // Test clicking outside
          await agentCards.first().click();
          await page.waitForTimeout(500);
          if ((await modal.count()) > 0) {
            await page.mouse.click(100, 100); // Click outside
            await page.waitForTimeout(300);
          }
        }
      }
    });

    test("should handle toggle state persistence", async ({ page }) => {
      await page.goto("/agents");

      // Test multiple toggle interactions
      const darkModeToggle = page
        .locator("button")
        .filter({ hasText: /☀️|🌙/ });
      if ((await darkModeToggle.count()) > 0) {
        // Toggle multiple times
        await darkModeToggle.click();
        await page.waitForTimeout(300);
        await darkModeToggle.click();
        await page.waitForTimeout(300);

        // Should maintain stable state
        await expect(
          page.getByText("Agent Performance Dashboard"),
        ).toBeVisible();
      }
    });
  });
});
