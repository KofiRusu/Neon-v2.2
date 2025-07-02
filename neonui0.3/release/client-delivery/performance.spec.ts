import { test, expect } from "@playwright/test";

test.describe("Performance Optimization & Core Web Vitals", () => {
  test.setTimeout(120000); // 2 minutes for performance tests

  const criticalPages = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/copilot", name: "Copilot" },
    { path: "/analytics", name: "Analytics" },
    { path: "/campaigns", name: "Campaigns" },
  ];

  // Core Web Vitals thresholds (Google recommendations)
  const PERFORMANCE_THRESHOLDS = {
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100, // First Input Delay (ms)
    CLS: 0.1, // Cumulative Layout Shift
    FCP: 1800, // First Contentful Paint (ms)
    TTI: 3800, // Time to Interactive (ms)
  };

  criticalPages.forEach(({ path, name }) => {
    test(`should meet Core Web Vitals thresholds on ${name} page`, async ({
      page,
    }) => {
      // Start navigation timing
      const startTime = Date.now();

      await page.goto(`http://localhost:3000${path}`);

      // Wait for main content to load
      await page.waitForSelector('main, [role="main"], .container', {
        timeout: 10000,
      });

      // Measure Core Web Vitals using Performance API
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};

          // Get navigation timing
          const navigation = performance.getEntriesByType(
            "navigation",
          )[0] as PerformanceNavigationTiming;

          if (navigation) {
            vitals.FCP = navigation.responseEnd - navigation.fetchStart;
            vitals.TTI = navigation.loadEventEnd - navigation.fetchStart;
          }

          // Get LCP using PerformanceObserver
          let lcpValue = 0;
          try {
            const lcpObserver = new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              if (entries.length > 0) {
                lcpValue = entries[entries.length - 1].startTime;
              }
            });
            lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

            // Wait a bit for LCP measurement
            setTimeout(() => {
              vitals.LCP = lcpValue;
              resolve(vitals);
            }, 3000);
          } catch (error) {
            // Fallback if LCP observer not supported
            vitals.LCP = navigation?.loadEventEnd - navigation?.fetchStart || 0;
            resolve(vitals);
          }
        });
      });

      const loadTime = Date.now() - startTime;

      console.log(`${name} Performance Metrics:`, {
        ...webVitals,
        totalLoadTime: loadTime,
      });

      // Assert performance thresholds
      if (webVitals.LCP) {
        expect(
          webVitals.LCP,
          `LCP should be under ${PERFORMANCE_THRESHOLDS.LCP}ms`,
        ).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
      }

      if (webVitals.FCP) {
        expect(
          webVitals.FCP,
          `FCP should be under ${PERFORMANCE_THRESHOLDS.FCP}ms`,
        ).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
      }

      if (webVitals.TTI) {
        expect(
          webVitals.TTI,
          `TTI should be under ${PERFORMANCE_THRESHOLDS.TTI}ms`,
        ).toBeLessThan(PERFORMANCE_THRESHOLDS.TTI);
      }

      // General load time assertion
      expect(
        loadTime,
        "Total page load time should be reasonable",
      ).toBeLessThan(5000);
    });

    test(`should have optimized resource loading on ${name} page`, async ({
      page,
    }) => {
      const responses = [];

      // Collect all network responses
      page.on("response", (response) => {
        responses.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()["content-type"] || "",
          size: response.headers()["content-length"] || "0",
        });
      });

      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState("networkidle");

      // Analyze resource loading
      const imageResponses = responses.filter((r) =>
        r.contentType.includes("image/"),
      );
      const jsResponses = responses.filter((r) =>
        r.contentType.includes("javascript"),
      );
      const cssResponses = responses.filter((r) =>
        r.contentType.includes("css"),
      );

      // Check for optimization indicators
      const hasWebP = imageResponses.some((r) =>
        r.contentType.includes("webp"),
      );
      const hasCompression = responses.some(
        (r) => r.url.includes(".gz") || r.url.includes(".br"),
      );

      console.log(`${name} Resource Analysis:`, {
        totalRequests: responses.length,
        images: imageResponses.length,
        javascript: jsResponses.length,
        css: cssResponses.length,
        hasWebP,
        hasCompression,
      });

      // Performance assertions
      expect(
        responses.length,
        "Total requests should be reasonable",
      ).toBeLessThan(50);
      expect(
        responses.filter((r) => r.status >= 400).length,
        "Should have no failed requests",
      ).toBe(0);
    });

    test(`should handle layout shifts gracefully on ${name} page`, async ({
      page,
    }) => {
      await page.goto(`http://localhost:3000${path}`);

      // Measure layout shifts
      const layoutShifts = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;

          try {
            const clsObserver = new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                }
              }
            });

            clsObserver.observe({ entryTypes: ["layout-shift"] });

            // Wait and measure for 5 seconds
            setTimeout(() => {
              clsObserver.disconnect();
              resolve(clsValue);
            }, 5000);
          } catch (error) {
            resolve(0); // Fallback if not supported
          }
        });
      });

      console.log(`${name} Layout Shift Score:`, layoutShifts);

      // CLS should be under 0.1 for good user experience
      expect(
        layoutShifts,
        "Cumulative Layout Shift should be minimal",
      ).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    });
  });

  test("should have optimized bundle sizes", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Analyze JavaScript bundles
    const bundleInfo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.map((script) => ({
        src: script.src,
        async: script.async,
        defer: script.defer,
      }));
    });

    console.log("Bundle Analysis:", bundleInfo);

    // Check for bundle optimization
    const hasAsyncScripts = bundleInfo.some(
      (script) => script.async || script.defer,
    );
    expect(
      hasAsyncScripts,
      "Should have async/defer scripts for better performance",
    ).toBe(true);

    // Check bundle count is reasonable
    expect(
      bundleInfo.length,
      "Should not have excessive script tags",
    ).toBeLessThan(10);
  });

  test("should pass accessibility performance checks", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Check for performance-impacting accessibility issues
    const a11yPerformanceChecks = await page.evaluate(() => {
      const issues = [];

      // Check for missing alt attributes on images
      const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} images missing alt attributes`);
      }

      // Check for non-semantic elements that could impact screen readers
      const nonSemanticClickables = document.querySelectorAll(
        "div[onclick], span[onclick]",
      );
      if (nonSemanticClickables.length > 0) {
        issues.push(
          `${nonSemanticClickables.length} non-semantic clickable elements`,
        );
      }

      // Check for proper heading hierarchy
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      const headingLevels = headings.map((h) =>
        parseInt(h.tagName.substring(1)),
      );

      return {
        issues,
        headingCount: headings.length,
        headingLevels,
      };
    });

    console.log("Accessibility Performance:", a11yPerformanceChecks);

    // Should have minimal accessibility issues
    expect(
      a11yPerformanceChecks.issues.length,
      "Should have minimal accessibility issues",
    ).toBeLessThan(3);
    expect(
      a11yPerformanceChecks.headingCount,
      "Should have proper heading structure",
    ).toBeGreaterThan(0);
  });
});
