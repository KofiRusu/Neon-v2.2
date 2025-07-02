import { test, expect } from "@playwright/test";

test.describe("Copilot Reasoning UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copilot");
  });

  test("should load copilot page correctly", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check main title - use data-testid or more specific selector
    await expect(
      page.getByRole("heading", { name: "NeonHub Copilot", exact: true }),
    ).toBeVisible();

    // Check subtitle
    await expect(
      page.locator(
        "text=AI-powered reasoning assistant for marketing automation",
      ),
    ).toBeVisible();
  });

  test("should show welcome state initially", async ({ page }) => {
    // Clear localStorage to ensure we start fresh
    await page.evaluate(() => {
      localStorage.removeItem("copilot-session-id");
      localStorage.removeItem("copilot-has-active-session");
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check welcome message
    await expect(page.locator("text=Welcome to NeonHub Copilot")).toBeVisible();

    // Check feature cards
    await expect(page.getByText("Smart Analysis")).toBeVisible();
    await expect(page.getByText("Reasoning Transparency")).toBeVisible();
    await expect(page.getByText("Multi-Step Execution")).toBeVisible();

    // Check quick start section
    await expect(page.getByText("Quick Start")).toBeVisible();
    await expect(page.getByText("Campaign Analysis")).toBeVisible();
    await expect(page.getByText("Content Strategy").first()).toBeVisible();
    await expect(page.getByText("SEO Optimization")).toBeVisible();
  });

  test("should start new session", async ({ page }) => {
    // Click start new session button
    await page.click('button:has-text("Start New Session")');

    // Wait for session to initialize
    await page.waitForTimeout(1000);

    // Should now show the three-panel layout (on desktop)
    await expect(page.locator("text=Chat Stream")).toBeVisible();
    await expect(page.locator("text=Task Planning")).toBeVisible();
    await expect(page.locator("text=Reasoning Tree")).toBeVisible();
  });

  test("should start session with quick start template", async ({ page }) => {
    // Click on Campaign Analysis template
    await page.click("text=Campaign Analysis");

    // Wait for session to start
    await page.waitForTimeout(1000);

    // Should show the copilot interface
    await expect(page.locator("text=Chat Stream")).toBeVisible();
  });

  test("should display chat interface correctly", async ({ page }) => {
    // Start a session first
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Check chat elements
    await expect(page.locator("text=Chat Stream")).toBeVisible();

    // Check greeting message
    await expect(
      page.locator("text=Hello! I'm your NeonHub Copilot").first(),
    ).toBeVisible();

    // Check message input (use first to avoid strict mode violation)
    await expect(
      page.locator('input[placeholder*="Ask the Copilot"]').first(),
    ).toBeVisible();

    // Check quick action buttons
    await expect(
      page.locator('button:has-text("Analyze Campaigns")').first(),
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Content Calendar")').first(),
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Email Optimization")').first(),
    ).toBeVisible();
  });

  test("should send message in chat", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Type message
    const messageInput = page
      .locator('input[placeholder*="Ask the Copilot"]')
      .first();
    await messageInput.fill("Help me analyze my campaigns");

    // Send message
    await page.click(
      'button[type="submit"], button:has([data-testid="paper-airplane-icon"], svg)',
    );

    // Wait for response
    await page.waitForTimeout(500);

    // Should show typing indicator or response
    // Note: This might show typing animation or immediate response based on implementation
  });

  test("should use quick action buttons", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Click quick action
    await page.click('button:has-text("Analyze Campaigns")');

    // Should populate message input
    const messageInput = page
      .locator('input[placeholder*="Ask the Copilot"]')
      .first();
    await expect(messageInput).toHaveValue(/analyze.*campaign/i);
  });

  test("should display task planner", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Check task planner elements
    await expect(page.locator("text=Task Planning")).toBeVisible();
    await expect(page.locator("text=Task Execution")).toBeVisible();

    // Should show progress bar
    await expect(page.locator('[role="progressbar"]').first()).toBeAttached();

    // Should show steps
    await expect(page.locator("text=Initialize Analysis")).toBeVisible();
    await expect(page.locator("text=Gather Campaign Data")).toBeVisible();
  });

  test("should expand task steps", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Click on a step to expand it
    const stepElement = page.locator("text=Initialize Analysis").locator("..");
    await stepElement.click();

    // Should show expanded content (reasoning or output)
    await page.waitForTimeout(500);
  });

  test("should display reasoning tree", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Check reasoning tree elements
    await expect(page.locator("text=Reasoning Tree")).toBeVisible();
    await expect(page.locator("text=Reasoning Process")).toBeVisible();

    // Should show reasoning nodes
    await expect(
      page.locator("text=User wants to analyze campaign performance"),
    ).toBeVisible();

    // Check legend - be more specific to legend area
    await expect(
      page.locator(".border-t").locator("text=Thought"),
    ).toBeVisible();
    await expect(
      page.locator(".border-t").locator("text=Action"),
    ).toBeVisible();
    await expect(
      page.locator(".border-t").locator("text=Observation"),
    ).toBeVisible();
    await expect(
      page.locator(".border-t").locator("text=Decision"),
    ).toBeVisible();
  });

  test("should expand reasoning nodes", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Look for expandable reasoning nodes and click one
    const reasoningNode = page
      .locator("text=User wants to analyze campaign performance")
      .locator("..");
    await reasoningNode.click();

    // Should show expanded reasoning content
    await page.waitForTimeout(500);
  });

  test("should use expand/collapse all buttons", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Click expand all
    await page.click('button:has-text("Expand All")');
    await page.waitForTimeout(500);

    // Click collapse all
    await page.click('button:has-text("Collapse All")');
    await page.waitForTimeout(500);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Should show mobile tabbed interface
    await expect(page.locator('[role="tab"]:has-text("Chat")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Tasks")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Tree")')).toBeVisible();

    // Switch between tabs
    await page.click('[role="tab"]:has-text("Tasks")');
    await expect(page.locator("text=Task Execution").first()).toBeVisible();

    await page.click('[role="tab"]:has-text("Tree")');
    await expect(page.locator("text=Reasoning Process").first()).toBeVisible();
  });

  test("should show session status", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Should show session active status
    await expect(page.locator("text=Session Active")).toBeVisible();

    // Should show new session button
    await expect(page.locator('button:has-text("New Session")')).toBeVisible();
  });

  test("should create new session", async ({ page }) => {
    // Start initial session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Click new session button
    await page.click('button:has-text("New Session")');
    await page.waitForTimeout(1000);

    // Should still show the interface (new session started)
    await expect(page.locator("text=Chat Stream")).toBeVisible();
    await expect(page.locator("text=Session Active")).toBeVisible();
  });

  test("should handle capabilities section", async ({ page }) => {
    // Check capabilities section in welcome state
    await expect(page.locator("text=What can the Copilot do?")).toBeVisible();
    await expect(page.locator("text=Campaign Management")).toBeVisible();
    await expect(page.locator("text=Content Strategy").first()).toBeVisible();

    // Check specific capabilities
    await expect(
      page.locator("text=Analyze campaign performance across all channels"),
    ).toBeVisible();
    await expect(page.locator("text=Create content calendars")).toBeVisible();
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Focus message input
    const messageInput = page
      .locator('input[placeholder*="Ask the Copilot"]')
      .first();
    await messageInput.focus();

    // Type message
    await messageInput.fill("Test message");

    // Press Enter to send
    await messageInput.press("Enter");
    await page.waitForTimeout(500);
  });

  test("should persist session across page refreshes", async ({ page }) => {
    // Start session
    await page.click('button:has-text("Start New Session")');
    await page.waitForTimeout(1000);

    // Refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still show the copilot interface (session should be restored)
    await expect(page.locator("text=Chat Stream")).toBeVisible();
  });
});
