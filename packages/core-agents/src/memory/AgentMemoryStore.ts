import { PrismaClient } from "@neon/data-model";

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
  sortBy?: "timestamp" | "cost" | "executionTime" | "score";
  sortOrder?: "asc" | "desc";
}

export interface MemoryMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  averageCost: number;
  averageTokens: number;
  averageExecutionTime: number;
  averageScore?: number;
  totalCost: number;
  totalTokens: number;
  totalExecutionTime: number;
  trend: "improving" | "stable" | "declining";
  lastRun: Date | null;
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
    },
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
      sortBy = "timestamp",
      sortOrder = "desc",
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
  async getLastSuccessfulRuns(
    agentId: string,
    count: number = 5,
  ): Promise<MemoryEntry[]> {
    return this.getMemories({
      agentId,
      successOnly: true,
      limit: count,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
  }

  /**
   * Get failed runs for analysis
   */
  async getFailedRuns(
    agentId: string,
    limit: number = 10,
  ): Promise<MemoryEntry[]> {
    return this.getMemories({
      agentId,
      successOnly: false,
      limit,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
  }

  /**
   * Get runs above a cost threshold
   */
  async getHighCostRuns(
    agentId: string,
    costThreshold: number,
    limit: number = 20,
  ): Promise<MemoryEntry[]> {
    const entries = await this.prisma.agentMemory.findMany({
      where: {
        agentId,
        cost: {
          gte: costThreshold,
        },
      },
      orderBy: { cost: "desc" },
      take: limit,
    });

    return entries.map(this.mapPrismaToMemoryEntry);
  }

  /**
   * Get comprehensive metrics for an agent
   */
  async getAgentMetrics(
    agentId: string,
    days: number = 30,
  ): Promise<MemoryMetrics> {
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
        successfulRuns: 0,
        failedRuns: 0,
        successRate: 0,
        averageCost: 0,
        averageTokens: 0,
        averageExecutionTime: 0,
        totalCost: 0,
        totalTokens: 0,
        totalExecutionTime: 0,
        trend: "stable" as const,
        lastRun: null,
        costTrend: [],
        performanceTrend: [],
        successTrend: [],
      };
    }

    const successfulRuns = entries.filter((e) => e.success);
    const failedRuns = entries.filter((e) => !e.success);
    const totalRuns = entries.length;
    const successRate = (successfulRuns.length / totalRuns) * 100;

    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const totalTokens = entries.reduce((sum, e) => sum + e.tokensUsed, 0);
    const totalExecutionTime = entries.reduce(
      (sum, e) => sum + e.executionTime,
      0,
    );

    const averageCost = totalCost / totalRuns;
    const averageTokens = totalTokens / totalRuns;
    const averageExecutionTime = totalExecutionTime / totalRuns;

    const scoredEntries = entries.filter(
      (e) => e.score !== null && e.score !== undefined,
    );
    const averageScore =
      scoredEntries.length > 0
        ? scoredEntries.reduce((sum, e) => sum + (e.score || 0), 0) /
          scoredEntries.length
        : undefined;

    // Generate trends (daily aggregations)
    const costTrend = this.generateCostTrend(entries, days);
    const performanceTrend = this.generatePerformanceTrend(entries, days);
    const successTrend = this.generateSuccessTrend(entries, days);

    // Calculate overall trend (simplified logic)
    const trend = this.calculateOverallTrend(
      costTrend,
      performanceTrend,
      successTrend,
    );

    // Get last run timestamp
    const lastRun = entries.length > 0 ? entries[0].timestamp : null;

    return {
      totalRuns,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successRate,
      averageCost,
      averageTokens,
      averageExecutionTime,
      averageScore,
      totalCost,
      totalTokens,
      totalExecutionTime,
      trend,
      lastRun,
      costTrend,
      performanceTrend,
      successTrend,
    };
  }

  /**
   * Get metrics for all agents (comparative analysis)
   */
  async getAllAgentMetrics(
    days: number = 30,
  ): Promise<Record<string, MemoryMetrics>> {
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
      distinct: ["agentId"],
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
      sortBy: "timestamp",
      sortOrder: "asc",
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
  async updateMemoryScore(
    memoryId: string,
    score: number,
    metadata?: any,
  ): Promise<void> {
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
   * Generate success rate trend
   */
  private generateSuccessTrend(
    entries: MemoryEntry[],
    days: number,
  ): Array<{ date: string; successRate: number }> {
    const trend: Array<{ date: string; successRate: number }> = [];
    const dailyData: Record<string, { successful: number; total: number }> = {};

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { successful: 0, total: 0 };
    }

    // Aggregate data by day
    entries.forEach((entry) => {
      const dateStr = entry.timestamp.toISOString().split("T")[0];
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

  /**
   * Generate cost trend
   */
  private generateCostTrend(
    entries: MemoryEntry[],
    days: number,
  ): Array<{ date: string; cost: number }> {
    const dailyData: Record<string, { sum: number; count: number }> = {};

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { sum: 0, count: 0 };
    }

    // Aggregate data by day
    entries.forEach((entry) => {
      const dateStr = entry.timestamp.toISOString().split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].sum += entry.cost;
        dailyData[dateStr].count += 1;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      cost: data.count > 0 ? data.sum / data.count : 0,
    }));
  }

  /**
   * Generate performance trend
   */
  private generatePerformanceTrend(
    entries: MemoryEntry[],
    days: number,
  ): Array<{ date: string; executionTime: number }> {
    const dailyData: Record<string, { sum: number; count: number }> = {};

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { sum: 0, count: 0 };
    }

    // Aggregate data by day
    entries.forEach((entry) => {
      const dateStr = entry.timestamp.toISOString().split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].sum += entry.executionTime;
        dailyData[dateStr].count += 1;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      executionTime: data.count > 0 ? data.sum / data.count : 0,
    }));
  }

  /**
   * Calculate overall trend from multiple trend arrays
   */
  private calculateOverallTrend(
    costTrend: Array<{ date: string; cost: number }>,
    performanceTrend: Array<{ date: string; executionTime: number }>,
    successTrend: Array<{ date: string; successRate: number }>,
  ): "improving" | "stable" | "declining" {
    if (costTrend.length < 2) return "stable";

    // Simple trend analysis: compare first and last values
    const costStart = costTrend[0].cost;
    const costEnd = costTrend[costTrend.length - 1].cost;
    const performanceStart = performanceTrend[0].executionTime;
    const performanceEnd =
      performanceTrend[performanceTrend.length - 1].executionTime;
    const successStart = successTrend[0].successRate;
    const successEnd = successTrend[successTrend.length - 1].successRate;

    // Calculate trend scores (positive = improving, negative = declining)
    const costScore = costStart > 0 ? (costStart - costEnd) / costStart : 0; // Lower cost is better
    const performanceScore =
      performanceStart > 0
        ? (performanceStart - performanceEnd) / performanceStart
        : 0; // Lower time is better
    const successScore =
      successStart > 0 ? (successEnd - successStart) / successStart : 0; // Higher success is better

    const overallScore = (costScore + performanceScore + successScore) / 3;

    if (overallScore > 0.05) return "improving";
    if (overallScore < -0.05) return "declining";
    return "stable";
  }

  /**
   * Get system stats for monitoring
   */
  async getSystemStats(): Promise<any> {
    try {
      const totalMemories = await this.prisma.agentMemory.count();
      const recentCount = await this.prisma.agentMemory.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return {
        totalMemories,
        recentMemories: recentCount,
        memoryUtilization: Math.min((totalMemories / 10000) * 100, 100), // Assume 10k is max
        status: totalMemories > 8000 ? "high" : "normal",
      };
    } catch (error) {
      console.error("Failed to get system stats:", error);
      return {
        totalMemories: 0,
        recentMemories: 0,
        memoryUtilization: 0,
        status: "error",
      };
    }
  }

  /**
   * Get recent memories for an agent
   */
  async getRecentMemories(agentId: string, limit: number = 10): Promise<any[]> {
    try {
      const memories = await this.prisma.agentMemory.findMany({
        where: { agentId },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return memories.map((memory) => ({
        id: memory.id,
        agentId: memory.agentId,
        input: memory.input,
        output: memory.output,
        timestamp: memory.timestamp,
        success: memory.success,
        context: memory.metadata,
      }));
    } catch (error) {
      console.error(`Failed to get recent memories for ${agentId}:`, error);
      return [];
    }
  }
}

export default AgentMemoryStore;
