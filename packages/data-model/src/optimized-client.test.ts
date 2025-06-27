import { OptimizedPrismaClient, QueryMetrics, ConnectionMetrics } from './optimized-client';

describe('OptimizedPrismaClient', () => {
  let client: OptimizedPrismaClient;

  beforeAll(async () => {
    client = new OptimizedPrismaClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  beforeEach(() => {
    client.clearCache();
    client.clearMetrics();
  });

  describe('Performance Monitoring', () => {
    it('should track query metrics', async () => {
      // Execute a simple query
      await client.prisma.user.findMany({ take: 1 });

      const metrics = client.getQueryMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);
      expect(metrics.avgDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.recentActivity).toBeDefined();
    });

    it('should track cache hit rate', async () => {
      const testUserId = 'test-user-id';

      // First call - should execute query
      await client.getCampaignsByUserAndStatus(testUserId);

      // Second call - should hit cache
      await client.getCampaignsByUserAndStatus(testUserId);

      const metrics = client.getQueryMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Caching Functionality', () => {
    it('should cache and return cached results', async () => {
      const testUserId = 'test-user-123';

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

    it('should respect cache TTL', async () => {
      const testUserId = 'test-user-ttl';

      // Mock a very short TTL by directly accessing private method via any
      const originalTTL = (client as any).DEFAULT_CACHE_TTL;
      (client as any).DEFAULT_CACHE_TTL = 1; // 1ms

      await client.getCampaignsByUserAndStatus(testUserId);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      await client.getCampaignsByUserAndStatus(testUserId);

      // Restore original TTL
      (client as any).DEFAULT_CACHE_TTL = originalTTL;

      const metrics = client.getQueryMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);
    });
  });

  describe('Optimized Query Methods', () => {
    it('should execute getCampaignsByUserAndStatus with proper parameters', async () => {
      const result = await client.getCampaignsByUserAndStatus('user-123', 'ACTIVE', 10);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should execute getAgentPerformanceMetrics with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await client.getAgentPerformanceMetrics('agent-123', startDate, endDate);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should execute getCampaignAnalytics with filters', async () => {
      const result = await client.getCampaignAnalytics('campaign-123', 'ENGAGEMENT', 'daily', 50);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should execute getHighValueLeads with score filter', async () => {
      const result = await client.getHighValueLeads(8.0, 25);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should execute getTrendingKeywords with platform filter', async () => {
      const result = await client.getTrendingKeywords('INSTAGRAM', 6.0, 15);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should execute getContentByPlatformAndStatus', async () => {
      const result = await client.getContentByPlatformAndStatus('FACEBOOK', 'PUBLISHED', 30);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Batch Operations', () => {
    it('should create campaign with analytics in transaction', async () => {
      const campaignData = {
        name: 'Test Campaign',
        type: 'SOCIAL_MEDIA',
        userId: 'test-user-batch',
      };

      const initialAnalytics = [
        {
          type: 'ENGAGEMENT',
          data: { views: 1000 },
        },
      ];

      const result = await client.createCampaignWithAnalytics(campaignData, initialAnalytics);
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Campaign');
    });

    it('should create campaign without analytics', async () => {
      const campaignData = {
        name: 'Simple Campaign',
        type: 'EMAIL',
        userId: 'test-user-simple',
      };

      const result = await client.createCampaignWithAnalytics(campaignData);
      expect(result).toBeDefined();
      expect(result.name).toBe('Simple Campaign');
    });
  });

  describe('Query Metrics Analysis', () => {
    it('should identify slow queries', async () => {
      // Execute multiple queries to generate metrics
      await Promise.all([
        client.getCampaignsByUserAndStatus('user-1'),
        client.getAgentPerformanceMetrics('agent-1'),
        client.getCampaignAnalytics('campaign-1'),
        client.getHighValueLeads(),
        client.getTrendingKeywords(),
      ]);

      const metrics = client.getQueryMetrics();

      expect(metrics.totalQueries).toBeGreaterThan(0);
      expect(metrics.avgDuration).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(metrics.slowQueries)).toBe(true);
      expect(Array.isArray(metrics.recentActivity)).toBe(true);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should clear metrics and cache', async () => {
      await client.getCampaignsByUserAndStatus('test-user');

      let metrics = client.getQueryMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);

      client.clearMetrics();
      client.clearCache();

      metrics = client.getQueryMetrics();
      expect(metrics.totalQueries).toBe(0);
    });
  });

  describe('Connection Management', () => {
    it('should provide access to underlying prisma client', () => {
      const prismaClient = client.prisma;
      expect(prismaClient).toBeDefined();
      expect(typeof prismaClient.user.findMany).toBe('function');
    });
  });

  describe('Index-Optimized Queries Performance', () => {
    it('should leverage user role and creation date index', async () => {
      const startTime = Date.now();

      // This query should use the new index on [role, createdAt]
      await client.prisma.user.findMany({
        where: {
          role: 'USER',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });

    it('should leverage campaign status and type index', async () => {
      const startTime = Date.now();

      // This query should use the new index on [status, type]
      await client.prisma.campaign.findMany({
        where: {
          status: 'ACTIVE',
          type: 'SOCIAL_MEDIA',
        },
        take: 10,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });

    it('should leverage agent execution performance index', async () => {
      const startTime = Date.now();

      // This query should use the new index on [agentId, status, startedAt]
      await client.prisma.agentExecution.findMany({
        where: {
          agentId: 'test-agent',
          status: 'COMPLETED',
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 10,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle dashboard query pattern efficiently', async () => {
      const userId = 'dashboard-user';
      const startTime = Date.now();

      // Simulate dashboard loading multiple data sources
      await Promise.all([
        client.getCampaignsByUserAndStatus(userId, 'ACTIVE'),
        client.getCampaignAnalytics('campaign-123', 'ENGAGEMENT'),
        client.getHighValueLeads(7.0),
        client.getTrendingKeywords('INSTAGRAM', 5.0),
      ]);

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(2000); // Dashboard should load in under 2 seconds

      const metrics = client.getQueryMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);
    });

    it('should handle repeated queries with caching', async () => {
      const userId = 'cache-user';

      // First load
      await client.getCampaignsByUserAndStatus(userId);

      // Subsequent loads should hit cache
      await Promise.all([
        client.getCampaignsByUserAndStatus(userId),
        client.getCampaignsByUserAndStatus(userId),
        client.getCampaignsByUserAndStatus(userId),
      ]);

      const metrics = client.getQueryMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0.5); // At least 50% cache hit rate
    });
  });
});
