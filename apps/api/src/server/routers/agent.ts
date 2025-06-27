import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';

const agentNames = [
  'ContentAgent',
  'SEOAgent',
  'EmailMarketingAgent',
  'SocialPostingAgent',
  'CustomerSupportAgent',
  'AdAgent',
  'OutreachAgent',
  'TrendAgent',
  'InsightAgent',
  'DesignAgent',
] as const;

export const agentRouter = createTRPCRouter({
  // Get all AI event logs
  getLogs: publicProcedure
    .input(
      z.object({
        agent: z.enum(agentNames).optional(),
        action: z.string().optional(),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.agent && { agent: input.agent }),
        ...(input.action && { action: { contains: input.action } }),
        ...(input.startDate &&
          input.endDate && {
            createdAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      return ctx.db.aIEventLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit,
      });
    }),

  // Log a new AI agent event
  logEvent: protectedProcedure
    .input(
      z.object({
        agent: z.enum(agentNames),
        action: z.string().min(1),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.aIEventLog.create({
        data: {
          agent: input.agent,
          action: input.action,
          metadata: input.metadata || {},
        },
      });
    }),

  // Get agent activity summary
  getActivitySummary: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        agent: z.enum(agentNames).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.agent && { agent: input.agent }),
        ...(input.startDate &&
          input.endDate && {
            createdAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      const [totalEvents, agentBreakdown] = await Promise.all([
        ctx.db.aIEventLog.count({ where }),
        ctx.db.aIEventLog.groupBy({
          by: ['agent'],
          where,
          _count: {
            id: true,
          },
        }),
      ]);

      return {
        totalEvents,
        agentBreakdown: agentBreakdown.map(item => ({
          agent: item.agent,
          count: item._count.id,
        })),
      };
    }),

  // Get recent agent actions
  getRecentActions: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        agent: z.enum(agentNames).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = input.agent ? { agent: input.agent } : {};

      return ctx.db.aIEventLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: {
          id: true,
          agent: true,
          action: true,
          createdAt: true,
          metadata: true,
        },
      });
    }),

  // Get agent performance metrics
  getPerformanceMetrics: publicProcedure
    .input(
      z.object({
        agent: z.enum(agentNames),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        agent: input.agent,
        ...(input.startDate &&
          input.endDate && {
            createdAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      const [totalActions, successfulActions, actionBreakdown, recentActivity] = await Promise.all([
        ctx.db.aIEventLog.count({ where }),
        ctx.db.aIEventLog.count({
          where: {
            ...where,
            action: { contains: 'success' },
          },
        }),
        ctx.db.aIEventLog.groupBy({
          by: ['action'],
          where,
          _count: {
            id: true,
          },
        }),
        ctx.db.aIEventLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            action: true,
            createdAt: true,
            metadata: true,
          },
        }),
      ]);

      const successRate = totalActions > 0 ? successfulActions / totalActions : 0;

      return {
        totalActions,
        successfulActions,
        successRate,
        actionBreakdown: actionBreakdown.map(item => ({
          action: item.action,
          count: item._count.id,
        })),
        recentActivity,
      };
    }),

  // Delete old logs (cleanup)
  cleanupLogs: protectedProcedure
    .input(
      z.object({
        olderThan: z.date(),
        agent: z.enum(agentNames).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where = {
        createdAt: { lt: input.olderThan },
        ...(input.agent && { agent: input.agent }),
      };

      return ctx.db.aIEventLog.deleteMany({ where });
    }),
});
