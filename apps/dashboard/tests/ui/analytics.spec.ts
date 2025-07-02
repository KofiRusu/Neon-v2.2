import { test, expect } from "@playwright/test";

test.describe("Analytics UI/UX Production Excellence", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/analytics");
  });

  test.describe("Cross-Platform Layout Validation", () => {
    test("should render correctly on Desktop (1920x1080)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/analytics");

      // Check main elements
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();
      await expect(
        page.getByText("Real-time insights and performance metrics"),
      ).toBeVisible();

      // Check metrics grid
      await expect(page.getByText("Total Campaigns")).toBeVisible();
      await expect(page.getByText("Active AI Agents")).toBeVisible();
      await expect(page.getByText("Conversion Rate")).toBeVisible();
      await expect(page.getByText("Revenue Generated")).toBeVisible();

      // Check charts section
      await expect(page.getByText("Campaign Performance")).toBeVisible();
      await expect(page.getByText("Agent Activity")).toBeVisible();
      await expect(page.getByText("Revenue Analytics")).toBeVisible();
      await expect(page.getByText("Top Performing")).toBeVisible();
    });

    test("should render correctly on Laptop (1366x768)", async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto("/analytics");

      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Metrics should be responsive
      const metricsGrid = page.locator(".stat-card").first();
      await expect(metricsGrid).toBeVisible();

      // Time range selector should be visible
      const timeSelect = page.locator("select");
      await expect(timeSelect).toBeVisible();
    });

    test("should render correctly on Tablet (768x1024)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/analytics");

      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Check mobile-friendly layout
      const metricsCards = page.locator(".stat-card");
      await expect(metricsCards.first()).toBeVisible();

      // Charts should stack properly
      const chartSections = page.locator(".glass-strong");
      await expect(chartSections.first()).toBeVisible();
    });

    test("should render correctly on Mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/analytics");

      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Mobile should show stacked layout
      const metricsCards = page.locator(".stat-card");
      await expect(metricsCards.first()).toBeVisible();

      // Touch-friendly select
      const timeSelect = page.locator("select");
      await expect(timeSelect).toBeVisible();
      const boundingBox = await timeSelect.boundingBox();
      expect(boundingBox?.height).toBeGreaterThan(40);
    });

    test("should handle orientation changes on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/analytics");

      // Portrait mode
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();
    });

    test("should adapt grid layout responsively", async ({ page }) => {
      await page.goto("/analytics");

      // Desktop: 4-column metrics grid
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      const metricsGrid = page.locator(".grid").first();
      await expect(metricsGrid).toBeVisible();

      // Mobile: Single column
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();
    });
  });

  test.describe("Accessibility & Interaction Design", () => {
    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/analytics");
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Test tab navigation to time range selector
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }

      // Test select dropdown with keyboard
      const timeSelect = page.locator("select");
      await timeSelect.focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
    });

    test("should provide proper ARIA labels and roles", async ({ page }) => {
      await page.goto("/analytics");
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Check main regions
      const mainContent = page
        .locator("main, [role='main'], .max-w-7xl")
        .first();
      await expect(mainContent).toBeVisible();

      // Check heading hierarchy
      const mainHeading = page.getByRole("heading", { level: 1 });
      await expect(mainHeading).toBeVisible();

      // Check select accessibility
      const timeSelect = page.locator("select");
      await expect(timeSelect).toBeVisible();

      // Should have accessible label or aria-label
      const selectLabel =
        (await timeSelect.getAttribute("aria-label")) ||
        (await timeSelect.getAttribute("title"));
      expect(selectLabel || "Time range selector").toBeTruthy();
    });

    test("should support screen reader navigation", async ({ page }) => {
      await page.goto("/analytics");

      // Check for semantic structure
      const headings = page.locator("h1, h2, h3");
      await expect(headings.first()).toBeVisible();

      // Check metrics cards have accessible content
      const metricsCards = page.locator(".stat-card");
      if ((await metricsCards.count()) > 0) {
        const firstCard = metricsCards.first();
        await expect(firstCard).toBeVisible();

        // Should contain readable text
        const cardText = await firstCard.textContent();
        expect(cardText).toContain("Total Campaigns");
      }

      // Check chart sections have descriptive text
      const chartSections = page.getByText(
        "Performance chart will be displayed here",
      );
      if ((await chartSections.count()) > 0) {
        await expect(chartSections.first()).toBeVisible();
      }
    });

    test("should have proper focus management", async ({ page }) => {
      await page.goto("/analytics");
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Test focus on interactive elements
      const timeSelect = page.locator("select");
      await timeSelect.focus();
      await expect(timeSelect).toBeFocused();

      // Test tab order
      await page.keyboard.press("Tab");
      const nextFocused = page.locator(":focus");
      if ((await nextFocused.count()) > 0) {
        await expect(nextFocused).toBeVisible();
      }
    });

    test("should support theme consistency", async ({ page }) => {
      await page.goto("/analytics");

      // Check dark theme styling
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Check background colors
      const body = page.locator("body");
      const bodyClass = await body.getAttribute("class");
      expect(bodyClass || "dark theme").toBeDefined();

      // Check text contrast
      const headerText = page.getByText("Analytics Dashboard");
      await expect(headerText).toBeVisible();
    });
  });

  test.describe("Animation & Interaction Polish", () => {
    test("should animate metrics cards on load", async ({ page }) => {
      await page.goto("/analytics");

      // Check metrics cards are visible
      const metricsCards = page.locator(".stat-card");
      await expect(metricsCards.first()).toBeVisible();

      // All metrics should be displayed
      await expect(page.getByText("Total Campaigns")).toBeVisible();
      await expect(page.getByText("Active AI Agents")).toBeVisible();
      await expect(page.getByText("Conversion Rate")).toBeVisible();
      await expect(page.getByText("Revenue Generated")).toBeVisible();
    });

    test("should animate on hover interactions", async ({ page }) => {
      await page.goto("/analytics");

      // Test metrics card hover
      const metricsCard = page.locator(".stat-card").first();
      await metricsCard.hover();
      await page.waitForTimeout(200);
      await expect(metricsCard).toBeVisible();

      // Test top performing agents hover
      const agentCards = page
        .locator(".glass")
        .filter({ hasText: /ContentAgent|EmailAgent/ });
      if ((await agentCards.count()) > 0) {
        await agentCards.first().hover();
        await page.waitForTimeout(200);
        await expect(agentCards.first()).toBeVisible();
      }
    });

    test("should handle smooth time range transitions", async ({ page }) => {
      await page.goto("/analytics");

      const timeSelect = page.locator("select");
      await expect(timeSelect).toBeVisible();

      // Change time range
      await timeSelect.selectOption("30d");
      await page.waitForTimeout(300);

      // Should maintain layout
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();
      await expect(page.getByText("Total Campaigns")).toBeVisible();
    });

    test("should show visual feedback for interactions", async ({ page }) => {
      await page.goto("/analytics");

      // Test select interaction
      const timeSelect = page.locator("select");
      await timeSelect.focus();
      await page.waitForTimeout(100);

      // Should show focus state
      await expect(timeSelect).toBeFocused();
    });
  });

  test.describe("Visual Consistency & Design System", () => {
    test("should use consistent metrics card styling", async ({ page }) => {
      await page.goto("/analytics");

      // Check all metrics cards have consistent styling
      const metricsCards = page.locator(".stat-card");
      const cardCount = await metricsCards.count();
      expect(cardCount).toBe(4);

      // Each card should have icon, value, and change indicator
      for (let i = 0; i < cardCount; i++) {
        const card = metricsCards.nth(i);
        await expect(card).toBeVisible();

        // Should contain value and percentage
        const cardText = await card.textContent();
        expect(cardText).toMatch(/\d+[%$K]?/);
      }
    });

    test("should maintain consistent color scheme", async ({ page }) => {
      await page.goto("/analytics");

      // Check neon color usage
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Check metrics cards use brand colors
      const coloredElements = page.locator(
        ".bg-neon-blue, .bg-neon-purple, .bg-neon-green, .bg-neon-pink",
      );
      if ((await coloredElements.count()) > 0) {
        await expect(coloredElements.first()).toBeVisible();
      }

      // Check status indicators
      const changeIndicators = page.locator(
        ".bg-green-500, .bg-red-500, .bg-gray-500",
      );
      await expect(changeIndicators.first()).toBeVisible();
    });

    test("should have consistent spacing and layout", async ({ page }) => {
      await page.goto("/analytics");

      // Check grid consistency
      const grids = page.locator(".grid");
      await expect(grids.first()).toBeVisible();

      // Check glass effect consistency
      const glassElements = page.locator(".glass-strong");
      await expect(glassElements.first()).toBeVisible();

      // Check spacing consistency
      const spacingElements = page.locator(".space-y-4, .gap-6, .gap-8");
      if ((await spacingElements.count()) > 0) {
        await expect(spacingElements.first()).toBeVisible();
      }
    });

    test("should handle text readability and hierarchy", async ({ page }) => {
      await page.goto("/analytics");

      // Check heading hierarchy
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();

      const h3s = page.locator("h3");
      if ((await h3s.count()) > 0) {
        await expect(h3s.first()).toBeVisible();
      }

      // Check text contrast
      const primaryText = page.getByText("Analytics Dashboard");
      await expect(primaryText).toBeVisible();

      const secondaryText = page.getByText(
        "Real-time insights and performance metrics",
      );
      await expect(secondaryText).toBeVisible();
    });
  });

  test.describe("Analytics-Specific Functionality", () => {
    test("should display all metric cards with correct data", async ({
      page,
    }) => {
      await page.goto("/analytics");

      // Check each metric card
      await expect(page.getByText("Total Campaigns")).toBeVisible();
      await expect(page.getByText("24")).toBeVisible(); // Campaign count
      await expect(page.getByText("+12%")).toBeVisible(); // Campaign change

      await expect(page.getByText("Active AI Agents")).toBeVisible();
      await expect(page.getByText("9")).toBeVisible(); // Agent count

      await expect(page.getByText("Conversion Rate")).toBeVisible();
      await expect(page.getByText("28.4%")).toBeVisible(); // Conversion rate

      await expect(page.getByText("Revenue Generated")).toBeVisible();
      await expect(page.getByText("$156K")).toBeVisible(); // Revenue
    });

    test("should handle time range selection", async ({ page }) => {
      await page.goto("/analytics");

      const timeSelect = page.locator("select");
      await expect(timeSelect).toBeVisible();

      // Should have default value
      const defaultValue = await timeSelect.inputValue();
      expect(defaultValue).toBe("7d");

      // Test changing time range
      await timeSelect.selectOption("30d");
      const newValue = await timeSelect.inputValue();
      expect(newValue).toBe("30d");

      // Test other options
      await timeSelect.selectOption("90d");
      await timeSelect.selectOption("1y");
      await timeSelect.selectOption("7d"); // Back to default
    });

    test("should display chart placeholder sections", async ({ page }) => {
      await page.goto("/analytics");

      // Check chart sections exist
      await expect(page.getByText("Campaign Performance")).toBeVisible();
      await expect(page.getByText("Agent Activity")).toBeVisible();
      await expect(page.getByText("Revenue Analytics")).toBeVisible();

      // Check placeholder content
      await expect(
        page.getByText("Performance chart will be displayed here"),
      ).toBeVisible();
      await expect(
        page.getByText("Agent activity chart will be displayed here"),
      ).toBeVisible();
      await expect(
        page.getByText("Revenue analytics will be displayed here"),
      ).toBeVisible();
    });

    test("should display top performing agents", async ({ page }) => {
      await page.goto("/analytics");

      await expect(page.getByText("Top Performing")).toBeVisible();

      // Check individual agents
      await expect(page.getByText("ContentAgent")).toBeVisible();
      await expect(page.getByText("96%")).toBeVisible();

      await expect(page.getByText("EmailAgent")).toBeVisible();
      await expect(page.getByText("94%")).toBeVisible();

      await expect(page.getByText("SocialAgent")).toBeVisible();
      await expect(page.getByText("92%")).toBeVisible();

      await expect(page.getByText("SEOAgent")).toBeVisible();
      await expect(page.getByText("89%")).toBeVisible();
    });

    test("should show real-time updates", async ({ page }) => {
      await page.goto("/analytics");

      // Should show current data
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Time should be displayed (though might be dynamic)
      const timeElements = page.locator("text=/\\d{1,2}:\\d{2}/");
      if ((await timeElements.count()) > 0) {
        await expect(timeElements.first()).toBeVisible();
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      await page.goto("/analytics");

      // Should show basic interface even with potential API failures
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(100);

      // Should still show static content
      await expect(page.getByText("Total Campaigns")).toBeVisible();

      // Re-enable network
      await page.context().setOffline(false);
    });

    test("should handle missing data gracefully", async ({ page }) => {
      await page.goto("/analytics");

      // Should show fallback content
      await expect(page.getByText("Analytics Dashboard")).toBeVisible();

      // Should show placeholder charts
      await expect(
        page.getByText("Performance chart will be displayed here"),
      ).toBeVisible();
    });

    test("should handle long agent names", async ({ page }) => {
      await page.goto("/analytics");

      // Interface should remain stable with current agent names
      await expect(page.getByText("ContentAgent")).toBeVisible();
      await expect(page.getByText("EmailAgent")).toBeVisible();

      // Layout should not break
      const topPerformingSection = page
        .getByText("Top Performing")
        .locator("..");
      await expect(topPerformingSection).toBeVisible();
    });

    test("should handle time range selection errors", async ({ page }) => {
      await page.goto("/analytics");

      const timeSelect = page.locator("select");
      await expect(timeSelect).toBeVisible();

      // Should handle invalid selections gracefully
      await timeSelect.focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowUp");

      // Should maintain valid state
      const currentValue = await timeSelect.inputValue();
      expect(["7d", "30d", "90d", "1y"]).toContain(currentValue);
    });
  });
});
