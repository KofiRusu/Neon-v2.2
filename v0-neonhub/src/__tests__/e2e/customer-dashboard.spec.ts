import { test, expect } from '@playwright/test';

test.describe('Customer Intelligence Hub', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the tRPC API responses
    await page.route('**/api/trpc/customer.getCustomerSentimentStats*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: {
                summary: {
                  positive: 65,
                  neutral: 25,
                  negative: 10,
                  total: 150,
                  averageScore: 0.45,
                },
                dailyData: Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
                  positive: 60 + Math.random() * 10,
                  neutral: 25 + Math.random() * 10,
                  negative: 10 + Math.random() * 5,
                  total: 5 + Math.floor(Math.random() * 10),
                })),
                topKeywords: {
                  positive: ['excellent', 'amazing', 'love', 'outstanding', 'fantastic'],
                  negative: ['disappointed', 'poor', 'terrible', 'slow', 'expensive'],
                },
              },
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/customer.getCustomerTickets*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: [
                {
                  id: 'ticket_1',
                  customerId: 'customer_1',
                  subject: 'Technical Issue: Login problems',
                  status: 'open',
                  priority: 'high',
                  category: 'technical',
                  sentimentScore: -0.3,
                  escalationIndicator: true,
                  aiSuggestion: 'Escalate to technical team',
                  content: 'Customer is experiencing login issues...',
                  responses: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  resolvedAt: null,
                },
                {
                  id: 'ticket_2',
                  customerId: 'customer_2',
                  subject: 'Praise: Excellent service',
                  status: 'resolved',
                  priority: 'low',
                  category: 'praise',
                  sentimentScore: 0.8,
                  escalationIndicator: false,
                  aiSuggestion: 'Thank customer and request review',
                  content: 'Thank you for the amazing service...',
                  responses: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  resolvedAt: new Date().toISOString(),
                },
              ],
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/customer.getFunnelStats*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: {
                timeframe: '7d',
                totalVisitors: 12500,
                steps: [
                  {
                    step: 'Visit',
                    visitors: 12500,
                    conversions: 12500,
                    conversionRate: 100,
                    dropoffReasons: [],
                  },
                  {
                    step: 'View Product',
                    visitors: 8125,
                    conversions: 8125,
                    conversionRate: 65,
                    dropoffReasons: [
                      { reason: 'Page load too slow', percentage: 45 },
                      { reason: 'Not interested', percentage: 35 },
                    ],
                  },
                  {
                    step: 'Add to Cart',
                    visitors: 3125,
                    conversions: 3125,
                    conversionRate: 25,
                    dropoffReasons: [
                      { reason: 'Price too high', percentage: 40 },
                      { reason: 'Shipping costs', percentage: 25 },
                    ],
                  },
                  {
                    step: 'Purchase',
                    visitors: 1000,
                    conversions: 1000,
                    conversionRate: 8,
                    dropoffReasons: [
                      { reason: 'Payment failed', percentage: 35 },
                      { reason: 'Changed mind', percentage: 30 },
                    ],
                  },
                ],
                regionBreakdown: [
                  { region: 'North America', visitors: 5000, conversionRate: 9.2 },
                  { region: 'Europe', visitors: 3750, conversionRate: 7.8 },
                  { region: 'APAC', visitors: 2500, conversionRate: 6.5 },
                  { region: 'Middle East', visitors: 1250, conversionRate: 8.9 },
                ],
              },
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/customer.getAllCustomers*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: [
                {
                  id: 'customer_1',
                  name: 'Sarah Johnson',
                  email: 'sarah.johnson@example.com',
                  engagementLevel: 'high',
                  lastContact: new Date().toISOString(),
                  lifetimeValue: 8500,
                  preferredChannel: 'email',
                  aiPredictedAction: 'convert',
                  location: { country: 'USA', region: 'North America' },
                  tags: ['vip', 'loyal'],
                  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
                },
                {
                  id: 'customer_2',
                  name: 'Michael Chen',
                  email: 'michael.chen@example.com',
                  engagementLevel: 'medium',
                  lastContact: new Date().toISOString(),
                  lifetimeValue: 3200,
                  preferredChannel: 'whatsapp',
                  aiPredictedAction: 'nurture',
                  location: { country: 'Singapore', region: 'APAC' },
                  tags: ['new-customer'],
                  createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
                },
              ],
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/customer.getCustomerAnalytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              data: {
                customers: {
                  total: 16,
                  highEngagement: 6,
                  atRisk: 2,
                  avgLifetimeValue: 4250,
                },
                support: {
                  totalTickets: 25,
                  openTickets: 8,
                  escalatedTickets: 3,
                  avgSentimentScore: 0.2,
                },
                sentiment: {
                  overall: 0.45,
                  positive: 65,
                  negative: 10,
                  trend: 'improving',
                },
                funnel: {
                  conversionRate: 8,
                  totalVisitors: 12500,
                  dropoffRate: 92,
                },
                timeframe: '30d',
              },
            },
          },
        }),
      });
    });

    await page.goto('/customers');
  });

  test('loads customer intelligence hub successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Customer Intelligence Hub');
    await expect(
      page.locator('text=AI-powered sentiment analysis, support insights, and behavior funnels')
    ).toBeVisible();
  });

  test('displays customer analytics overview correctly', async ({ page }) => {
    await expect(page.locator('text=📊 Customer Intelligence Overview')).toBeVisible();
    await expect(page.locator('text=16').first()).toBeVisible(); // Total customers
    await expect(page.locator('text=6').first()).toBeVisible(); // High engagement
    await expect(page.locator('text=2').first()).toBeVisible(); // At risk
    await expect(page.locator('text=$4.3K')).toBeVisible(); // Avg LTV
    await expect(page.locator('text=65%')).toBeVisible(); // Positive sentiment
    await expect(page.locator('text=8%')).toBeVisible(); // Conversion rate
  });

  test('tab navigation works correctly', async ({ page }) => {
    // Check default sentiment tab is active
    await expect(page.locator('button:has-text("😊 Sentiment")').first()).toHaveClass(/text-blue/);

    // Test tickets tab
    await page.click('button:has-text("🎫 Support")');
    await expect(page.locator('text=Technical Issue: Login problems')).toBeVisible();

    // Test funnel tab
    await page.click('button:has-text("📊 Funnel")');
    await expect(page.locator('text=📊 Conversion Funnel')).toBeVisible();

    // Test customers tab
    await page.click('button:has-text("👥 Customers")');
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();

    // Return to sentiment tab
    await page.click('button:has-text("😊 Sentiment")');
    await expect(page.locator('text=😊')).toBeVisible();
  });

  test('sentiment analysis displays correctly', async ({ page }) => {
    // Should be on sentiment tab by default
    await expect(page.locator('text=65%').first()).toBeVisible(); // Positive percentage
    await expect(page.locator('text=25%')).toBeVisible(); // Neutral percentage
    await expect(page.locator('text=10%')).toBeVisible(); // Negative percentage
    await expect(page.locator('text=45')).toBeVisible(); // Average score

    // Check trend chart is visible
    await expect(page.locator('text=📈 Sentiment Trends')).toBeVisible();

    // Check keywords sections
    await expect(page.locator('text=🟢 Positive Keywords')).toBeVisible();
    await expect(page.locator('text=🔴 Negative Keywords')).toBeVisible();
    await expect(page.locator('text=excellent')).toBeVisible();
    await expect(page.locator('text=disappointed')).toBeVisible();
  });

  test('support tickets display and interaction', async ({ page }) => {
    await page.click('button:has-text("🎫 Support")');

    // Check tickets are displayed
    await expect(page.locator('text=Technical Issue: Login problems')).toBeVisible();
    await expect(page.locator('text=Praise: Excellent service')).toBeVisible();

    // Check status badges
    await expect(page.locator('text=OPEN')).toBeVisible();
    await expect(page.locator('text=RESOLVED')).toBeVisible();

    // Check priority badges
    await expect(page.locator('text=HIGH')).toBeVisible();
    await expect(page.locator('text=LOW')).toBeVisible();

    // Check escalation indicator
    await expect(page.locator('text=⚠️ Escalation Required')).toBeVisible();

    // Check sentiment indicators
    await expect(page.locator('text=😞')).toBeVisible(); // Negative sentiment
    await expect(page.locator('text=😊')).toBeVisible(); // Positive sentiment
  });

  test('funnel visualization and interaction', async ({ page }) => {
    await page.click('button:has-text("📊 Funnel")');

    // Check funnel header
    await expect(page.locator('text=📊 Conversion Funnel')).toBeVisible();
    await expect(page.locator('text=Total Visitors: 12.5K')).toBeVisible();

    // Check funnel steps
    await expect(page.locator('text=👁️')).toBeVisible(); // Visit icon
    await expect(page.locator('text=🛍️')).toBeVisible(); // View Product icon
    await expect(page.locator('text=🛒')).toBeVisible(); // Add to Cart icon
    await expect(page.locator('text=💳')).toBeVisible(); // Purchase icon

    // Check conversion rates
    await expect(page.locator('text=100%').first()).toBeVisible(); // Visit conversion
    await expect(page.locator('text=65%')).toBeVisible(); // View Product conversion
    await expect(page.locator('text=25%')).toBeVisible(); // Add to Cart conversion
    await expect(page.locator('text=8%')).toBeVisible(); // Purchase conversion

    // Check dropoff indicators
    await expect(page.locator('text=↓ 35.0% dropoff')).toBeVisible();

    // Test expandable dropoff reasons
    await page.click('text=View Product');
    await expect(page.locator('text=🚫 Dropoff Reasons')).toBeVisible();
    await expect(page.locator('text=Page load too slow')).toBeVisible();
    await expect(page.locator('text=45%')).toBeVisible();

    // Check regional breakdown
    await expect(page.locator('text=🌍 Regional Performance')).toBeVisible();
    await expect(page.locator('text=North America')).toBeVisible();
    await expect(page.locator('text=9.2%')).toBeVisible();
  });

  test('customer profiles display and hover interaction', async ({ page }) => {
    await page.click('button:has-text("👥 Customers")');

    // Check customer cards are displayed
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    await expect(page.locator('text=Michael Chen')).toBeVisible();

    // Check customer details
    await expect(page.locator('text=sarah.johnson@example.com')).toBeVisible();
    await expect(page.locator('text=$8.5K')).toBeVisible(); // Lifetime value
    await expect(page.locator('text=HIGH')).toBeVisible(); // Engagement level

    // Check AI predicted actions
    await expect(page.locator('text=🤖 AI Action: CONVERT')).toBeVisible();
    await expect(page.locator('text=🤖 AI Action: NURTURE')).toBeVisible();

    // Test hover expansion (this would be challenging to test with actual hover,
    // but we can test that the elements exist)
    await expect(page.locator('text=📧')).toBeVisible(); // Email icon
    await expect(page.locator('text=💬')).toBeVisible(); // WhatsApp icon
  });

  test('timeframe selector works', async ({ page }) => {
    // Check default timeframe
    await expect(page.locator('select').first()).toHaveValue('30d');

    // Change to 7 days
    await page.selectOption('select', '7d');
    await page.waitForTimeout(500); // Wait for filter to apply

    // Change to 90 days
    await page.selectOption('select', '90d');
    await page.waitForTimeout(500);
  });

  test('dark mode toggle functionality', async ({ page }) => {
    // Toggle to dark mode
    await page.click('button:has-text("🌙")');
    await expect(page.locator('button:has-text("☀️")')).toBeVisible();

    // Check dark mode is applied (background should change)
    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-gradient-to-br/);

    // Toggle back to light mode
    await page.click('button:has-text("☀️")');
    await expect(page.locator('button:has-text("🌙")')).toBeVisible();
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

  test('loading states display correctly', async ({ page }) => {
    // Temporarily delay API response to test loading state
    await page.route('**/api/trpc/customer.getCustomerSentimentStats*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.reload();

    // Should show loading spinner in sentiment tab
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that dashboard is still functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=📊 Customer Intelligence Overview')).toBeVisible();

    // Tab navigation should still work
    await page.click('button:has-text("🎫 Support")');
    await expect(page.locator('text=Technical Issue')).toBeVisible();
  });

  test('accessibility features work correctly', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2').first()).toBeVisible();

    // Check for button accessibility
    const darkModeButton = page.locator('button:has-text("🌙")');
    await expect(darkModeButton).toBeVisible();
    await expect(darkModeButton).toBeEnabled();

    // Check for proper form controls
    const timeframeSelect = page.locator('select').first();
    await expect(timeframeSelect).toBeVisible();
    await expect(timeframeSelect).toBeEnabled();
  });

  test('tab content updates correctly', async ({ page }) => {
    // Start on sentiment tab
    await expect(page.locator('text=😊')).toBeVisible();
    await expect(page.locator('text=Technical Issue')).not.toBeVisible();

    // Switch to support tab
    await page.click('button:has-text("🎫 Support")');
    await expect(page.locator('text=Technical Issue')).toBeVisible();
    await expect(page.locator('text=😊')).not.toBeVisible();

    // Switch to funnel tab
    await page.click('button:has-text("📊 Funnel")');
    await expect(page.locator('text=👁️')).toBeVisible(); // Visit icon
    await expect(page.locator('text=Technical Issue')).not.toBeVisible();

    // Switch to customers tab
    await page.click('button:has-text("👥 Customers")');
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    await expect(page.locator('text=👁️')).not.toBeVisible();
  });
});
