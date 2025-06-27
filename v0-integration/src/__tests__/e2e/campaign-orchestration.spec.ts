import { test, expect } from '@playwright/test';

test.describe('Campaign Orchestration System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
  });

  test('displays campaign orchestration dashboard', async ({ page }) => {
    // Verify header and title
    await expect(page.locator('h1')).toContainText('Campaign Orchestration');
    await expect(page.locator('text=Multi-Agent AI Campaign Control Center')).toBeVisible();

    // Verify stats cards
    await expect(page.locator('text=Active Campaigns')).toBeVisible();
    await expect(page.locator('text=Total Budget')).toBeVisible();
    await expect(page.locator('text=Active Agents')).toBeVisible();
    await expect(page.locator('text=Automations')).toBeVisible();
  });

  test('shows campaign list with orchestration data', async ({ page }) => {
    // Wait for campaigns to load
    await page.waitForSelector('[data-testid="campaign-card"]', { timeout: 10000 });

    // Verify campaign cards display
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    await expect(campaignCards.first()).toBeVisible();

    // Check campaign details
    await expect(page.locator('text=Q4 Holiday Product Launch')).toBeVisible();
    await expect(page.locator('text=running')).toBeVisible();

    // Verify progress indicators
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('text=CTR:')).toBeVisible();
    await expect(page.locator('text=CVR:')).toBeVisible();
  });

  test('handles campaign status changes', async ({ page }) => {
    // Find a running campaign
    const runningCampaign = page
      .locator('[data-testid="campaign-card"]')
      .filter({ hasText: 'running' })
      .first();
    await expect(runningCampaign).toBeVisible();

    // Click pause button
    await runningCampaign.locator('[data-testid="pause-campaign"]').click();

    // Verify status change (mocked response)
    await expect(page.locator('text=Campaign paused successfully')).toBeVisible({ timeout: 5000 });
  });

  test('opens agent orchestration matrix', async ({ page }) => {
    // Select a campaign
    await page.locator('[data-testid="campaign-card"]').first().click();

    // Open agent matrix
    await page.locator('[data-testid="view-matrix-btn"]').click();

    // Verify matrix modal opens
    await expect(page.locator('text=Agent Orchestration Matrix')).toBeVisible();
    await expect(page.locator('text=Real-time multi-agent coordination')).toBeVisible();

    // Verify agent grid structure
    await expect(page.locator('text=Agent / Stage')).toBeVisible();
    await expect(page.locator('text=creative')).toBeVisible();
    await expect(page.locator('text=launch')).toBeVisible();
    await expect(page.locator('text=feedback')).toBeVisible();

    // Verify agent types
    await expect(page.locator('text=ContentAgent')).toBeVisible();
    await expect(page.locator('text=TrendAgent')).toBeVisible();
    await expect(page.locator('text=AdAgent')).toBeVisible();
  });

  test('shows agent task details in matrix', async ({ page }) => {
    // Open matrix
    await page.locator('[data-testid="campaign-card"]').first().click();
    await page.locator('[data-testid="view-matrix-btn"]').click();

    // Click on a task cell
    await page.locator('[data-testid="agent-task-cell"]').first().click();

    // Verify task details panel
    await expect(page.locator('text=Task Details')).toBeVisible();
    await expect(page.locator('text=Task Description')).toBeVisible();
    await expect(page.locator('text=LLM Prompt')).toBeVisible();
    await expect(page.locator('text=Priority')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
  });

  test('opens campaign timeline', async ({ page }) => {
    // Select campaign and open timeline
    await page.locator('[data-testid="campaign-card"]').first().click();
    await page.locator('[data-testid="view-timeline-btn"]').click();

    // Verify timeline modal
    await expect(page.locator('text=Campaign Timeline')).toBeVisible();
    await expect(page.locator('text=Gantt-style agent task visualization')).toBeVisible();

    // Verify timeframe selector
    await expect(page.locator('text=Day')).toBeVisible();
    await expect(page.locator('text=Week')).toBeVisible();
    await expect(page.locator('text=Month')).toBeVisible();

    // Verify timeline structure
    await expect(page.locator('text=Creative Stage')).toBeVisible();
    await expect(page.locator('text=Launch Stage')).toBeVisible();
  });

  test('switches timeline timeframes', async ({ page }) => {
    // Open timeline
    await page.locator('[data-testid="campaign-card"]').first().click();
    await page.locator('[data-testid="view-timeline-btn"]').click();

    // Switch to day view
    await page.locator('button:has-text("Day")').click();
    await expect(page.locator('button:has-text("Day")')).toHaveClass(/bg-blue-500/);

    // Switch to month view
    await page.locator('button:has-text("Month")').click();
    await expect(page.locator('button:has-text("Month")')).toHaveClass(/bg-blue-500/);
  });

  test('shows task dependencies in timeline', async ({ page }) => {
    // Open timeline
    await page.locator('[data-testid="campaign-card"]').first().click();
    await page.locator('[data-testid="view-timeline-btn"]').click();

    // Look for dependency indicators
    await expect(page.locator('[data-testid="task-dependency"]')).toBeVisible();

    // Click on task with dependencies
    await page.locator('[data-testid="timeline-task"]').first().click();

    // Verify dependency information in details panel
    await expect(page.locator('text=Dependencies')).toBeVisible();
  });

  test('handles live refresh toggle', async ({ page }) => {
    // Verify live refresh is initially enabled
    const liveToggle = page.locator('[data-testid="auto-refresh-toggle"]');
    await expect(liveToggle).toContainText('Live');

    // Toggle off
    await liveToggle.click();
    await expect(liveToggle).toContainText('Manual');

    // Toggle back on
    await liveToggle.click();
    await expect(liveToggle).toContainText('Live');
  });

  test('filters campaigns by status', async ({ page }) => {
    // Open status filter dropdown
    await page.locator('[data-testid="status-filter"]').selectOption('running');

    // Verify only running campaigns are shown
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    await expect(campaignCards).toHaveCount(1); // Based on mock data
    await expect(campaignCards.first()).toContainText('running');

    // Filter by completed
    await page.locator('[data-testid="status-filter"]').selectOption('completed');
    await expect(page.locator('[data-testid="campaign-card"]')).toContainText('completed');
  });

  test('shows campaign triggers and alerts', async ({ page }) => {
    // Select campaign with triggers
    await page.locator('[data-testid="campaign-card"]').first().click();

    // Verify triggers section in details panel
    await expect(page.locator('text=Active Triggers')).toBeVisible();
    await expect(page.locator('text=Low CTR Alert')).toBeVisible();
    await expect(page.locator('text=Negative Sentiment Detection')).toBeVisible();
  });

  test('handles campaign orchestration actions', async ({ page }) => {
    // Find campaign controls
    const campaignCard = page.locator('[data-testid="campaign-card"]').first();

    // Test run campaign
    await campaignCard.locator('[data-testid="run-campaign"]').click();
    await expect(page.locator('text=Campaign orchestration initiated')).toBeVisible({
      timeout: 5000,
    });

    // Test pause campaign
    await campaignCard.locator('[data-testid="pause-campaign"]').click();
    await expect(page.locator('text=Campaign paused successfully')).toBeVisible({ timeout: 5000 });

    // Test resume campaign
    await campaignCard.locator('[data-testid="resume-campaign"]').click();
    await expect(page.locator('text=Campaign resumed successfully')).toBeVisible({ timeout: 5000 });
  });

  test('validates LLM execution tracking', async ({ page }) => {
    // Open agent matrix
    await page.locator('[data-testid="campaign-card"]').first().click();
    await page.locator('[data-testid="view-matrix-btn"]').click();

    // Click on running task
    await page
      .locator('[data-testid="agent-task-cell"]')
      .filter({ hasText: 'running' })
      .first()
      .click();

    // Verify LLM execution details
    await expect(page.locator('text=LLM Prompt')).toBeVisible();
    await expect(page.locator('text=LLM Response')).toBeVisible();
    await expect(page.locator('text=Result Score')).toBeVisible();

    // Verify execution log shows LLM context
    await expect(page.locator('text=LLM execution started')).toBeVisible();
    await expect(page.locator('text=Campaign context loaded')).toBeVisible();
  });

  test('shows real-time agent activity', async ({ page }) => {
    // Verify active agents indicator
    await expect(page.locator('text=agents active')).toBeVisible();

    // Check for animated pulse indicators
    await expect(page.locator('[data-testid="agent-pulse"]')).toBeVisible();

    // Verify live glow effects on running tasks
    await expect(page.locator('[data-testid="running-task"]')).toHaveClass(/animate-pulse/);
  });

  test('handles error states gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/trpc/campaign.getCampaigns**', route => route.abort());

    await page.reload();

    // Verify error handling
    await expect(page.locator('text=Loading campaigns...')).toBeVisible();
    // Error message should appear after timeout
  });

  test('validates responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-campaign-list"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify tablet layout adjustments
    await expect(page.locator('[data-testid="campaign-grid"]')).toBeVisible();
  });

  test('verifies accessibility compliance', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label="Campaign orchestration dashboard"]')).toBeVisible();
    await expect(page.locator('[aria-label="Active campaigns counter"]')).toBeVisible();

    // Verify keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Check color contrast for status indicators
    const statusBadge = page.locator('[data-testid="status-badge"]').first();
    await expect(statusBadge).toBeVisible();
  });
});

test.describe('Campaign Orchestration Performance', () => {
  test('loads within performance budgets', async ({ page }) => {
    const navigationPromise = page.goto('/campaigns');

    // Measure load time
    const startTime = Date.now();
    await navigationPromise;
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Verify reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
  });

  test('handles large campaign datasets', async ({ page }) => {
    // Mock large dataset response
    await page.route('**/api/trpc/campaign.getCampaigns**', route => {
      const largeCampaignSet = Array.from({ length: 100 }, (_, i) => ({
        id: `campaign_${i}`,
        name: `Test Campaign ${i}`,
        status: 'running',
        // ... other mock properties
      }));

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: { data: largeCampaignSet } }),
      });
    });

    await page.goto('/campaigns');

    // Verify virtualization or pagination handles large datasets
    await expect(page.locator('[data-testid="campaign-card"]')).toHaveCount(20); // Should limit displayed items
  });
});
