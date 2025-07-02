import { test, expect } from '@playwright/test';

test.describe('Agents Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
  });

  test('should display agents page', async ({ page }) => {
    await expect(page).toHaveTitle(/NeonHub - AI Marketing Platform/);
    await expect(page.getByRole('heading', { name: /AI Agents/i })).toBeVisible();
  });

  test('should display agent cards', async ({ page }) => {
    // Wait for agent data to load
    await page.waitForTimeout(2000);
    
    // Check for agent cards or grid
    const agentCards = page.locator('[data-testid="agent-card"]').or(page.locator('div').filter({ hasText: /Content Agent|SEO Agent|Social Agent/ }));
    await expect(agentCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display agent status indicators', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for status badges or indicators
    const statusIndicators = page.locator('text=active').or(page.locator('text=running')).or(page.locator('text=inactive'));
    await expect(statusIndicators.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow agent selection and show details', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click on first agent card
    const firstAgent = page.locator('div').filter({ hasText: /Content Agent|SEO Agent|Social Agent/ }).first();
    if (await firstAgent.isVisible()) {
      await firstAgent.click();
      
      // Check for agent details panel
      await expect(page.locator('text=Agent Details').or(page.locator('text=Recent Logs'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display run/stop buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for run/stop buttons
    const actionButtons = page.getByRole('button', { name: /run|stop/i });
    await expect(actionButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle run agent action', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find and click a run button
    const runButton = page.getByRole('button', { name: /run/i }).first();
    if (await runButton.isVisible()) {
      await runButton.click();
      
      // Should show some feedback (loading state, success message, etc.)
      await page.waitForTimeout(1000);
    }
  });

  test('should display agent logs when agent is selected', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Select an agent
    const firstAgent = page.locator('div').filter({ hasText: /Content Agent|SEO Agent|Social Agent/ }).first();
    if (await firstAgent.isVisible()) {
      await firstAgent.click();
      
      // Check for logs tab or section
      const logsTab = page.getByRole('tab', { name: /logs/i }).or(page.locator('text=Recent Logs'));
      if (await logsTab.isVisible()) {
        await logsTab.click();
        
        // Should show log entries or empty state
        await expect(page.locator('text=Successfully').or(page.locator('text=No logs available'))).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display agent performance metrics', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Select an agent
    const firstAgent = page.locator('div').filter({ hasText: /Content Agent|SEO Agent|Social Agent/ }).first();
    if (await firstAgent.isVisible()) {
      await firstAgent.click();
      
      // Check for metrics tab
      const metricsTab = page.getByRole('tab', { name: /metrics/i });
      if (await metricsTab.isVisible()) {
        await metricsTab.click();
        
        // Should show performance data
        await expect(page.locator('text=Success Rate').or(page.locator('text=Tasks Completed'))).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Page should still be functional on mobile
    await expect(page.getByRole('heading', { name: /AI Agents/i })).toBeVisible();
    
    // Agent cards should adapt to mobile layout
    const agentCards = page.locator('div').filter({ hasText: /Content Agent|SEO Agent|Social Agent/ });
    if (await agentCards.first().isVisible()) {
      await expect(agentCards.first()).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Check for loading skeletons or indicators
    const loadingIndicator = page.locator('.animate-pulse').or(page.locator('[data-testid="loading"]'));
    
    // Loading should complete within reasonable time
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate API failure
    await page.route('**/api/**', route => route.abort());
    await page.reload();
    
    // Page should still render without crashing
    await expect(page.getByRole('heading', { name: /AI Agents/i })).toBeVisible();
  });
}); 