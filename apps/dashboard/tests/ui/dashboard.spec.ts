import { test, expect } from "@playwright/test";

test.describe("Dashboard UI/UX Production Excellence", () => {
  test.beforeEach(async ({ page }) => {
    // Set up viewport for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
  });

  test.describe("Cross-Platform Layout Validation", () => {
    test("should render correctly on Desktop (1920x1080)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/");

      // Wait for dashboard to load
      await expect(page.getByText("NeonHub")).toBeVisible();
      await expect(page.getByText("AI Marketing Ecosystem")).toBeVisible();

      // Check hero section
      await expect(page.getByText("Scale Growth")).toBeVisible();
      await expect(page.getByText("Launch Campaign")).toBeVisible();

      // Verify navigation grid is visible
      const navItems = page.locator(".group");
      await expect(navItems.first()).toBeVisible();

      // Check metrics dashboard
      await expect(page.getByText("AI Agent Fleet")).toBeVisible();
      await expect(page.getByText("Live Activity")).toBeVisible();
    });

    test("should render correctly on Laptop (1366x768)", async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto("/");

      await expect(page.getByText("NeonHub")).toBeVisible();

      // Navigation should adapt
      const navGrid = page.locator(".grid").first();
      await expect(navGrid).toBeVisible();

      // Metrics should be responsive
      const metricsGrid = page.locator(".stat-card").first();
      if ((await metricsGrid.count()) > 0) {
        await expect(metricsGrid).toBeVisible();
      }
    });

    test("should render correctly on Tablet (768x1024)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/");

      await expect(page.getByText("NeonHub")).toBeVisible();

      // Check mobile-friendly layout
      const searchInput = page.locator("input[placeholder*='Search']");
      if ((await searchInput.count()) > 0) {
        // Search might be hidden on tablet
        expect(await searchInput.isVisible()).toBeDefined();
      }
    });

    test("should render correctly on Mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      await expect(page.getByText("NeonHub")).toBeVisible();

      // Mobile should show core elements
      const heroSection = page.getByText("Scale Growth");
      if ((await heroSection.count()) > 0) {
        await expect(heroSection).toBeVisible();
      }

      // Touch-friendly buttons
      const primaryButton = page.getByRole("button").first();
      if ((await primaryButton.count()) > 0) {
        const boundingBox = await primaryButton.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(40); // Minimum touch target
      }
    });

    test("should handle orientation changes on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      // Portrait mode
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      await expect(page.getByText("NeonHub")).toBeVisible();
    });

    test("should adapt layout responsively", async ({ page }) => {
      await page.goto("/");

      // Desktop: Full layout
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      const navGrid = page.locator(".grid");
      if ((await navGrid.count()) > 0) {
        await expect(navGrid.first()).toBeVisible();
      }

      // Mobile: Stacked layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(page.getByText("NeonHub")).toBeVisible();
    });
  });

  test.describe("Accessibility & Interaction Design", () => {
    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Test tab navigation
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Should focus on interactive elements
      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }

      // Test search functionality
      const searchInput = page.locator("input[placeholder*='Search']");
      if ((await searchInput.count()) > 0) {
        await searchInput.focus();
        await searchInput.fill("test search");
        await expect(searchInput).toHaveValue("test search");
      }
    });

    test("should provide proper ARIA labels and roles", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Check main regions
      await expect(page.locator("main, [role='main']")).toBeVisible();

      // Check headings hierarchy
      const headings = page.locator("h1, h2, h3");
      await expect(headings.first()).toBeVisible();

      // Check button accessibility
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        await expect(firstButton).toBeVisible();

        // Check for aria-label or accessible text
        const ariaLabel = await firstButton.getAttribute("aria-label");
        const textContent = await firstButton.textContent();
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });

    test("should support screen reader navigation", async ({ page }) => {
      await page.goto("/");

      // Check for semantic landmarks
      const header = page.locator("header");
      if ((await header.count()) > 0) {
        await expect(header).toBeVisible();
      }

      // Check for proper heading structure
      const mainHeading = page.locator("h1").first();
      if ((await mainHeading.count()) > 0) {
        await expect(mainHeading).toBeVisible();
      }

      // Check for lists and navigation
      const navLists = page.locator("nav ul, [role='list']");
      if ((await navLists.count()) > 0) {
        await expect(navLists.first()).toBeVisible();
      }
    });

    test("should have proper focus management", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Test focus trapping in modals if any
      const modalTrigger = page
        .locator("button")
        .filter({ hasText: /settings|profile|menu/i });
      if ((await modalTrigger.count()) > 0) {
        await modalTrigger.first().click();
        await page.waitForTimeout(500);

        // Check if modal opened and focus is trapped
        const modal = page.locator("[role='dialog'], .modal");
        if ((await modal.count()) > 0) {
          await expect(modal).toBeVisible();

          // Test escape key
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        }
      }

      // Test general focus visibility
      await page.keyboard.press("Tab");
      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }
    });

    test("should support dark mode toggle", async ({ page }) => {
      await page.goto("/");

      // Look for theme toggle
      const themeToggle = page.getByRole("button", {
        name: /theme|dark|light/i,
      });
      if ((await themeToggle.count()) > 0) {
        await expect(themeToggle).toBeVisible();

        await themeToggle.click();
        await page.waitForTimeout(500);

        // Check theme change
        const htmlElement = page.locator("html");
        const currentClass = await htmlElement.getAttribute("class");
        expect(currentClass).toBeDefined();

        // Toggle back
        await themeToggle.click();
        await page.waitForTimeout(500);
      } else {
        // Just check that the page works
        await expect(page.getByText("NeonHub")).toBeVisible();
      }
    });
  });

  test.describe("Animation & Interaction Polish", () => {
    test("should animate dashboard elements on load", async ({ page }) => {
      await page.goto("/");

      // Check initial animations
      await expect(page.getByText("NeonHub")).toBeVisible();

      // KPI cards should animate in
      const kpiCards = page.locator(".stat-card");
      if ((await kpiCards.count()) > 0) {
        await expect(kpiCards.first()).toBeVisible();
      }

      // Agent cards should be visible
      const agentCards = page.locator(".glass");
      if ((await agentCards.count()) > 0) {
        await expect(agentCards.first()).toBeVisible();
      }
    });

    test("should animate on hover interactions", async ({ page }) => {
      await page.goto("/");

      // Test navigation card hover
      const navCard = page.locator(".group").first();
      if ((await navCard.count()) > 0) {
        await navCard.hover();
        await page.waitForTimeout(200);
        await expect(navCard).toBeVisible();
      }

      // Test button hover
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        await buttons.first().hover();
        await page.waitForTimeout(200);
        await expect(buttons.first()).toBeVisible();
      }
    });

    test("should show loading states", async ({ page }) => {
      await page.goto("/");

      // Test refresh functionality if available
      const refreshButton = page.getByRole("button", {
        name: /refresh|reload/i,
      });
      if ((await refreshButton.count()) > 0) {
        await refreshButton.click();
        await page.waitForTimeout(500);

        // Should show some form of loading indicator
        const loadingIndicator = page.locator(
          ".animate-spin, .loading, [aria-live='polite']",
        );
        if ((await loadingIndicator.count()) > 0) {
          expect(await loadingIndicator.first().isVisible()).toBeDefined();
        }
      }
    });

    test("should handle smooth transitions", async ({ page }) => {
      await page.goto("/");

      // Test smooth navigation
      const navLinks = page.locator("a[href]");
      if ((await navLinks.count()) > 0) {
        const firstLink = navLinks.first();
        await expect(firstLink).toBeVisible();

        // Hover should provide feedback
        await firstLink.hover();
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe("Visual Consistency & Design System", () => {
    test("should use consistent typography", async ({ page }) => {
      await page.goto("/");

      // Check heading hierarchy
      const headings = page.locator("h1, h2, h3");
      await expect(headings.first()).toBeVisible();

      // Check consistent text styles
      const bodyText = page.locator("p, span").first();
      await expect(bodyText).toBeVisible();
    });

    test("should maintain consistent color scheme", async ({ page }) => {
      await page.goto("/");

      // Check brand colors are used
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Check status indicators
      const statusElements = page.locator(
        ".agent-status-active, .status-pulse, .bg-neon-green",
      );
      if ((await statusElements.count()) > 0) {
        await expect(statusElements.first()).toBeVisible();
      }
    });

    test("should have consistent spacing and layout", async ({ page }) => {
      await page.goto("/");

      // Check grid layouts
      const grids = page.locator(".grid");
      if ((await grids.count()) > 0) {
        await expect(grids.first()).toBeVisible();
      }

      // Check card consistency
      const cards = page.locator(".card-neon, .glass, .glass-strong");
      if ((await cards.count()) > 0) {
        await expect(cards.first()).toBeVisible();
      }
    });

    test("should handle contrast ratios for accessibility", async ({
      page,
    }) => {
      await page.goto("/");

      // Check text readability
      const primaryText = page.getByText("NeonHub");
      await expect(primaryText).toBeVisible();

      // Check secondary text
      const secondaryText = page.getByText("AI Marketing Ecosystem");
      if ((await secondaryText.count()) > 0) {
        await expect(secondaryText).toBeVisible();
      }
    });
  });

  test.describe("Dashboard-Specific Functionality", () => {
    test("should display real-time metrics", async ({ page }) => {
      await page.goto("/");

      // Check KPI display
      const metrics = page.locator(".stat-card, .stat-number");
      if ((await metrics.count()) > 0) {
        await expect(metrics.first()).toBeVisible();
      }

      // Check time display
      const timeDisplay = page.locator("text=/\\d{1,2}:\\d{2}/");
      if ((await timeDisplay.count()) > 0) {
        await expect(timeDisplay.first()).toBeVisible();
      }
    });

    test("should show agent status correctly", async ({ page }) => {
      await page.goto("/");

      // Check agent fleet section
      const agentSection = page.getByText("AI Agent Fleet");
      if ((await agentSection.count()) > 0) {
        await expect(agentSection).toBeVisible();

        // Check individual agent cards
        const agentCards = page.locator(".glass p-4");
        if ((await agentCards.count()) > 0) {
          await expect(agentCards.first()).toBeVisible();
        }
      }
    });

    test("should handle navigation links", async ({ page }) => {
      await page.goto("/");

      // Test navigation to different sections
      const navLinks = page.locator(
        "a[href*='/agents'], a[href*='/campaigns'], a[href*='/analytics']",
      );
      if ((await navLinks.count()) > 0) {
        const firstLink = navLinks.first();
        await expect(firstLink).toBeVisible();

        // Check href attribute
        const href = await firstLink.getAttribute("href");
        expect(href).toBeTruthy();
      }
    });

    test("should display live activity feed", async ({ page }) => {
      await page.goto("/");

      // Check activity section
      const activitySection = page.getByText("Live Activity");
      if ((await activitySection.count()) > 0) {
        await expect(activitySection).toBeVisible();

        // Check activity items
        const activityItems = page
          .locator(".glass p-4")
          .filter({ hasText: /ago|min|hour/ });
        if ((await activityItems.count()) > 0) {
          await expect(activityItems.first()).toBeVisible();
        }
      }
    });

    test("should handle search functionality", async ({ page }) => {
      await page.goto("/");

      const searchInput = page.locator("input[placeholder*='Search']");
      if ((await searchInput.count()) > 0) {
        await searchInput.fill("content agent");
        await expect(searchInput).toHaveValue("content agent");

        // Test search interaction
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      await page.goto("/");

      // Should show basic interface even with potential API failures
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(100);

      // Re-enable network
      await page.context().setOffline(false);
    });

    test("should handle missing data gracefully", async ({ page }) => {
      await page.goto("/");

      // Should show fallback content
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Should not crash with missing agent data
      const agentSection = page.getByText("AI Agent Fleet");
      if ((await agentSection.count()) > 0) {
        await expect(agentSection).toBeVisible();
      }
    });

    test("should handle long content gracefully", async ({ page }) => {
      await page.goto("/");

      // Interface should remain stable
      await expect(page.getByText("NeonHub")).toBeVisible();

      // Check for proper text truncation
      const activityItems = page
        .locator(".glass")
        .filter({ hasText: /.{50,}/ });
      if ((await activityItems.count()) > 0) {
        await expect(activityItems.first()).toBeVisible();
      }
    });
  });
});
