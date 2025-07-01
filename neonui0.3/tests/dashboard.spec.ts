import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard page title', async ({ page }) => {
    await expect(page).toHaveTitle(/NeonHub - AI Marketing Platform/);
  });

  test('should display main dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for main navigation links
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /agents/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /campaigns/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('should display welcome message', async ({ page }) => {
    // Look for welcome content or dashboard overview
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that the page is still functional on mobile
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Navigation might be collapsed on mobile
    const mobileNav = page.locator('[data-testid="mobile-nav"]').or(page.locator('button[aria-label*="menu"]'));
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      await expect(page.getByRole('link', { name: /agents/i })).toBeVisible();
    }
  });

  test('should navigate to other pages', async ({ page }) => {
    // Test navigation to agents page
    await page.getByRole('link', { name: /agents/i }).click();
    await expect(page).toHaveURL(/.*\/agents/);
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Check for loading indicators or skeleton states
    const loadingIndicator = page.locator('[data-testid="loading"]').or(page.locator('.animate-pulse'));
    
    // If loading states exist, they should eventually disappear
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeHidden({ timeout: 15000 });
    }
  });

  test('should display proper error states', async ({ page }) => {
    // Test error handling by simulating network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.reload();
    
    // Should handle API failures gracefully
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
}); 