import { test, expect } from "@playwright/test";

test.describe("Visual Regression Testing", () => {
  // Configure test timeouts for visual testing
  test.setTimeout(60000);

  const viewports = [
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Laptop", width: 1366, height: 768 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 667 },
  ];

  const criticalPages = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/analytics", name: "Analytics" },
    { path: "/campaigns", name: "Campaigns" },
    { path: "/copilot", name: "Copilot" },
    { path: "/agents", name: "Agents" },
    { path: "/settings", name: "Settings" },
  ];

  test.beforeEach(async ({ page }) => {
    // Wait for fonts to load and eliminate font loading shifts
    await page.addInitScript(() => {
      document.fonts.ready.then(() => {
        document.body.classList.add("fonts-loaded");
      });
    });
  });

  // Test each critical page across all viewports
  for (const viewport of viewports) {
    for (const pageDef of criticalPages) {
      test(`${pageDef.name} page - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        // Set viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Navigate to page
        await page.goto(pageDef.path);

        // Wait for page to be fully loaded
        await page.waitForLoadState("networkidle");

        // Wait for any animations to complete
        await page.waitForTimeout(2000);

        // Wait for fonts to load
        await page.waitForFunction(
          () =>
            document.fonts.status === "loaded" ||
            document.fonts.status === "loading",
        );

        // Hide dynamic elements that change between runs
        await page.addStyleTag({
          content: `
            /* Hide dynamic content for consistent snapshots */
            .animate-pulse,
            .loading-spinner,
            .relative-time,
            .timestamp,
            [data-testid="loading"],
            .live-indicator {
              visibility: hidden !important;
            }
            
            /* Ensure consistent state for interactive elements */
            button:hover,
            a:hover,
            .hover\\:scale-105 {
              transform: none !important;
            }
          `,
        });

        // Additional wait for any remaining async content
        await page.waitForTimeout(1000);

        // Take full page screenshot
        await expect(page).toHaveScreenshot(
          `${pageDef.name.toLowerCase()}-${viewport.name.toLowerCase()}-full-page.png`,
          {
            fullPage: true,
            animations: "disabled",
            caret: "hide",
          },
        );

        // Take viewport screenshot (above the fold)
        await expect(page).toHaveScreenshot(
          `${pageDef.name.toLowerCase()}-${viewport.name.toLowerCase()}-viewport.png`,
          {
            fullPage: false,
            animations: "disabled",
            caret: "hide",
          },
        );

        // Test key UI components are visible and properly positioned
        const body = page.locator("body");
        await expect(body).toBeVisible();

        // Check for layout shift indicators
        const layoutShiftElements = page.locator(
          ".cls-detected, .layout-shift",
        );
        if ((await layoutShiftElements.count()) > 0) {
          console.warn(
            `⚠️ Layout shift detected on ${pageDef.name} - ${viewport.name}`,
          );
        }
      });
    }
  }

  // Test critical UI component states
  test.describe("Component State Testing", () => {
    test("Navigation menu states - Desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Test navigation in default state
      const nav = page.locator("nav, .navigation, .sidebar").first();
      if ((await nav.count()) > 0) {
        await expect(nav).toHaveScreenshot("navigation-default.png", {
          animations: "disabled",
        });

        // Test hover states on navigation items
        const navLinks = nav.locator("a, button").first();
        if ((await navLinks.count()) > 0) {
          await navLinks.hover();
          await page.waitForTimeout(500);
          await expect(nav).toHaveScreenshot("navigation-hover.png", {
            animations: "disabled",
          });
        }
      }
    });

    test("Mobile navigation states", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Test mobile menu button
      const mobileMenuButton = page.locator(
        '[data-testid="mobile-nav"], button[aria-label*="menu"], .mobile-menu-button',
      );

      if ((await mobileMenuButton.count()) > 0) {
        // Closed state
        await expect(page).toHaveScreenshot("mobile-nav-closed.png", {
          animations: "disabled",
        });

        // Open mobile menu
        await mobileMenuButton.first().click();
        await page.waitForTimeout(500);

        // Opened state
        await expect(page).toHaveScreenshot("mobile-nav-open.png", {
          animations: "disabled",
        });
      }
    });

    test("Dark mode vs Light mode", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Test light mode
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot("dashboard-light-mode.png", {
        fullPage: false,
        animations: "disabled",
      });

      // Test dark mode
      await page.evaluate(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot("dashboard-dark-mode.png", {
        fullPage: false,
        animations: "disabled",
      });
    });
  });

  // Test error states and edge cases
  test.describe("Error State Visual Testing", () => {
    test("Network error state", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Simulate network failure
      await page.route("**/api/**", (route) => route.abort());

      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000); // Wait for error states to appear

      await expect(page).toHaveScreenshot("dashboard-network-error.png", {
        fullPage: false,
        animations: "disabled",
      });
    });

    test("Empty state visuals", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Mock empty data responses
      await page.route("**/api/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [], items: [], results: [] }),
        });
      });

      await page.goto("/analytics");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      await expect(page).toHaveScreenshot("analytics-empty-state.png", {
        fullPage: false,
        animations: "disabled",
      });
    });
  });
});
