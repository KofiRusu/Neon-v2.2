import { PrismaClient } from '@neon/data-model';

export interface MemoryEntry {
  id: string;
  agentId: string;
  sessionId: string;
  userId?: string;
  input: any;
  output: any;
  timestamp: Date;
  score?: number;
  tokensUsed: number;
  cost: number;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export interface MemoryQueryOptions {
  agentId?: string;
  sessionId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  successOnly?: boolean;
  sortBy?: 'timestamp' | 'cost' | 'executionTime' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export interface MemoryMetrics {
  totalRuns: number;
  successRate: number;
  averageCost: number;
  averageTokens: number;
  averageExecutionTime: number;
  averageScore?: number;
  totalCost: number;
  totalTokens: number;
  costTrend: Array<{ date: string; cost: number }>;
  performanceTrend: Array<{ date: string; executionTime: number }>;
  successTrend: Array<{ date: string; successRate: number }>;
}

export class AgentMemoryStore {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Store a new memory entry for an agent interaction
   */
  async storeMemory(
    agentId: string,
    sessionId: string,
    input: any,
    output: any,
    metadata?: {
      userId?: string;
      tokensUsed?: number;
      cost?: number;
      executionTime?: number;
      success?: boolean;
      score?: number;
      errorMessage?: string;
      [key: string]: any;
    }
  ): Promise<MemoryEntry> {
    const entry = await this.prisma.agentMemory.create({
      data: {
        agentId,
        sessionId,
        userId: metadata?.userId,
        input,
        output,
        tokensUsed: metadata?.tokensUsed || 0,
        cost: metadata?.cost || 0,
        executionTime: metadata?.executionTime || 0,
        success: metadata?.success !== false,
        score: metadata?.score,
        errorMessage: metadata?.errorMessage,
        metadata: metadata ? { ...metadata } : null,
      },
    });

    return this.mapPrismaToMemoryEntry(entry);
  }

  /**
   * Retrieve memory entries based on query options
   */
  async getMemories(options: MemoryQueryOptions = {}): Promise<MemoryEntry[]> {
    const {
      agentId,
      sessionId,
      userId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      successOnly,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = options;

    const where: any = {};

    if (agentId) where.agentId = agentId;
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;
    if (successOnly !== undefined) where.success = successOnly;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const entries = await this.prisma.agentMemory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return entries.map(this.mapPrismaToMemoryEntry);
  }

  /**
   * Get the last N successful runs for an agent
   */
  async getLastSuccessfulRuns(agentId: string, count: number = 5): Promise<MemoryEntry[]> {
    return this.getMemories({
      agentId,
      successOnly: true,
      limit: count,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });
  }

  /**
   * Get failed runs for analysis
   */
  async getFailedRuns(agentId: string, limit: number = 10): Promise<MemoryEntry[]> {
    return this.getMemories({
      agentId,
      successOnly: false,
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });
  }

  /**
   * Get runs above a cost threshold
   */
  async getHighCostRuns(
    agentId: string,
    costThreshold: number,
    limit: number = 20
  ): Promise<MemoryEntry[]> {
    const entries = await this.prisma.agentMemory.findMany({
      where: {
        agentId,
        cost: {
          gte: costThreshold,
        },
      },
      orderBy: { cost: 'desc' },
      take: limit,
    });

    return entries.map(this.mapPrismaToMemoryEntry);
  }

  /**
   * Get comprehensive metrics for an agent
   */
  async getAgentMetrics(agentId: string, days: number = 30): Promise<MemoryMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.getMemories({
      agentId,
      startDate,
      limit: 1000, // Get more data for accurate metrics
    });

    if (entries.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        averageCost: 0,
        averageTokens: 0,
        averageExecutionTime: 0,
        totalCost: 0,
        totalTokens: 0,
        costTrend: [],
        performanceTrend: [],
        successTrend: [],
      };
    }

    const successfulRuns = entries.filter(e => e.success);
    const totalRuns = entries.length;
    const successRate = (successfulRuns.length / totalRuns) * 100;

    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const totalTokens = entries.reduce((sum, e) => sum + e.tokensUsed, 0);
    const totalExecutionTime = entries.reduce((sum, e) => sum + e.executionTime, 0);

    const averageCost = totalCost / totalRuns;
    const averageTokens = totalTokens / totalRuns;
    const averageExecutionTime = totalExecutionTime / totalRuns;

    const scoredEntries = entries.filter(e => e.score !== null && e.score !== undefined);
    const averageScore =
      scoredEntries.length > 0
        ? scoredEntries.reduce((sum, e) => sum + (e.score || 0), 0) / scoredEntries.length
        : undefined;

    // Generate trends (daily aggregations)
    const costTrend = this.generateDailyTrend(entries, 'cost', days);
    const performanceTrend = this.generateDailyTrend(entries, 'executionTime', days);
    const successTrend = this.generateSuccessTrend(entries, days);

    return {
      totalRuns,
      successRate,
      averageCost,
      averageTokens,
      averageExecutionTime,
      averageScore,
      totalCost,
      totalTokens,
      costTrend,
      performanceTrend,
      successTrend,
    };
  }

  /**
   * Get metrics for all agents (comparative analysis)
   */
  async getAllAgentMetrics(days: number = 30): Promise<Record<string, MemoryMetrics>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all unique agent IDs from recent memory
    const agentIds = await this.prisma.agentMemory.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      select: { agentId: true },
      distinct: ['agentId'],
    });

    const metrics: Record<string, MemoryMetrics> = {};

    for (const { agentId } of agentIds) {
      metrics[agentId] = await this.getAgentMetrics(agentId, days);
    }

    return metrics;
  }

  /**
   * Get memory entries for a specific session
   */
  async getSessionMemory(sessionId: string): Promise<MemoryEntry[]> {
    return this.getMemories({
      sessionId,
      sortBy: 'timestamp',
      sortOrder: 'asc',
    });
  }

  /**
   * Clear old memory entries (cleanup)
   */
  async clearOldMemories(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.agentMemory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Update the score of a memory entry (for post-execution feedback)
   */
  async updateMemoryScore(memoryId: string, score: number, metadata?: any): Promise<void> {
    await this.prisma.agentMemory.update({
      where: { id: memoryId },
      data: {
        score,
        metadata: metadata ? { ...metadata } : undefined,
      },
    });
  }

  /**
   * Helper method to map Prisma result to MemoryEntry
   */
  private mapPrismaToMemoryEntry(entry: any): MemoryEntry {
    return {
      id: entry.id,
      agentId: entry.agentId,
      sessionId: entry.sessionId,
      userId: entry.userId,
      input: entry.input,
      output: entry.output,
      timestamp: entry.timestamp,
      score: entry.score,
      tokensUsed: entry.tokensUsed,
      cost: entry.cost,
      executionTime: entry.executionTime,
      success: entry.success,
      errorMessage: entry.errorMessage,
      metadata: entry.metadata,
    };
  }

  /**
   * Generate daily trend data
   */
  private generateDailyTrend(
    entries: MemoryEntry[],
    field: keyof MemoryEntry,
    days: number
  ): Array<{ date: string; [key: string]: any }> {
    const trend: Array<{ date: string; [key: string]: any }> = [];
    const dailyData: Record<string, { sum: number; count: number }> = {};

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { sum: 0, count: 0 };
    }

    // Aggregate data by day
    entries.forEach(entry => {
      const dateStr = entry.timestamp.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        const value = (entry[field as keyof MemoryEntry] as number) || 0;
        dailyData[dateStr].sum += value;
        dailyData[dateStr].count += 1;
      }
    });

    // Generate trend with averages
    Object.entries(dailyData).forEach(([date, data]) => {
      const fieldName = field === 'executionTime' ? 'executionTime' : field;
      trend.push({
        date,
        [fieldName]: data.count > 0 ? data.sum / data.count : 0,
      });
    });

    return trend;
  }

  /**
   * Generate success rate trend
   */
  private generateSuccessTrend(
    entries: MemoryEntry[],
    days: number
  ): Array<{ date: string; successRate: number }> {
    const trend: Array<{ date: string; successRate: number }> = [];
    const dailyData: Record<string, { successful: number; total: number }> = {};

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { successful: 0, total: 0 };
    }

    // Aggregate data by day
    entries.forEach(entry => {
      const dateStr = entry.timestamp.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].total += 1;
        if (entry.success) {
          dailyData[dateStr].successful += 1;
        }
      }
    });

    // Generate trend with success rates
    Object.entries(dailyData).forEach(([date, data]) => {
      trend.push({
        date,
        successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
      });
    });

    return trend;
  }
}

export default AgentMemoryStore;
