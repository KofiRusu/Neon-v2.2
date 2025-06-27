import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';

export const metricsRouter = createTRPCRouter({
  // Get metrics for a specific campaign
  getByCampaign: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        campaignId: input.campaignId,
        ...(input.startDate &&
          input.endDate && {
            timestamp: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      return ctx.db.campaignMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: input.offset,
        take: input.limit,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    }),

  // Create new metric entry
  create: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        impressions: z.number().min(0).default(0),
        ctr: z.number().min(0).max(1).default(0),
        conversions: z.number().min(0).default(0),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaignMetric.create({
        data: {
          campaignId: input.campaignId,
          impressions: input.impressions,
          ctr: input.ctr,
          conversions: input.conversions,
          timestamp: input.timestamp || new Date(),
        },
        include: {
          campaign: true,
        },
      });
    }),

  // Get aggregated metrics for a campaign
  getAggregated: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        campaignId: input.campaignId,
        ...(input.startDate &&
          input.endDate && {
            timestamp: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      const metrics = await ctx.db.campaignMetric.findMany({
        where,
        select: {
          impressions: true,
          ctr: true,
          conversions: true,
          timestamp: true,
        },
      });

      if (metrics.length === 0) {
        return {
          totalImpressions: 0,
          averageCtr: 0,
          totalConversions: 0,
          conversionRate: 0,
          dataPoints: 0,
        };
      }

      const totalImpressions = metrics.reduce((sum: number, m) => sum + m.impressions, 0);
      const totalConversions = metrics.reduce((sum: number, m) => sum + m.conversions, 0);
      const averageCtr = metrics.reduce((sum: number, m) => sum + m.ctr, 0) / metrics.length;
      const conversionRate = totalImpressions > 0 ? totalConversions / totalImpressions : 0;

      return {
        totalImpressions,
        averageCtr,
        totalConversions,
        conversionRate,
        dataPoints: metrics.length,
      };
    }),

  // Get metrics summary for multiple campaigns
  getSummary: publicProcedure
    .input(
      z.object({
        campaignIds: z.array(z.string()).optional(),
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // First, get campaign IDs if userId is provided
      let campaignIds = input.campaignIds;

      if (input.userId && !campaignIds) {
        const campaigns = await ctx.db.campaign.findMany({
          where: { userId: input.userId },
          select: { id: true },
        });
        campaignIds = campaigns.map(c => c.id);
      }

      if (!campaignIds || campaignIds.length === 0) {
        return [];
      }

      const where = {
        campaignId: { in: campaignIds },
        ...(input.startDate &&
          input.endDate && {
            timestamp: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      return ctx.db.campaignMetric.groupBy({
        by: ['campaignId'],
        where,
        _sum: {
          impressions: true,
          conversions: true,
        },
        _avg: {
          ctr: true,
        },
        _count: {
          id: true,
        },
      });
    }),

  // Delete metrics for a campaign
  deleteByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaignMetric.deleteMany({
        where: { campaignId: input.campaignId },
      });
    }),
});
