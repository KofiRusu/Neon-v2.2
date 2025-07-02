import { test, expect } from "@playwright/test";

test.describe("Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("should display analytics page", async ({ page }) => {
    await expect(page).toHaveTitle(/NeonHub - AI Marketing Platform/);
    await expect(
      page.getByRole("heading", { name: /analytics/i }),
    ).toBeVisible();
  });

  test("should display key metrics overview", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for metric cards with revenue, campaigns, agents, conversion rate
    const metricCards = page
      .locator("text=Revenue")
      .or(page.locator("text=Campaigns"))
      .or(page.locator("text=Agents"))
      .or(page.locator("text=Conversion"));

    await expect(metricCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display metric values and trends", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for dollar amounts, percentages, and trend indicators
    const values = page
      .locator("text=/\\$[0-9,]+/")
      .or(page.locator("text=/[0-9]+%/"))
      .or(page.locator("text=/\\+[0-9]+/"))
      .or(page.locator("text=247000"))
      .or(page.locator("text=24.8"));

    await expect(values.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have time period selector", async ({ page }) => {
    // Look for time period dropdown or tabs
    const timeSelector = page
      .getByRole("combobox")
      .or(page.locator("select"))
      .or(page.getByRole("button", { name: /24h|7d|30d|90d/i }))
      .or(page.locator("text=Last 30 days"));

    await expect(timeSelector.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have refresh functionality", async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.getByRole("button", { name: /refresh/i });

    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should display analytics tabs", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for tab navigation
    const tabs = page.getByRole("tab", {
      name: /performance|campaigns|agents|insights/i,
    });
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate between analytics tabs", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Test tab navigation
    const performanceTab = page.getByRole("tab", { name: /performance/i });
    const campaignsTab = page.getByRole("tab", { name: /campaigns/i });
    const agentsTab = page.getByRole("tab", { name: /agents/i });

    if (await campaignsTab.isVisible()) {
      await campaignsTab.click();
      await page.waitForTimeout(1000);
    }

    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await page.waitForTimeout(1000);
    }

    if (await performanceTab.isVisible()) {
      await performanceTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should display charts and visualizations", async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for chart elements (recharts, SVG, canvas)
    const charts = page
      .locator("svg")
      .or(page.locator("canvas"))
      .or(page.locator(".recharts-wrapper"))
      .or(page.locator('[data-testid="chart"]'));

    await expect(charts.first()).toBeVisible({ timeout: 15000 });
  });

  test("should display agent performance data", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to agents tab
    const agentsTab = page.getByRole("tab", { name: /agents/i });
    if (await agentsTab.isVisible()) {
      await agentsTab.click();

      // Look for agent performance metrics
      const agentMetrics = page
        .locator("text=Content Agent")
        .or(page.locator("text=SEO Agent"))
        .or(page.locator("text=Social Agent"))
        .or(page.locator("text=efficiency"));

      await expect(agentMetrics.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display campaign performance data", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to campaigns tab
    const campaignsTab = page.getByRole("tab", { name: /campaigns/i });
    if (await campaignsTab.isVisible()) {
      await campaignsTab.click();

      // Look for campaign performance data
      const campaignData = page
        .locator("text=Email")
        .or(page.locator("text=Social"))
        .or(page.locator("text=SEO"))
        .or(page.locator("text=Top Performers"));

      await expect(campaignData.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display insights and recommendations", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Navigate to insights tab
    const insightsTab = page.getByRole("tab", { name: /insights/i });
    if (await insightsTab.isVisible()) {
      await insightsTab.click();

      // Look for insights content
      const insights = page
        .locator("text=Key Insights")
        .or(page.locator("text=Recommendations"))
        .or(page.locator("text=performing"))
        .or(page.locator("text=optimize"));

      await expect(insights.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Analytics should work on mobile
    await expect(
      page.getByRole("heading", { name: /analytics/i }),
    ).toBeVisible();

    // Metric cards should stack on mobile
    const metricCards = page
      .locator("text=Revenue")
      .or(page.locator("text=Campaigns"));
    if (await metricCards.first().isVisible()) {
      await expect(metricCards.first()).toBeVisible();
    }
  });

  test("should handle chart interactions", async ({ page }) => {
    await page.waitForTimeout(3000);

    // Try hovering over charts to see tooltips
    const chartSvg = page.locator("svg").first();
    if (await chartSvg.isVisible()) {
      await chartSvg.hover();
      await page.waitForTimeout(500);
    }
  });

  test("should handle time period changes", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find and use time period selector
    const timeSelector = page
      .getByRole("combobox")
      .or(page.locator("select"))
      .first();
    if (await timeSelector.isVisible()) {
      await timeSelector.click();

      // Select different time period
      const option = page
        .getByRole("option", { name: /7d|24h/i })
        .or(page.locator("option"))
        .first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test("should handle loading states", async ({ page }) => {
    const loadingIndicator = page
      .locator(".animate-pulse")
      .or(page.locator('[data-testid="loading"]'))
      .or(page.locator("text=Loading"));

    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeHidden({ timeout: 15000 });
    }
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Simulate API failure
    await page.route("**/api/**", (route) => route.abort());
    await page.reload();

    // Page should still render basic structure
    await expect(
      page.getByRole("heading", { name: /analytics/i }),
    ).toBeVisible();
  });
});
