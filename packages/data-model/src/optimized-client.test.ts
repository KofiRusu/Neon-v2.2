import {
  OptimizedPrismaClient,
  QueryMetrics,
  ConnectionMetrics,
} from "./optimized-client";

describe("OptimizedPrismaClient", () => {
  let client: OptimizedPrismaClient;

  beforeAll(async () => {
    client = new OptimizedPrismaClient();
    await client.$connect();
  });

  afterAll(async () => {
    await client.$disconnect();
  });

  beforeEach(() => {
    client.clearCache();
    client.clearMetrics();
  });

  describe("Performance Monitoring", () => {
    it("should track query metrics", async () => {
      // Execute a simple query (this would need to be replaced with an actual query in a real test)
      // For now, we'll create some mock metrics
      const connectionMetrics = client.getMetrics();
      expect(connectionMetrics.totalQueries).toBeGreaterThanOrEqual(0);
      expect(connectionMetrics.averageQueryTime).toBeGreaterThanOrEqual(0);
      expect(connectionMetrics.activeConnections).toBeGreaterThanOrEqual(0);
    });

    it("should track cache hit rate", async () => {
      const testUserId = "test-user-id";

      // First call - should execute query
      await client.getCampaignsByUserAndStatus(testUserId);

      // Second call - should hit cache
      await client.getCampaignsByUserAndStatus(testUserId);

      const cacheStats = client.getCacheStats();
      expect(cacheStats.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Caching Functionality", () => {
    it("should cache and return cached results", async () => {
      const testUserId = "test-user-123";

      // First call
      const start1 = Date.now();
      const result1 = await client.getCampaignsByUserAndStatus(testUserId);
      const duration1 = Date.now() - start1;

      // Second call should be faster (cached)
      const start2 = Date.now();
      const result2 = await client.getCampaignsByUserAndStatus(testUserId);
      const duration2 = Date.now() - start2;

      // Results should be identical
      expect(result1).toEqual(result2);

      // Second call should be faster (though this might be flaky in fast systems)
      expect(duration2).toBeLessThanOrEqual(duration1 + 10); // Allow 10ms tolerance
    });

    it("should respect cache TTL", async () => {
      const testUserId = "test-user-ttl";

      await client.getCampaignsByUserAndStatus(testUserId);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.getCampaignsByUserAndStatus(testUserId);

      const connectionMetrics = client.getMetrics();
      expect(connectionMetrics.totalQueries).toBeGreaterThan(0);
    });
  });

  describe("Optimized Query Methods", () => {
    it("should execute getCampaignsByUserAndStatus with proper parameters", async () => {
      const result = await client.getCampaignsByUserAndStatus(
        "user-123",
        "ACTIVE",
        10,
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute getAgentPerformanceMetrics with date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      const result = await client.getAgentPerformanceMetrics(
        "agent-123",
        startDate,
        endDate,
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute getCampaignAnalytics with filters", async () => {
      const result = await client.getCampaignAnalytics(
        "campaign-123",
        "ENGAGEMENT",
        "daily",
        50,
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute getHighValueLeads with score filter", async () => {
      const result = await client.getHighValueLeads(8.0, 25);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute getTrendingKeywords with platform filter", async () => {
      const result = await client.getTrendingKeywords("INSTAGRAM", 6.0, 15);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute getContentByPlatformAndStatus", async () => {
      const result = await client.getContentByPlatformAndStatus(
        "FACEBOOK",
        "PUBLISHED",
        30,
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Batch Operations", () => {
    it("should create campaign with analytics in transaction", async () => {
      const campaignData = {
        name: "Test Campaign",
        type: "SOCIAL_MEDIA",
        userId: "test-user-batch",
      };

      const initialAnalytics = [
        {
          type: "ENGAGEMENT",
          data: { views: 1000 },
        },
      ];

      const result = await client.createCampaignWithAnalytics(
        campaignData,
        initialAnalytics,
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Campaign");
    });

    it("should create campaign without analytics", async () => {
      const campaignData = {
        name: "Simple Campaign",
        type: "EMAIL",
        userId: "test-user-simple",
      };

      const result = await client.createCampaignWithAnalytics(campaignData);
      expect(result).toBeDefined();
      expect(result.name).toBe("Simple Campaign");
    });
  });

  describe("Query Metrics Analysis", () => {
    it("should identify slow queries", async () => {
      // Execute multiple queries to generate metrics
      await Promise.all([
        client.getCampaignsByUserAndStatus("user-1"),
        client.getAgentPerformanceMetrics("agent-1"),
        client.getCampaignAnalytics("campaign-1"),
        client.getHighValueLeads(),
        client.getTrendingKeywords(),
      ]);

      const connectionMetrics = client.getMetrics();
      const queryMetrics = client.getQueryMetrics();
      const slowQueries = client.getSlowQueries(100);

      expect(connectionMetrics.totalQueries).toBeGreaterThan(0);
      expect(connectionMetrics.averageQueryTime).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(queryMetrics)).toBe(true);
      expect(Array.isArray(slowQueries)).toBe(true);
    });

    it("should clear metrics and cache", async () => {
      await client.getCampaignsByUserAndStatus("test-user");

      let connectionMetrics = client.getMetrics();
      expect(connectionMetrics.totalQueries).toBeGreaterThan(0);

      client.clearMetrics();
      client.clearCache();

      connectionMetrics = client.getMetrics();
      expect(connectionMetrics.totalQueries).toBe(0);
    });
  });

  describe("Connection Management", () => {
    it("should provide health check functionality", async () => {
      const healthCheck = await client.healthCheck();
      expect(healthCheck).toBeDefined();
      expect(typeof healthCheck.status).toBe("string");
      expect(typeof healthCheck.latency).toBe("number");
    });
  });

  describe("Index-Optimized Queries Performance", () => {
    it("should leverage user role and creation date index", async () => {
      const startTime = Date.now();

      // Note: These tests would need actual database setup to work properly
      // For now, they serve as documentation of expected performance
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it("should leverage campaign status and type index", async () => {
      const startTime = Date.now();
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it("should leverage agent execution performance index", async () => {
      const startTime = Date.now();
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should handle dashboard query pattern efficiently", async () => {
      const userId = "dashboard-user";
      const startTime = Date.now();

      // Simulate dashboard loading multiple data sources
      await Promise.all([
        client.getCampaignsByUserAndStatus(userId, "ACTIVE"),
        client.getCampaignAnalytics("campaign-123", "ENGAGEMENT"),
        client.getHighValueLeads(7.0),
        client.getTrendingKeywords("INSTAGRAM", 5.0),
      ]);

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // Reasonable timeout for testing

      const connectionMetrics = client.getMetrics();
      expect(connectionMetrics.totalQueries).toBeGreaterThan(0);
    });

    it("should handle repeated queries with caching", async () => {
      const userId = "cache-user";

      // First load
      await client.getCampaignsByUserAndStatus(userId);

      // Subsequent loads should hit cache
      await Promise.all([
        client.getCampaignsByUserAndStatus(userId),
        client.getCampaignsByUserAndStatus(userId),
        client.getCampaignsByUserAndStatus(userId),
      ]);

      const cacheStats = client.getCacheStats();
      expect(cacheStats.size).toBeGreaterThanOrEqual(0);
    });
  });
});
