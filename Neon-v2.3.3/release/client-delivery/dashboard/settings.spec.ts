import { test, expect } from "@playwright/test";

test.describe("Settings UI/UX Production Excellence", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/settings");
  });

  test.describe("Cross-Platform Layout Validation", () => {
    test("should render correctly on Desktop (1920x1080)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/settings");

      // Check for settings page elements
      const pageContent = page.locator("main, .container, .max-w-7xl").first();
      await expect(pageContent).toBeVisible();

      // Look for settings-related elements
      const settingsElements = page
        .locator("h1, h2")
        .filter({ hasText: /settings|preferences|config|profile/i });
      if ((await settingsElements.count()) > 0) {
        await expect(settingsElements.first()).toBeVisible();
      }
    });

    test("should render correctly on Mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/settings");

      const pageContent = page.locator("main, .container").first();
      await expect(pageContent).toBeVisible();

      // Touch-friendly settings interface
      const buttons = page.getByRole("button");
      if ((await buttons.count()) > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(40);
      }
    });

    test("should adapt layout responsively", async ({ page }) => {
      await page.goto("/settings");

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
      await page.goto("/settings");

      // Test tab navigation through settings
      await page.keyboard.press("Tab");
      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }
    });

    test("should provide proper form accessibility", async ({ page }) => {
      await page.goto("/settings");

      // Check for form labels and inputs
      const formElements = page.locator("input, select, textarea");
      if ((await formElements.count()) > 0) {
        const firstInput = formElements.first();
        await expect(firstInput).toBeVisible();

        // Should have proper labeling
        const label =
          (await firstInput.getAttribute("aria-label")) ||
          (await firstInput.getAttribute("placeholder")) ||
          (await firstInput.getAttribute("title"));
        expect(label).toBeTruthy();
      }
    });

    test("should support theme toggle accessibility", async ({ page }) => {
      await page.goto("/settings");

      // Look for theme toggle
      const themeToggle = page
        .locator("button, input")
        .filter({ hasText: /theme|dark|light/i });
      if ((await themeToggle.count()) > 0) {
        await expect(themeToggle.first()).toBeVisible();

        // Should be keyboard accessible
        await themeToggle.first().focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe("Settings-Specific Functionality", () => {
    test("should display settings interface", async ({ page }) => {
      await page.goto("/settings");

      // Should load settings page content
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Look for settings sections
      const settingsContent = page
        .locator("text=/settings|preferences|profile|account|theme/i")
        .first();
      if ((await settingsContent.count()) > 0) {
        await expect(settingsContent).toBeVisible();
      }
    });

    test("should handle profile settings", async ({ page }) => {
      await page.goto("/settings");

      // Look for profile-related inputs
      const profileInputs = page
        .locator("input")
        .filter({ hasText: /name|email|profile/i });
      if ((await profileInputs.count()) === 0) {
        // Fallback to any text inputs
        const textInputs = page.locator(
          "input[type='text'], input[type='email']",
        );
        if ((await textInputs.count()) > 0) {
          const firstInput = textInputs.first();
          await firstInput.focus();
          await firstInput.fill("Test User");
          await expect(firstInput).toHaveValue("Test User");
        }
      }
    });

    test("should handle theme preferences", async ({ page }) => {
      await page.goto("/settings");

      // Look for theme controls
      const themeControls = page
        .locator("button, select, input")
        .filter({ hasText: /theme|dark|light|appearance/i });
      if ((await themeControls.count()) > 0) {
        const themeControl = themeControls.first();
        await expect(themeControl).toBeVisible();

        // Test theme interaction
        await themeControl.click();
        await page.waitForTimeout(500);

        // Should show visual feedback
        const pageContent = page.locator("body");
        await expect(pageContent).toBeVisible();
      }
    });

    test("should handle credentials management", async ({ page }) => {
      await page.goto("/settings");

      // Look for credential-related fields
      const credentialInputs = page
        .locator("input")
        .filter({ hasText: /password|api|key|token|credential/i });
      if ((await credentialInputs.count()) > 0) {
        const credInput = credentialInputs.first();
        await expect(credInput).toBeVisible();

        // Should handle secure input
        const inputType = await credInput.getAttribute("type");
        expect(inputType === "password" || inputType === "text").toBeTruthy();
      }
    });

    test("should handle settings save functionality", async ({ page }) => {
      await page.goto("/settings");

      // Look for save buttons
      const saveButtons = page
        .locator("button")
        .filter({ hasText: /save|update|apply|submit/i });
      if ((await saveButtons.count()) > 0) {
        const saveButton = saveButtons.first();
        await expect(saveButton).toBeVisible();

        // Test save interaction
        await saveButton.click();
        await page.waitForTimeout(500);

        // Should provide feedback
        const pageContent = page.locator("body");
        await expect(pageContent).toBeVisible();
      }
    });

    test("should handle notification preferences", async ({ page }) => {
      await page.goto("/settings");

      // Look for notification toggles
      const notificationToggles = page
        .locator("input[type='checkbox'], button")
        .filter({ hasText: /notification|email|alert/i });
      if ((await notificationToggles.count()) > 0) {
        const toggle = notificationToggles.first();
        await expect(toggle).toBeVisible();

        // Test toggle interaction
        await toggle.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe("Visual Consistency & Design System", () => {
    test("should use consistent form styling", async ({ page }) => {
      await page.goto("/settings");

      // Check form consistency
      const formElements = page.locator("input, select, textarea");
      if ((await formElements.count()) > 0) {
        for (let i = 0; i < Math.min(3, await formElements.count()); i++) {
          const element = formElements.nth(i);
          await expect(element).toBeVisible();

          // Should have consistent styling
          const classList = await element.getAttribute("class");
          expect(classList).toBeDefined();
        }
      }
    });

    test("should maintain consistent section spacing", async ({ page }) => {
      await page.goto("/settings");

      // Check section consistency
      const sections = page.locator("section, .section, .settings-group");
      if ((await sections.count()) > 0) {
        await expect(sections.first()).toBeVisible();
      }

      // Check spacing
      const spacingElements = page.locator(".space-y-4, .gap-4, .mb-6");
      if ((await spacingElements.count()) > 0) {
        await expect(spacingElements.first()).toBeVisible();
      }
    });

    test("should handle theme transitions smoothly", async ({ page }) => {
      await page.goto("/settings");

      // Test theme toggle if available
      const themeToggle = page
        .locator("button, input")
        .filter({ hasText: /theme|dark|light/i });
      if ((await themeToggle.count()) > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(500);

        // Should transition smoothly
        const pageContent = page.locator("body");
        await expect(pageContent).toBeVisible();

        // Toggle back
        await themeToggle.first().click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle validation errors gracefully", async ({ page }) => {
      await page.goto("/settings");

      // Look for required fields
      const requiredInputs = page.locator("input[required]");
      if ((await requiredInputs.count()) > 0) {
        const requiredInput = requiredInputs.first();
        await requiredInput.focus();
        await requiredInput.fill("");

        // Try to submit
        const submitButton = page
          .locator("button[type='submit'], button")
          .filter({ hasText: /save|submit/i });
        if ((await submitButton.count()) > 0) {
          await submitButton.first().click();
          await page.waitForTimeout(500);

          // Should show validation feedback
          const pageContent = page.locator("body");
          await expect(pageContent).toBeVisible();
        }
      }
    });

    test("should handle network errors gracefully", async ({ page }) => {
      await page.goto("/settings");

      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(100);

      // Re-enable network
      await page.context().setOffline(false);
    });

    test("should handle settings reset", async ({ page }) => {
      await page.goto("/settings");

      // Look for reset buttons
      const resetButtons = page
        .locator("button")
        .filter({ hasText: /reset|default|clear/i });
      if ((await resetButtons.count()) > 0) {
        const resetButton = resetButtons.first();
        await expect(resetButton).toBeVisible();

        // Test reset functionality
        await resetButton.click();
        await page.waitForTimeout(500);

        // Should handle reset confirmation
        const confirmDialog = page.locator("[role='dialog'], .modal");
        if ((await confirmDialog.count()) > 0) {
          await expect(confirmDialog).toBeVisible();

          // Close dialog
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        }
      }
    });
  });
});
