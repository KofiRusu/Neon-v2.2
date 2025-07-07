import { PrismaClient } from "@prisma/client";

interface OptimizedClientOptions {
  connectionTimeout?: number;
  queryTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface QueryMetrics {
  duration: number;
  model: string;
  operation: string;
  timestamp: Date;
  cached: boolean;
  recordCount?: number;
}

interface ConnectionMetrics {
  activeConnections: number;
  totalQueries: number;
  averageQueryTime: number;
  errorRate: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  enabled?: boolean;
}

// Enhanced Prisma client with performance monitoring and caching
export class OptimizedPrismaClient extends PrismaClient {
  private options: OptimizedClientOptions;
  private queryMetrics: QueryMetrics[] = [];
  private connectionMetrics: ConnectionMetrics = {
    activeConnections: 0,
    totalQueries: 0,
    averageQueryTime: 0,
    errorRate: 0,
  };
  private cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();
  private cacheOptions: CacheOptions;

  constructor(
    options: OptimizedClientOptions = {},
    cacheOptions: CacheOptions = {},
  ) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ["query", "info", "warn", "error"],
    });

    this.options = {
      connectionTimeout: 10000,
      queryTimeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      ...options,
    };

    this.cacheOptions = {
      ttl: 60000, // 1 minute
      maxSize: 1000,
      enabled: true,
      ...cacheOptions,
    };

    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.$use(async (params: any, next: any) => {
      const start = Date.now();
      this.connectionMetrics.activeConnections++;

      try {
        const result = await this.withRetry(() => next(params));
        const duration = Date.now() - start;

        this.recordMetrics({
          duration,
          model: params.model || "unknown",
          operation: params.action,
          timestamp: new Date(),
          cached: false,
        });

        return result;
      } catch (error) {
        this.connectionMetrics.errorRate++;
        throw error;
      } finally {
        this.connectionMetrics.activeConnections--;
      }
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxRetries!; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.options.maxRetries) {
          throw lastError;
        }

        await this.delay(this.options.retryDelay! * attempt);
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private recordMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    this.connectionMetrics.totalQueries++;

    const totalTime = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
    this.connectionMetrics.averageQueryTime =
      totalTime / this.queryMetrics.length;

    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }

  getQueryMetrics(limit = 100): QueryMetrics[] {
    return this.queryMetrics.slice(-limit);
  }

  getSlowQueries(threshold = 1000): QueryMetrics[] {
    return this.queryMetrics.filter((m) => m.duration > threshold);
  }

  clearMetrics(): void {
    this.queryMetrics = [];
    this.connectionMetrics = {
      activeConnections: 0,
      totalQueries: 0,
      averageQueryTime: 0,
      errorRate: 0,
    };
  }

  private getCacheKey(model: string, operation: string, args: unknown): string {
    return `${model}:${operation}:${JSON.stringify(args)}`;
  }

  private getFromCache(key: string): unknown | null {
    if (!this.cacheOptions.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: unknown, ttl?: number): void {
    if (!this.cacheOptions.enabled) return;

    if (this.cache.size >= this.cacheOptions.maxSize!) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheOptions.ttl!,
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheOptions.maxSize!,
      hitRate: 0,
    };
  }

  async healthCheck(): Promise<{
    status: string;
    latency: number;
    error?: string;
  }> {
    const start = Date.now();

    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: "healthy",
        latency,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Optimized query methods with caching
  async getCampaignsByUserAndStatus(
    userId: string,
    status?: string,
    limit: number = 50,
  ) {
    const cacheKey = this.getCacheKey("campaign", "findMany", {
      userId,
      status,
      limit,
    });
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.campaign.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        analytics: {
          take: 1,
          orderBy: { date: "desc" },
        },
      },
    });

    this.setCache(cacheKey, result);
    return result;
  }

  async getAgentPerformanceMetrics(
    agentId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.agentExecution.findMany({
      where: {
        agentId,
        ...(startDate && { startedAt: { gte: startDate } }),
        ...(endDate && { startedAt: { lte: endDate } }),
        status: "COMPLETED",
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        task: true,
        performance: true,
        startedAt: true,
        completedAt: true,
      },
    });
  }

  async getCampaignAnalytics(
    campaignId: string,
    type?: string,
    period?: string,
    limit: number = 100,
  ) {
    return this.analytics.findMany({
      where: {
        campaignId,
        ...(type && { type: type as any }),
        ...(period && { period }),
      },
      orderBy: { date: "desc" },
      take: limit,
    });
  }

  async getHighValueLeads(minScore: number = 7.0, limit: number = 50) {
    return this.lead.findMany({
      where: {
        score: { gte: minScore },
      },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  async getTrendingKeywords(
    platform?: string,
    minScore: number = 5.0,
    limit: number = 20,
  ) {
    return this.trend.findMany({
      where: {
        ...(platform && { platform: platform as any }),
        score: { gte: minScore },
      },
      orderBy: [{ score: "desc" }, { detectedAt: "desc" }],
      take: limit,
    });
  }

  async getContentByPlatformAndStatus(
    platform: string,
    status?: string,
    limit: number = 50,
  ) {
    return this.content.findMany({
      where: {
        platform: platform as any,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async createCampaignWithAnalytics(
    campaignData: any,
    initialAnalytics?: any[],
  ) {
    return this.$transaction(async (tx: any) => {
      const campaign = await tx.campaign.create({
        data: campaignData,
      });

      if (initialAnalytics && initialAnalytics.length > 0) {
        await tx.analytics.createMany({
          data: initialAnalytics.map((analytics: any) => ({
            ...analytics,
            campaignId: campaign.id,
          })),
        });
      }

      return campaign;
    });
  }
}

// Export singleton instance
export const optimizedDb = new OptimizedPrismaClient();

// Export types for use in applications
export type {
  OptimizedClientOptions,
  QueryMetrics,
  ConnectionMetrics,
  CacheOptions,
};
