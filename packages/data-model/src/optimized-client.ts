import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

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

// Performance monitoring types
interface QueryMetrics {
  operation: string;
  model: string;
  duration: number;
  timestamp: Date;
  cached: boolean;
  recordCount?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
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
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private cacheOptions: CacheOptions;

  constructor(options: OptimizedClientOptions = {}, cacheOptions: CacheOptions = {}) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
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
    this.$use(async (params, next) => {
      const start = Date.now();
      this.connectionMetrics.activeConnections++;

      try {
        const result = await this.withRetry(() => next(params));
        const duration = Date.now() - start;

        this.recordMetrics({
          duration,
          model: params.model || 'unknown',
          operation: params.action,
          timestamp: new Date(),
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    this.connectionMetrics.totalQueries++;

    // Calculate running average
    const totalTime = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
    this.connectionMetrics.averageQueryTime = totalTime / this.queryMetrics.length;

    // Keep only last 1000 metrics
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
    return this.queryMetrics.filter(m => m.duration > threshold);
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

  // Cache management
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
      // Remove oldest entry
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
      hitRate: 0, // Could implement hit rate tracking
    };
  }

  // Enhanced query methods with caching
  async findManyWithCache<T>(model: string, args: unknown, cacheTtl?: number): Promise<T[]> {
    const cacheKey = this.getCacheKey(model, 'findMany', args);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached as T[];
    }

    // Note: In a real implementation, you'd call the actual Prisma method
    // This is a simplified version for demonstration
    const result = await (this as any)[model].findMany(args);
    this.setCache(cacheKey, result, cacheTtl);

    return result;
  }

  async findUniqueWithCache<T>(model: string, args: unknown, cacheTtl?: number): Promise<T | null> {
    const cacheKey = this.getCacheKey(model, 'findUnique', args);
    const cached = this.getFromCache(cacheKey);

    if (cached !== undefined) {
      return cached as T | null;
    }

    const result = await (this as any)[model].findUnique(args);
    this.setCache(cacheKey, result, cacheTtl);

    return result;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; latency: number; error?: string }> {
    const start = Date.now();

    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Connection pool info
  getConnectionInfo(): {
    activeConnections: number;
    totalQueries: number;
    averageQueryTime: number;
    errorRate: number;
  } {
    return this.getMetrics();
  }

  // Optimized campaign queries using new indexes
  async getCampaignsByUserAndStatus(userId: string, status?: string, limit: number = 50) {
    return this.findManyWithCache('campaign', {
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        analytics: {
          take: 1,
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  // Optimized agent execution queries using new indexes
  async getAgentPerformanceMetrics(agentId: string, startDate?: Date, endDate?: Date) {
    return this.findManyWithCache('agentExecution', {
      where: {
        agentId,
        ...(startDate && { startedAt: { gte: startDate } }),
        ...(endDate && { startedAt: { lte: endDate } }),
        status: 'COMPLETED',
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        task: true,
        performance: true,
        startedAt: true,
        completedAt: true,
      },
    });
  }

  // Optimized analytics queries using new indexes
  async getCampaignAnalytics(
    campaignId: string,
    type?: string,
    period?: string,
    limit: number = 100
  ) {
    return this.findManyWithCache('analytics', {
      where: {
        campaignId,
        ...(type && { type: type as any }),
        ...(period && { period }),
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  // Optimized lead queries using new indexes
  async getHighValueLeads(minScore: number = 7.0, limit: number = 50) {
    return this.findManyWithCache('lead', {
      where: {
        score: { gte: minScore },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  // Optimized trend queries using new indexes
  async getTrendingKeywords(platform?: string, minScore: number = 5.0, limit: number = 20) {
    return this.findManyWithCache('trend', {
      where: {
        ...(platform && { platform: platform as any }),
        score: { gte: minScore },
      },
      orderBy: [{ score: 'desc' }, { detectedAt: 'desc' }],
      take: limit,
    });
  }

  // Content optimization queries
  async getContentByPlatformAndStatus(platform: string, status?: string, limit: number = 50) {
    return this.findManyWithCache('content', {
      where: {
        platform: platform as any,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Batch operations for better performance
  async createCampaignWithAnalytics(campaignData: any, initialAnalytics?: any[]) {
    return this.$transaction(async (tx: any) => {
      const campaign = await tx.campaign.create({
        data: campaignData,
      });

      if (initialAnalytics && initialAnalytics.length > 0) {
        await tx.analytics.createMany({
          data: initialAnalytics.map(analytics => ({
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
export type { OptimizedClientOptions, QueryMetrics, ConnectionMetrics, CacheOptions };
