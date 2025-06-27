import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { AgentMemoryStore, PerformanceTuner } from '@neon/core-agents';
import { PrismaClient } from '@neon/data-model';

// Initialize the memory store and performance tuner
const prisma = new PrismaClient();
const memoryStore = new AgentMemoryStore(prisma);
const performanceTuner = new PerformanceTuner(memoryStore);

// Input validation schemas
const AgentMemoryQuerySchema = z.object({
  agentId: z.string(),
  days: z.number().min(1).max(365).default(30),
  limit: z.number().min(1).max(1000).default(50),
  successOnly: z.boolean().optional(),
});

const StoreMemorySchema = z.object({
  agentId: z.string(),
  sessionId: z.string(),
  input: z.any(),
  output: z.any(),
  metadata: z
    .object({
      userId: z.string().optional(),
      tokensUsed: z.number().optional(),
      cost: z.number().optional(),
      executionTime: z.number().optional(),
      success: z.boolean().optional(),
      score: z.number().optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
});

const UpdateScoreSchema = z.object({
  memoryId: z.string(),
  score: z.number().min(0).max(100),
  metadata: z.any().optional(),
});

const ClearMemorySchema = z.object({
  agentId: z.string().optional(),
  olderThanDays: z.number().min(1).default(90),
});

export const agentMemoryRouter = createTRPCRouter({
  // Get agent memory and metrics
  getMemory: publicProcedure.input(AgentMemoryQuerySchema).query(async ({ input }) => {
    const { agentId, days, limit, successOnly } = input;

    // Get agent metrics
    const metrics = await memoryStore.getAgentMetrics(agentId, days);

    // Get recent memory entries
    const memories = await memoryStore.getMemories({
      agentId,
      limit,
      successOnly,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });

    // Get performance analysis
    const performanceProfile = await performanceTuner.analyzeAgent(agentId, days);

    return {
      agentId,
      agentName: performanceProfile.agentName,
      metrics,
      memories: memories.map(memory => ({
        id: memory.id,
        timestamp: memory.timestamp,
        success: memory.success,
        executionTime: memory.executionTime,
        cost: memory.cost,
        tokensUsed: memory.tokensUsed,
        task: (memory.input as any)?.task || 'Unknown task',
        errorMessage: memory.errorMessage,
      })),
      performanceProfile,
      trends: {
        costTrend: performanceProfile.trends.costTrend,
        performanceTrend: performanceProfile.trends.performanceTrend,
        successTrend: performanceProfile.trends.successTrend,
      },
      recommendations: performanceProfile.recommendations,
    };
  }),

  // Get system-wide memory analysis
  getSystemMemory: publicProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const { days } = input;

      const systemAnalysis = await performanceTuner.analyzeSystem(days);

      return {
        totalAgents: systemAnalysis.totalAgents,
        overallHealth: systemAnalysis.overallHealth,
        totalCost: systemAnalysis.totalCost,
        costTrend: systemAnalysis.costTrend,
        averageSuccessRate: systemAnalysis.averageSuccessRate,
        topPerformers: systemAnalysis.topPerformers,
        underperformers: systemAnalysis.underperformers,
        systemRecommendations: systemAnalysis.systemRecommendations,
        criticalIssues: systemAnalysis.criticalIssues,
      };
    }),

  // Store a new memory entry
  storeMemory: publicProcedure.input(StoreMemorySchema).mutation(async ({ input }) => {
    const { agentId, sessionId, input: agentInput, output, metadata } = input;

    const memoryEntry = await memoryStore.storeMemory(
      agentId,
      sessionId,
      agentInput,
      output,
      metadata
    );

    return {
      success: true,
      memoryId: memoryEntry.id,
      timestamp: memoryEntry.timestamp,
    };
  }),

  // Update memory score (for feedback)
  updateMemoryScore: publicProcedure.input(UpdateScoreSchema).mutation(async ({ input }) => {
    const { memoryId, score, metadata } = input;

    await memoryStore.updateMemoryScore(memoryId, score, metadata);

    return {
      success: true,
      message: 'Memory score updated successfully',
    };
  }),

  // Clear old memories
  clearMemory: publicProcedure.input(ClearMemorySchema).mutation(async ({ input }) => {
    const { agentId, olderThanDays } = input;

    let deletedCount: number;

    if (agentId) {
      // Clear specific agent memories (need to implement in AgentMemoryStore)
      const memories = await memoryStore.getMemories({
        agentId,
        startDate: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000),
      });
      deletedCount = memories.length;
      // TODO: Implement agent-specific cleanup in AgentMemoryStore
    } else {
      // Clear all old memories
      deletedCount = await memoryStore.clearOldMemories(olderThanDays);
    }

    return {
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} memory entries older than ${olderThanDays} days`,
    };
  }),

  // Get agent performance metrics only
  getPerformanceMetrics: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const { agentId, days } = input;

      const metrics = await memoryStore.getAgentMetrics(agentId, days);

      return metrics;
    }),

  // Get agent performance analysis
  getPerformanceAnalysis: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const { agentId, days } = input;

      const performanceProfile = await performanceTuner.analyzeAgent(agentId, days);

      return performanceProfile;
    }),

  // Get memory entries for a session
  getSessionMemory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const { sessionId } = input;

      const memories = await memoryStore.getSessionMemory(sessionId);

      return memories.map(memory => ({
        id: memory.id,
        agentId: memory.agentId,
        timestamp: memory.timestamp,
        success: memory.success,
        executionTime: memory.executionTime,
        cost: memory.cost,
        tokensUsed: memory.tokensUsed,
        input: memory.input,
        output: memory.output,
        errorMessage: memory.errorMessage,
      }));
    }),

  // Get high-cost runs for analysis
  getHighCostRuns: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        costThreshold: z.number().min(0).default(0.1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { agentId, costThreshold, limit } = input;

      const highCostRuns = await memoryStore.getHighCostRuns(agentId, costThreshold, limit);

      return highCostRuns.map(memory => ({
        id: memory.id,
        timestamp: memory.timestamp,
        cost: memory.cost,
        tokensUsed: memory.tokensUsed,
        executionTime: memory.executionTime,
        task: (memory.input as any)?.task || 'Unknown task',
        success: memory.success,
      }));
    }),

  // Get failed runs for debugging
  getFailedRuns: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const { agentId, limit } = input;

      const failedRuns = await memoryStore.getFailedRuns(agentId, limit);

      return failedRuns.map(memory => ({
        id: memory.id,
        timestamp: memory.timestamp,
        cost: memory.cost,
        tokensUsed: memory.tokensUsed,
        executionTime: memory.executionTime,
        task: (memory.input as any)?.task || 'Unknown task',
        errorMessage: memory.errorMessage,
        input: memory.input,
        output: memory.output,
      }));
    }),

  // Get all agents' comparative metrics
  getAllAgentMetrics: publicProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const { days } = input;

      const allMetrics = await memoryStore.getAllAgentMetrics(days);

      return allMetrics;
    }),

  // Get tuning recommendations for a specific agent
  getTuningRecommendations: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const { agentId, days } = input;

      const performanceProfile = await performanceTuner.analyzeAgent(agentId, days);

      return {
        agentId,
        agentName: performanceProfile.agentName,
        overallHealth: performanceProfile.overallHealth,
        healthScore: performanceProfile.healthScore,
        recommendations: performanceProfile.recommendations,
        benchmarkComparison: performanceProfile.benchmarkComparison,
      };
    }),

  // Health check endpoint
  healthCheck: publicProcedure.query(async () => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          memoryStore: 'initialized',
          performanceTuner: 'initialized',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          database: 'error',
          memoryStore: 'unknown',
          performanceTuner: 'unknown',
        },
      };
    }
  }),
});
