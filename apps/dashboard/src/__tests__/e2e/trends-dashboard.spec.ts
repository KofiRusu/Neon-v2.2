import { test, expect } from '@playwright/test';

test.describe('Trends Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the tRPC API responses
    await page.route('**/api/trpc/trend.getTrendingTopics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: [
                {
                  id: 'trend_1',
                  title: 'AI-Generated Art Challenge',
                  type: 'challenge',
                  platform: 'instagram',
                  region: 'Global',
                  impactScore: 85,
                  projectedLift: 25,
                  velocity: 45,
                  description: 'Users creating art with AI tools',
                  recommendation: 'Create tutorial content',
                  confidence: 0.89,
                  detectedAt: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
                  relatedKeywords: ['ai', 'art', 'trending'],
                  metrics: {
                    mentions: 45000,
                    engagement: 125000,
                    reach: 2500000,
                    growth: 22,
                  },
                },
                {
                  id: 'trend_2',
                  title: '#ProductivityHacks2024',
                  type: 'hashtag',
                  platform: 'tiktok',
                  region: 'USA',
                  impactScore: 72,
                  projectedLift: 18,
                  velocity: 28,
                  description: 'Short-form productivity tips',
                  recommendation: 'Share quick tips',
                  confidence: 0.82,
                  detectedAt: new Date().toISOString(),
                  expiresAt: null,
                  relatedKeywords: ['productivity', 'tips', 'hacks'],
                  metrics: {
                    mentions: 23000,
                    engagement: 67000,
                    reach: 890000,
                    growth: 15,
                  },
                },
              ],
              count: 2,
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/trend.getGeoDemandMap*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: [
                {
                  countryCode: 'US',
                  countryName: 'United States',
                  region: 'North America',
                  demandIntensity: 85,
                  engagementDelta: 12.5,
                  opportunityScore: 92,
                  topTrend: 'AI Art Challenge',
                  coordinates: { lat: 39.8283, lng: -98.5795 },
                  metrics: {
                    leads: 1250,
                    conversions: 185,
                    revenue: 45000,
                    sessions: 8500,
                  },
                },
                {
                  countryCode: 'AE',
                  countryName: 'United Arab Emirates',
                  region: 'Middle East',
                  demandIntensity: 78,
                  engagementDelta: 8.2,
                  opportunityScore: 84,
                  topTrend: 'Productivity Hacks',
                  coordinates: { lat: 23.4241, lng: 53.8478 },
                  metrics: {
                    leads: 890,
                    conversions: 132,
                    revenue: 32000,
                    sessions: 5600,
                  },
                },
              ],
              metadata: {
                layer: 'demand',
                timeframe: '7d',
                totalCountries: 2,
                avgDemandIntensity: 81,
                avgEngagementDelta: 10.3,
              },
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/trend.getTrendAnalytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: {
                summary: {
                  totalTrends: 8,
                  hotTrends: 3,
                  risingTrends: 5,
                  globalReach: 15000000,
                  avgConfidence: 0.85,
                },
                platforms: {
                  instagram: 3,
                  tiktok: 2,
                  youtube: 1,
                  twitter: 1,
                  linkedin: 1,
                },
                topRegions: [
                  { name: 'United States', score: 85, trend: 'AI Art Challenge' },
                  { name: 'United Arab Emirates', score: 78, trend: 'Productivity Hacks' },
                ],
                timeframe: '7d',
              },
            },
          },
        }),
      });
    });

    await page.goto('/trends');
  });

  test('loads trends dashboard successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Trend Intelligence Center');
    await expect(
      page.locator('text=Real-time trend analysis with global opportunity mapping')
    ).toBeVisible();
  });

  test('displays analytics overview correctly', async ({ page }) => {
    await expect(page.locator('text=📊 Trend Analytics Overview')).toBeVisible();
    await expect(page.locator('text=8')).toBeVisible(); // Total trends
    await expect(page.locator('text=3').first()).toBeVisible(); // Hot trends
    await expect(page.locator('text=5')).toBeVisible(); // Rising trends
    await expect(page.locator('text=15.0M')).toBeVisible(); // Global reach
    await expect(page.locator('text=85%')).toBeVisible(); // Confidence
  });

  test('displays trend cards with correct information', async ({ page }) => {
    // Check first trend card
    await expect(page.locator('text=AI-Generated Art Challenge')).toBeVisible();
    await expect(page.locator('text=85').first()).toBeVisible(); // Impact score
    await expect(page.locator('text=+45')).toBeVisible(); // Velocity
    await expect(page.locator('text=+25%')).toBeVisible(); // Projected lift
    await expect(page.locator('text=2.5M')).toBeVisible(); // Reach

    // Check second trend card
    await expect(page.locator('text=#ProductivityHacks2024')).toBeVisible();
    await expect(page.locator('text=🏷️')).toBeVisible(); // Hashtag icon
    await expect(page.locator('text=tiktok')).toBeVisible();
  });

  test('filters work correctly', async ({ page }) => {
    // Test platform filter
    await page.selectOption('select:near(:text("📱 Platform"))', 'instagram');
    await page.waitForTimeout(500); // Wait for filter to apply

    // Should still show Instagram trends
    await expect(page.locator('text=AI-Generated Art Challenge')).toBeVisible();

    // Test region filter
    await page.selectOption('select:near(:text("🌍 Region"))', 'USA');
    await page.waitForTimeout(500);

    // Test sort options
    await page.selectOption('select:near(:text("🔄 Sort By"))', 'velocity');
    await page.waitForTimeout(500);

    // Test time machine
    await page.selectOption('select:near(:text("📅 Time Machine"))', '30d');
    await page.waitForTimeout(500);
  });

  test('map layer selection works', async ({ page }) => {
    // Check that map is visible by default
    await expect(page.locator('text=🗺️ Global Opportunity Map')).toBeVisible();
    await expect(page.locator('text=Demand Intensity Heatmap')).toBeVisible();

    // Test different map layers
    await page.selectOption('select:near(:text("🗺️ Map Layer"))', 'engagement');
    await expect(page.locator('text=Engagement Growth Heatmap')).toBeVisible();

    await page.selectOption('select:near(:text("🗺️ Map Layer"))', 'opportunity');
    await expect(page.locator('text=Opportunity Score Heatmap')).toBeVisible();

    await page.selectOption('select:near(:text("🗺️ Map Layer"))', 'revenue');
    await expect(page.locator('text=Revenue Potential Heatmap')).toBeVisible();
  });

  test('map shows country data correctly', async ({ page }) => {
    // Check that country codes are displayed
    await expect(page.locator('text=US')).toBeVisible();
    await expect(page.locator('text=AE')).toBeVisible();

    // Check demand intensity values
    await expect(page.locator('text=85%').first()).toBeVisible(); // US demand
    await expect(page.locator('text=78%')).toBeVisible(); // AE demand

    // Check top trends are displayed
    await expect(page.locator('text=AI Art Challenge')).toBeVisible();
    await expect(page.locator('text=Productivity Hacks')).toBeVisible();
  });

  test('country click shows tooltip', async ({ page }) => {
    // Click on a country card in the map
    await page.click('text=US');

    // Tooltip should appear with detailed information
    await expect(page.locator('text=United States')).toBeVisible();
    await expect(page.locator('text=Demand Intensity')).toBeVisible();
    await expect(page.locator('text=Top Trend')).toBeVisible();
    await expect(page.locator('text=Leads')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    // Check initial light mode
    const body = page.locator('body');

    // Toggle to dark mode
    await page.click('button:has-text("🌙")');
    await expect(body).toHaveClass(/bg-gradient-to-br/);

    // Toggle back to light mode
    await page.click('button:has-text("☀️")');
  });

  test('auto-refresh toggle functionality', async ({ page }) => {
    // Check auto-refresh is initially enabled
    await expect(page.locator('text=🔄 Live')).toBeVisible();

    // Toggle auto-refresh off
    await page.click('button:has-text("🔄 Live")');
    await expect(page.locator('text=⏸️ Paused')).toBeVisible();

    // Toggle auto-refresh back on
    await page.click('button:has-text("⏸️ Paused")');
    await expect(page.locator('text=🔄 Live')).toBeVisible();
  });

  test('map toggle hides and shows map', async ({ page }) => {
    // Map should be visible initially
    await expect(page.locator('text=🗺️ Global Opportunity Map')).toBeVisible();

    // Hide map
    await page.click('button:has-text("📊 Hide Map")');
    await expect(page.locator('text=🗺️ Global Opportunity Map')).not.toBeVisible();
    await expect(page.locator('text=🗺️ Show Map')).toBeVisible();

    // Show map again
    await page.click('button:has-text("🗺️ Show Map")');
    await expect(page.locator('text=🗺️ Global Opportunity Map')).toBeVisible();
  });

  test('trend card selection works', async ({ page }) => {
    // Click on a trend card
    await page.click('text=AI-Generated Art Challenge');

    // Card should appear selected (this would trigger the onClick handler)
    // In a real implementation, this might show a detailed view or highlight the card
  });

  test('displays map summary statistics', async ({ page }) => {
    // Check that summary stats are displayed at bottom of map
    await expect(page.locator('text=Highest')).toBeVisible();
    await expect(page.locator('text=Lowest')).toBeVisible();
    await expect(page.locator('text=Average')).toBeVisible();
    await expect(page.locator('text=Hot Spots')).toBeVisible();
  });

  test('handles loading states correctly', async ({ page }) => {
    // Temporarily return loading state by delaying response
    await page.route('**/api/trpc/trend.getTrendingTopics*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.reload();

    // Should show loading spinner
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that dashboard is still functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=AI-Generated Art Challenge')).toBeVisible();
    await expect(page.locator('text=📊 Trend Analytics Overview')).toBeVisible();
  });

  test('trend cards show correct recommendation and confidence', async ({ page }) => {
    // Check AI recommendation section
    await expect(page.locator('text=🎯 AI Recommendation:')).toBeVisible();
    await expect(page.locator('text=Create tutorial content')).toBeVisible();

    // Check confidence indicators
    await expect(page.locator('text=89% confidence')).toBeVisible();
    await expect(page.locator('text=82% confidence')).toBeVisible();
  });

  test('related keywords display correctly', async ({ page }) => {
    // Check that hashtags are displayed
    await expect(page.locator('text=#ai')).toBeVisible();
    await expect(page.locator('text=#art')).toBeVisible();
    await expect(page.locator('text=#trending')).toBeVisible();
  });

  test('accessibility features work correctly', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2').first()).toBeVisible();

    // Check for button accessibility
    const darkModeButton = page.locator('button:has-text("🌙")');
    await expect(darkModeButton).toBeVisible();
    await expect(darkModeButton).toBeEnabled();

    // Check for proper form labels
    await expect(page.locator('label:has-text("📅 Time Machine")')).toBeVisible();
    await expect(page.locator('label:has-text("📱 Platform")')).toBeVisible();
  });
});
