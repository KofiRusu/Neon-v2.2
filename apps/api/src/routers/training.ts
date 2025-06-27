import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server/trpc';

// Input validation schemas
const TrainingLogSchema = z.object({
  agentId: z.string().min(1),
  agentType: z.string().min(1),
  eventType: z.enum([
    'FINE_TUNING',
    'RETRY',
    'OPTIMIZATION',
    'PERFORMANCE_UPDATE',
    'MODEL_SWITCH',
    'VALIDATION',
  ]),
  scoreBefore: z.number().min(0).max(100).optional(),
  scoreAfter: z.number().min(0).max(100).optional(),
  scoreDelta: z.number().optional(),
  trainingData: z.record(z.any()).optional(),
  hyperparameters: z.record(z.any()).optional(),
  modelVersion: z.string().optional(),
  retryCount: z.number().min(0).default(0),
  performance: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

const ChartDataQuery = z.object({
  agentId: z.string().optional(),
  agentType: z.string().optional(),
  eventType: z
    .enum([
      'FINE_TUNING',
      'RETRY',
      'OPTIMIZATION',
      'PERFORMANCE_UPDATE',
      'MODEL_SWITCH',
      'VALIDATION',
    ])
    .optional(),
  timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).default('7d'),
  limit: z.number().min(1).max(1000).default(100),
});

export const trainingRouter = createTRPCRouter({
  // Create a new training log entry
  logTrainingEvent: protectedProcedure.input(TrainingLogSchema).mutation(async ({ ctx, input }) => {
    try {
      // Calculate score delta if both scores provided
      const scoreDelta =
        input.scoreAfter && input.scoreBefore
          ? input.scoreAfter - input.scoreBefore
          : input.scoreDelta;

      const trainingLog = await ctx.db.trainingLog.create({
        data: {
          ...input,
          scoreDelta,
        },
      });

      // Log the event to AIEventLog for system tracking
      await ctx.db.aIEventLog.create({
        data: {
          agent: input.agentType,
          action: 'training_event_logged',
          metadata: {
            trainingLogId: trainingLog.id,
            eventType: input.eventType,
            scoreDelta,
            agentId: input.agentId,
          },
        },
      });

      return {
        success: true,
        trainingLog,
      };
    } catch (error) {
      throw new Error(`Failed to log training event: ${error}`);
    }
  }),

  // Get training logs with filtering and pagination
  getTrainingLogs: publicProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        agentType: z.string().optional(),
        eventType: z
          .enum([
            'FINE_TUNING',
            'RETRY',
            'OPTIMIZATION',
            'PERFORMANCE_UPDATE',
            'MODEL_SWITCH',
            'VALIDATION',
          ])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['createdAt', 'scoreDelta', 'scoreAfter']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.agentId) where.agentId = input.agentId;
      if (input.agentType) where.agentType = input.agentType;
      if (input.eventType) where.eventType = input.eventType;

      const [logs, totalCount] = await Promise.all([
        ctx.db.trainingLog.findMany({
          where,
          orderBy: { [input.sortBy]: input.sortOrder },
          skip: input.offset,
          take: input.limit,
        }),
        ctx.db.trainingLog.count({ where }),
      ]);

      return {
        logs,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  // Get performance chart data for visualization
  getPerformanceChart: publicProcedure.input(ChartDataQuery).query(async ({ ctx, input }) => {
    const where: any = {};

    if (input.agentId) where.agentId = input.agentId;
    if (input.agentType) where.agentType = input.agentType;
    if (input.eventType) where.eventType = input.eventType;

    // Calculate time filter based on range
    const now = new Date();
    const timeRanges = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    };

    where.createdAt = {
      gte: timeRanges[input.timeRange],
    };

    const logs = await ctx.db.trainingLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: input.limit,
      select: {
        id: true,
        agentId: true,
        agentType: true,
        eventType: true,
        scoreBefore: true,
        scoreAfter: true,
        scoreDelta: true,
        createdAt: true,
        modelVersion: true,
        retryCount: true,
      },
    });

    // Format data for chart visualization
    const chartData = logs.map(log => ({
      timestamp: log.createdAt,
      score: log.scoreAfter,
      scoreDelta: log.scoreDelta,
      eventType: log.eventType,
      agentType: log.agentType,
      agentId: log.agentId,
      modelVersion: log.modelVersion,
      retryCount: log.retryCount,
    }));

    // Calculate aggregated statistics
    const stats = {
      totalEvents: logs.length,
      avgScoreDelta: logs.reduce((sum, log) => sum + (log.scoreDelta || 0), 0) / logs.length || 0,
      maxScore: Math.max(...logs.map(log => log.scoreAfter || 0)),
      minScore: Math.min(...logs.map(log => log.scoreAfter || 100)),
      totalRetries: logs.reduce((sum, log) => sum + log.retryCount, 0),
      eventTypeDistribution: logs.reduce(
        (acc, log) => {
          acc[log.eventType] = (acc[log.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return {
      chartData,
      stats,
      timeRange: input.timeRange,
    };
  }),

  // Get agent performance trends
  getAgentTrends: publicProcedure
    .input(
      z.object({
        agentIds: z.array(z.string()).optional(),
        timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).default('7d'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.agentIds && input.agentIds.length > 0) {
        where.agentId = { in: input.agentIds };
      }

      // Calculate time filter
      const now = new Date();
      const timeRanges = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      };

      where.createdAt = {
        gte: timeRanges[input.timeRange],
      };

      // Get all training logs grouped by agent
      const logs = await ctx.db.trainingLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: {
          agentId: true,
          agentType: true,
          scoreAfter: true,
          scoreDelta: true,
          eventType: true,
          createdAt: true,
        },
      });

      // Group by agent and calculate trends
      const agentTrends = logs.reduce(
        (acc, log) => {
          const key = `${log.agentId}-${log.agentType}`;
          if (!acc[key]) {
            acc[key] = {
              agentId: log.agentId,
              agentType: log.agentType,
              dataPoints: [],
              currentScore: 0,
              scoreImprovement: 0,
              totalEvents: 0,
            };
          }

          acc[key].dataPoints.push({
            timestamp: log.createdAt,
            score: log.scoreAfter,
            scoreDelta: log.scoreDelta,
            eventType: log.eventType,
          });

          acc[key].currentScore = log.scoreAfter || acc[key].currentScore;
          acc[key].scoreImprovement += log.scoreDelta || 0;
          acc[key].totalEvents += 1;

          return acc;
        },
        {} as Record<string, any>
      );

      return {
        trends: Object.values(agentTrends),
        timeRange: input.timeRange,
      };
    }),

  // Get detailed training statistics
  getTrainingStats: publicProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        agentType: z.string().optional(),
        timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).default('30d'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.agentId) where.agentId = input.agentId;
      if (input.agentType) where.agentType = input.agentType;

      // Time filter
      const now = new Date();
      const timeRanges = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      };

      where.createdAt = {
        gte: timeRanges[input.timeRange],
      };

      const [logs, uniqueAgents] = await Promise.all([
        ctx.db.trainingLog.findMany({
          where,
          select: {
            eventType: true,
            scoreDelta: true,
            scoreAfter: true,
            retryCount: true,
            agentType: true,
            agentId: true,
            createdAt: true,
          },
        }),
        ctx.db.trainingLog.groupBy({
          by: ['agentId', 'agentType'],
          where,
          _count: true,
        }),
      ]);

      // Calculate comprehensive statistics
      const stats = {
        totalTrainingEvents: logs.length,
        uniqueAgents: uniqueAgents.length,
        avgScoreImprovement:
          logs.reduce((sum, log) => sum + (log.scoreDelta || 0), 0) / logs.length || 0,
        totalRetries: logs.reduce((sum, log) => sum + log.retryCount, 0),

        eventTypeBreakdown: logs.reduce(
          (acc, log) => {
            acc[log.eventType] = (acc[log.eventType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),

        agentTypeBreakdown: logs.reduce(
          (acc, log) => {
            acc[log.agentType] = (acc[log.agentType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),

        performanceDistribution: {
          excellent: logs.filter(log => (log.scoreAfter || 0) >= 90).length,
          good: logs.filter(log => (log.scoreAfter || 0) >= 75 && (log.scoreAfter || 0) < 90)
            .length,
          average: logs.filter(log => (log.scoreAfter || 0) >= 60 && (log.scoreAfter || 0) < 75)
            .length,
          poor: logs.filter(log => (log.scoreAfter || 0) < 60).length,
        },

        improvementTrend:
          (logs.filter(log => (log.scoreDelta || 0) > 0).length / logs.length) * 100 || 0,

        topPerformingAgents: uniqueAgents
          .map(agent => {
            const agentLogs = logs.filter(log => log.agentId === agent.agentId);
            const avgScore =
              agentLogs.reduce((sum, log) => sum + (log.scoreAfter || 0), 0) / agentLogs.length ||
              0;
            const totalImprovement = agentLogs.reduce((sum, log) => sum + (log.scoreDelta || 0), 0);

            return {
              agentId: agent.agentId,
              agentType: agent.agentType,
              avgScore,
              totalImprovement,
              eventCount: agent._count,
            };
          })
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 10),
      };

      return stats;
    }),
});
