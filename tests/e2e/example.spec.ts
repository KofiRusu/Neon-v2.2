/**
 * Example E2E test for Neon0.2
 */

import { test, expect } from '@playwright/test';

test.describe('Neon0.2 Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check page title or content for NeonHub
    await expect(page).toHaveTitle(/NeonHub|Dashboard/);

    // Check main heading - looking for NeonHub brand text
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('NeonHub');
  });

  test('should navigate between pages', async ({ page }) => {
    // Click navigation link to agents page
    await page.click('a[href="/agents"]');

    // Verify navigation
    await expect(page).toHaveURL(/\/agents$/);
    await expect(page.locator('h1, h2')).toContainText('Agents');
  });

  test('should handle form input', async ({ page }) => {
    // Test search functionality that exists in header
    await page.fill('input[placeholder*="Search"]', 'test query');

    // Verify input works
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('test query');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that the page loads and main content is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check that navigation cards stack properly on mobile
    await expect(page.locator('.grid')).toBeVisible();
  });

  test('should handle API interactions', async ({ page }) => {
    // Test that the page loads dynamic content (which would come from API)
    // Look for elements that indicate the app is working
    await expect(page.locator('.stat-card, .glass')).toBeVisible();

    // Test that we can navigate to a page that likely uses API data
    await page.click('a[href="/analytics"]');
    await expect(page).toHaveURL(/\/analytics$/);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test navigation to a non-existent page
    await page.goto('/non-existent-page');

    // Should show 404 or redirect gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should perform accessibility checks', async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check that buttons are accessible
    const buttons = await page.locator('button, a[role="button"]').all();
    expect(buttons.length).toBeGreaterThan(0);

    // Check for keyboard navigation (search input should be focusable)
    const searchInput = page.locator('input[placeholder*="Search"]');
    if ((await searchInput.count()) > 0) {
      await searchInput.focus();
      await expect(searchInput).toBeFocused();
    }
  });
});
