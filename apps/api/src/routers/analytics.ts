import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AgentMetricsAggregator } from "../../../../packages/core-agents/src/metrics/AgentMetricsAggregator";

const prisma = new PrismaClient();
const metricsAggregator = new AgentMetricsAggregator(prisma);

// Input schemas
const TimeframeSchema = z.enum(["1h", "6h", "24h", "7d", "30d", "90d"]);
const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

const MetricFiltersSchema = z.object({
  agentNames: z.array(z.string()).optional(),
  agentTypes: z.array(z.enum(["CONTENT", "SEO", "EMAIL_MARKETING", "SOCIAL_POSTING", "CUSTOMER_SUPPORT", "AD", "OUTREACH", "TREND", "INSIGHT", "DESIGN", "BRAND_VOICE", "SYSTEM"])).optional(),
  metricTypes: z.array(z.string()).optional(),
  campaignIds: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  platforms: z.array(z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "TWITTER", "LINKEDIN", "YOUTUBE", "PINTEREST", "GOOGLE"])).optional(),
  categories: z.array(z.string()).optional(),
  performance: z.array(z.enum(["excellent", "good", "average", "poor", "critical"])).optional(),
  aggregationLevel: z.enum(["individual", "campaign", "agent_type", "global"]).optional(),
});

// Output schemas
const MetricDataSchema = z.object({
  id: z.string(),
  agentName: z.string(),
  agentType: z.string(),
  campaignId: z.string().nullable(),
  executionId: z.string().nullable(),
  metricType: z.string(),
  metricSubtype: z.string().nullable(),
  category: z.string().nullable(),
  value: z.number(),
  previousValue: z.number().nullable(),
  target: z.number().nullable(),
  unit: z.string().nullable(),
  region: z.string().nullable(),
  platform: z.string().nullable(),
  language: z.string().nullable(),
  timeframe: z.string().nullable(),
  trend: z.enum(["increasing", "decreasing", "stable"]).nullable(),
  changePercent: z.number().nullable(),
  performance: z.enum(["excellent", "good", "average", "poor", "critical"]).nullable(),
  confidence: z.number().nullable(),
  source: z.enum(["direct", "calculated", "aggregated", "estimated"]),
  aggregationLevel: z.string(),
  batchId: z.string().nullable(),
  timestamp: z.date(),
  recordedAt: z.date(),
  metadata: z.any().nullable(),
  tags: z.array(z.string()),
});

const AnalyticsSummarySchema = z.object({
  overview: z.object({
    totalMetrics: z.number(),
    activeAgents: z.number(),
    averagePerformance: z.number(),
    totalCampaigns: z.number(),
    lastUpdated: z.date(),
  }),
  performance: z.object({
    excellentCount: z.number(),
    goodCount: z.number(),
    averageCount: z.number(),
    poorCount: z.number(),
    criticalCount: z.number(),
  }),
  trends: z.object({
    increasingCount: z.number(),
    decreasingCount: z.number(),
    stableCount: z.number(),
  }),
  topMetrics: z.array(z.object({
    metricType: z.string(),
    value: z.number(),
    trend: z.string().nullable(),
    changePercent: z.number().nullable(),
  })),
});

export const analyticsRouter = createTRPCRouter({
  // Get metrics with comprehensive filtering
  getMetrics: publicProcedure
    .input(z.object({
      timeframe: TimeframeSchema.default("24h"),
      filters: MetricFiltersSchema.optional(),
      limit: z.number().min(1).max(1000).default(100),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(["timestamp", "value", "performance", "agentName", "metricType"]).default("timestamp"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .output(z.object({
      success: z.boolean(),
      data: z.array(MetricDataSchema),
      pagination: z.object({
        total: z.number(),
        offset: z.number(),
        limit: z.number(),
        hasMore: z.boolean(),
      }),
      summary: AnalyticsSummarySchema,
    }))
    .query(async ({ input }) => {
      try {
        const { timeframe, filters, limit, offset, sortBy, sortOrder } = input;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeframe.endsWith('h')) {
          const hours = parseInt(timeframe.replace('h', ''));
          startDate.setHours(startDate.getHours() - hours);
        } else if (timeframe.endsWith('d')) {
          const days = parseInt(timeframe.replace('d', ''));
          startDate.setDate(startDate.getDate() - days);
        }

        // Build where clause
        const whereClause: any = {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        };

        if (filters) {
          if (filters.agentNames?.length) {
            whereClause.agentName = { in: filters.agentNames };
          }
          if (filters.agentTypes?.length) {
            whereClause.agentType = { in: filters.agentTypes };
          }
          if (filters.metricTypes?.length) {
            whereClause.metricType = { in: filters.metricTypes };
          }
          if (filters.campaignIds?.length) {
            whereClause.campaignId = { in: filters.campaignIds };
          }
          if (filters.regions?.length) {
            whereClause.region = { in: filters.regions };
          }
          if (filters.platforms?.length) {
            whereClause.platform = { in: filters.platforms };
          }
          if (filters.categories?.length) {
            whereClause.category = { in: filters.categories };
          }
          if (filters.performance?.length) {
            whereClause.performance = { in: filters.performance };
          }
          if (filters.aggregationLevel) {
            whereClause.aggregationLevel = filters.aggregationLevel;
          }
        }

        // Get total count
        const total = await prisma.agentMetric.count({ where: whereClause });

        // Get metrics with pagination
        const metrics = await prisma.agentMetric.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
          include: {
            campaign: {
              select: { id: true, name: true },
            },
          },
        });

        // Generate summary
        const summary = await generateMetricsSummary(whereClause);

        return {
          success: true,
          data: metrics,
          pagination: {
            total,
            offset,
            limit,
            hasMore: offset + limit < total,
          },
          summary,
        };

      } catch (error) {
        console.error("Failed to get metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve metrics",
        });
      }
    }),

  // Get agent comparison data
  getAgentComparison: publicProcedure
    .input(z.object({
      agents: z.array(z.string()),
      metricTypes: z.array(z.string()).optional(),
      dateRange: DateRangeSchema.optional(),
      timeframe: TimeframeSchema.default("7d"),
      groupBy: z.enum(["hour", "day", "week"]).default("day"),
    }))
    .output(z.object({
      success: z.boolean(),
      data: z.array(z.object({
        agentName: z.string(),
        agentType: z.string(),
        metrics: z.array(z.object({
          metricType: z.string(),
          values: z.array(z.object({
            timestamp: z.date(),
            value: z.number(),
            trend: z.string().nullable(),
            performance: z.string().nullable(),
          })),
          average: z.number(),
          total: z.number(),
          change: z.number().nullable(),
        })),
        summary: z.object({
          totalMetrics: z.number(),
          averagePerformance: z.number(),
          bestMetric: z.string().nullable(),
          worstMetric: z.string().nullable(),
        }),
      })),
    }))
    .query(async ({ input }) => {
      try {
        const { agents, metricTypes, dateRange, timeframe, groupBy } = input;
        
        // Calculate date range if not provided
        let startDate: Date, endDate: Date;
        if (dateRange) {
          startDate = dateRange.start;
          endDate = dateRange.end;
        } else {
          endDate = new Date();
          startDate = new Date();
          if (timeframe.endsWith('h')) {
            const hours = parseInt(timeframe.replace('h', ''));
            startDate.setHours(startDate.getHours() - hours);
          } else if (timeframe.endsWith('d')) {
            const days = parseInt(timeframe.replace('d', ''));
            startDate.setDate(startDate.getDate() - days);
          }
        }

        const comparisonData = [];

        for (const agentName of agents) {
          const whereClause: any = {
            agentName,
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          };

          if (metricTypes?.length) {
            whereClause.metricType = { in: metricTypes };
          }

          // Get agent info
          const agentMetrics = await prisma.agentMetric.findMany({
            where: whereClause,
            orderBy: { timestamp: 'asc' },
          });

          if (agentMetrics.length === 0) continue;

          // Group metrics by type
          const metricsByType = agentMetrics.reduce((acc: any, metric) => {
            if (!acc[metric.metricType]) {
              acc[metric.metricType] = [];
            }
            acc[metric.metricType].push(metric);
            return acc;
          }, {});

          // Process each metric type
          const processedMetrics = Object.entries(metricsByType).map(([metricType, metrics]: [string, any[]]) => {
            const values = metrics.map(m => ({
              timestamp: m.timestamp,
              value: m.value,
              trend: m.trend,
              performance: m.performance,
            }));

            const totalValue = metrics.reduce((sum, m) => sum + m.value, 0);
            const averageValue = totalValue / metrics.length;
            
            // Calculate change from first to last
            const firstValue = metrics[0]?.value || 0;
            const lastValue = metrics[metrics.length - 1]?.value || 0;
            const change = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

            return {
              metricType,
              values,
              average: averageValue,
              total: totalValue,
              change,
            };
          });

          // Generate summary
          const totalMetrics = agentMetrics.length;
          const performanceScores = agentMetrics
            .filter(m => m.performance)
            .map(m => {
              switch (m.performance) {
                case 'excellent': return 5;
                case 'good': return 4;
                case 'average': return 3;
                case 'poor': return 2;
                case 'critical': return 1;
                default: return 3;
              }
            });
          
          const averagePerformance = performanceScores.length > 0 
            ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
            : 3;

          const bestMetric = processedMetrics.reduce((best, current) => 
            (current.average > (best?.average || 0)) ? current : best, null)?.metricType || null;
          
          const worstMetric = processedMetrics.reduce((worst, current) => 
            (current.average < (worst?.average || Infinity)) ? current : worst, null)?.metricType || null;

          comparisonData.push({
            agentName,
            agentType: agentMetrics[0].agentType,
            metrics: processedMetrics,
            summary: {
              totalMetrics,
              averagePerformance,
              bestMetric,
              worstMetric,
            },
          });
        }

        return {
          success: true,
          data: comparisonData,
        };

      } catch (error) {
        console.error("Failed to get agent comparison:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve agent comparison data",
        });
      }
    }),

  // Get campaign insights
  getCampaignInsights: publicProcedure
    .input(z.object({
      campaignId: z.string(),
      timeframe: TimeframeSchema.default("30d"),
      includeAgentBreakdown: z.boolean().default(true),
      includePerformanceTrends: z.boolean().default(true),
    }))
    .output(z.object({
      success: z.boolean(),
      data: z.object({
        campaignId: z.string(),
        campaignName: z.string().nullable(),
        overview: z.object({
          totalMetrics: z.number(),
          activeAgents: z.number(),
          averagePerformance: z.number(),
          bestPerformingAgent: z.string().nullable(),
          worstPerformingAgent: z.string().nullable(),
          timeframe: z.string(),
        }),
        agentBreakdown: z.array(z.object({
          agentName: z.string(),
          agentType: z.string(),
          metricCount: z.number(),
          averagePerformance: z.number(),
          topMetrics: z.array(z.object({
            metricType: z.string(),
            value: z.number(),
            unit: z.string().nullable(),
            trend: z.string().nullable(),
          })),
        })).optional(),
        performanceTrends: z.array(z.object({
          date: z.date(),
          overallPerformance: z.number(),
          metricBreakdown: z.object({
            reach: z.number().nullable(),
            engagement: z.number().nullable(),
            conversions: z.number().nullable(),
            roi: z.number().nullable(),
            sentiment: z.number().nullable(),
          }),
        })).optional(),
        recommendations: z.array(z.object({
          type: z.string(),
          priority: z.enum(["low", "medium", "high", "critical"]),
          message: z.string(),
          agentName: z.string().nullable(),
          metricType: z.string().nullable(),
        })),
      }),
    }))
    .query(async ({ input }) => {
      try {
        const { campaignId, timeframe, includeAgentBreakdown, includePerformanceTrends } = input;
        
        // Get campaign info
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, name: true },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        if (timeframe.endsWith('h')) {
          const hours = parseInt(timeframe.replace('h', ''));
          startDate.setHours(startDate.getHours() - hours);
        } else if (timeframe.endsWith('d')) {
          const days = parseInt(timeframe.replace('d', ''));
          startDate.setDate(startDate.getDate() - days);
        }

        // Get campaign metrics
        const campaignMetrics = await prisma.agentMetric.findMany({
          where: {
            campaignId,
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { timestamp: 'asc' },
        });

        // Generate overview
        const activeAgents = new Set(campaignMetrics.map(m => m.agentName)).size;
        const performanceScores = campaignMetrics
          .filter(m => m.performance)
          .map(m => {
            switch (m.performance) {
              case 'excellent': return 5;
              case 'good': return 4;
              case 'average': return 3;
              case 'poor': return 2;
              case 'critical': return 1;
              default: return 3;
            }
          });
        
        const averagePerformance = performanceScores.length > 0 
          ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
          : 3;

        // Find best and worst performing agents
        const agentPerformance = campaignMetrics.reduce((acc: any, metric) => {
          if (!acc[metric.agentName]) {
            acc[metric.agentName] = { scores: [], name: metric.agentName };
          }
          if (metric.performance) {
            const score = {
              'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'critical': 1
            }[metric.performance] || 3;
            acc[metric.agentName].scores.push(score);
          }
          return acc;
        }, {});

        const agentAverages = Object.values(agentPerformance).map((agent: any) => ({
          name: agent.name,
          average: agent.scores.length > 0 
            ? agent.scores.reduce((sum: number, score: number) => sum + score, 0) / agent.scores.length
            : 3,
        }));

        const bestPerformingAgent = agentAverages.reduce((best, current) => 
          current.average > best.average ? current : best, { name: null, average: 0 }).name;
        
        const worstPerformingAgent = agentAverages.reduce((worst, current) => 
          current.average < worst.average ? current : worst, { name: null, average: 5 }).name;

        const overview = {
          totalMetrics: campaignMetrics.length,
          activeAgents,
          averagePerformance,
          bestPerformingAgent,
          worstPerformingAgent,
          timeframe,
        };

        // Generate agent breakdown if requested
        let agentBreakdown;
        if (includeAgentBreakdown) {
          const agentMetrics = campaignMetrics.reduce((acc: any, metric) => {
            if (!acc[metric.agentName]) {
              acc[metric.agentName] = {
                agentName: metric.agentName,
                agentType: metric.agentType,
                metrics: [],
              };
            }
            acc[metric.agentName].metrics.push(metric);
            return acc;
          }, {});

          agentBreakdown = Object.values(agentMetrics).map((agent: any) => {
            const metricsByType = agent.metrics.reduce((acc: any, metric: any) => {
              if (!acc[metric.metricType]) {
                acc[metric.metricType] = [];
              }
              acc[metric.metricType].push(metric);
              return acc;
            }, {});

            const topMetrics = Object.entries(metricsByType)
              .map(([metricType, metrics]: [string, any[]]) => ({
                metricType,
                value: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
                unit: metrics[0]?.unit || null,
                trend: metrics[metrics.length - 1]?.trend || null,
              }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);

            const performanceScores = agent.metrics
              .filter((m: any) => m.performance)
              .map((m: any) => ({
                'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'critical': 1
              }[m.performance] || 3));

            const averagePerformance = performanceScores.length > 0
              ? performanceScores.reduce((sum: number, score: number) => sum + score, 0) / performanceScores.length
              : 3;

            return {
              agentName: agent.agentName,
              agentType: agent.agentType,
              metricCount: agent.metrics.length,
              averagePerformance,
              topMetrics,
            };
          });
        }

        // Generate performance trends if requested
        let performanceTrends;
        if (includePerformanceTrends) {
          // Group metrics by day
          const metricsByDay = campaignMetrics.reduce((acc: any, metric) => {
            const day = metric.timestamp.toISOString().split('T')[0];
            if (!acc[day]) {
              acc[day] = {
                date: new Date(day),
                metrics: [],
              };
            }
            acc[day].metrics.push(metric);
            return acc;
          }, {});

          performanceTrends = Object.values(metricsByDay).map((day: any) => {
            const dayMetrics = day.metrics;
            
            // Calculate overall performance
            const performanceScores = dayMetrics
              .filter((m: any) => m.performance)
              .map((m: any) => ({
                'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'critical': 1
              }[m.performance] || 3));

            const overallPerformance = performanceScores.length > 0
              ? performanceScores.reduce((sum: number, score: number) => sum + score, 0) / performanceScores.length
              : 3;

            // Break down by metric type
            const metricBreakdown = {
              reach: getAverageForMetricType(dayMetrics, 'reach'),
              engagement: getAverageForMetricType(dayMetrics, 'engagement'),
              conversions: getAverageForMetricType(dayMetrics, 'conversions'),
              roi: getAverageForMetricType(dayMetrics, 'roi'),
              sentiment: getAverageForMetricType(dayMetrics, 'sentiment'),
            };

            return {
              date: day.date,
              overallPerformance,
              metricBreakdown,
            };
          }).sort((a, b) => a.date.getTime() - b.date.getTime());
        }

        // Generate recommendations
        const recommendations = generateCampaignRecommendations(campaignMetrics, overview);

        return {
          success: true,
          data: {
            campaignId,
            campaignName: campaign.name,
            overview,
            agentBreakdown,
            performanceTrends,
            recommendations,
          },
        };

      } catch (error) {
        console.error("Failed to get campaign insights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve campaign insights",
        });
      }
    }),

  // Trigger metrics aggregation
  triggerAggregation: publicProcedure
    .input(z.object({
      timeframe: z.string().default("1h"),
      force: z.boolean().default(false),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
      batchId: z.string().optional(),
      processed: z.number().optional(),
      errors: z.number().optional(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { timeframe, force } = input;
        
        const result = await metricsAggregator.aggregateMetrics(timeframe);
        
        return {
          success: result.success,
          message: result.success 
            ? `Successfully processed ${result.processed} metrics` 
            : `Aggregation completed with ${result.errors} errors`,
          batchId: result.batchId,
          processed: result.processed,
          errors: result.errors,
          duration: result.duration,
        };

      } catch (error) {
        console.error("Failed to trigger aggregation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger metrics aggregation",
        });
      }
    }),

  // Get analytics dashboard summary
  getDashboardSummary: publicProcedure
    .input(z.object({
      timeframe: TimeframeSchema.default("24h"),
    }))
    .output(z.object({
      success: z.boolean(),
      data: z.object({
        overview: z.object({
          totalMetrics: z.number(),
          activeAgents: z.number(),
          activeCampaigns: z.number(),
          averagePerformance: z.number(),
          lastUpdated: z.date(),
        }),
        topPerformers: z.object({
          agents: z.array(z.object({
            name: z.string(),
            type: z.string(),
            performance: z.number(),
            change: z.number().nullable(),
          })),
          campaigns: z.array(z.object({
            id: z.string(),
            name: z.string(),
            performance: z.number(),
            metricsCount: z.number(),
          })),
          metrics: z.array(z.object({
            type: z.string(),
            value: z.number(),
            unit: z.string().nullable(),
            trend: z.string().nullable(),
          })),
        }),
        alerts: z.array(z.object({
          type: z.string(),
          severity: z.enum(["info", "warning", "error"]),
          message: z.string(),
          agentName: z.string().nullable(),
          metricType: z.string().nullable(),
          timestamp: z.date(),
        })),
      }),
    }))
    .query(async ({ input }) => {
      try {
        const { timeframe } = input;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        if (timeframe.endsWith('h')) {
          const hours = parseInt(timeframe.replace('h', ''));
          startDate.setHours(startDate.getHours() - hours);
        } else if (timeframe.endsWith('d')) {
          const days = parseInt(timeframe.replace('d', ''));
          startDate.setDate(startDate.getDate() - days);
        }

        // Get all metrics for the timeframe
        const metrics = await prisma.agentMetric.findMany({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            campaign: {
              select: { id: true, name: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        });

        // Generate overview
        const activeAgents = new Set(metrics.map(m => m.agentName)).size;
        const activeCampaigns = new Set(metrics.filter(m => m.campaignId).map(m => m.campaignId)).size;
        
        const performanceScores = metrics
          .filter(m => m.performance)
          .map(m => ({
            'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'critical': 1
          }[m.performance!] || 3));
        
        const averagePerformance = performanceScores.length > 0
          ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
          : 3;

        const overview = {
          totalMetrics: metrics.length,
          activeAgents,
          activeCampaigns,
          averagePerformance,
          lastUpdated: metrics[0]?.timestamp || new Date(),
        };

        // Generate top performers
        const topPerformers = generateTopPerformers(metrics);

        // Generate alerts
        const alerts = generateAlerts(metrics);

        return {
          success: true,
          data: {
            overview,
            topPerformers,
            alerts,
          },
        };

      } catch (error) {
        console.error("Failed to get dashboard summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve dashboard summary",
        });
      }
    }),
});

// Helper functions
async function generateMetricsSummary(whereClause: any) {
  const overview = await prisma.agentMetric.aggregate({
    where: whereClause,
    _count: { id: true },
    _avg: { value: true },
  });

  const performanceCounts = await prisma.agentMetric.groupBy({
    by: ['performance'],
    where: whereClause,
    _count: { performance: true },
  });

  const trendCounts = await prisma.agentMetric.groupBy({
    by: ['trend'],
    where: whereClause,
    _count: { trend: true },
  });

  const topMetrics = await prisma.agentMetric.groupBy({
    by: ['metricType'],
    where: whereClause,
    _avg: { value: true },
    _count: { metricType: true },
    orderBy: { _avg: { value: 'desc' } },
    take: 5,
  });

  const activeAgents = await prisma.agentMetric.groupBy({
    by: ['agentName'],
    where: whereClause,
    _count: { agentName: true },
  });

  const totalCampaigns = await prisma.agentMetric.groupBy({
    by: ['campaignId'],
    where: { ...whereClause, campaignId: { not: null } },
    _count: { campaignId: true },
  });

  // Build performance object
  const performance = {
    excellentCount: 0,
    goodCount: 0,
    averageCount: 0,
    poorCount: 0,
    criticalCount: 0,
  };

  performanceCounts.forEach(p => {
    if (p.performance) {
      const key = `${p.performance.toLowerCase()}Count` as keyof typeof performance;
      performance[key] = p._count.performance;
    }
  });

  // Build trends object
  const trends = {
    increasingCount: 0,
    decreasingCount: 0,
    stableCount: 0,
  };

  trendCounts.forEach(t => {
    if (t.trend) {
      const key = `${t.trend.toLowerCase()}Count` as keyof typeof trends;
      trends[key] = t._count.trend;
    }
  });

  return {
    overview: {
      totalMetrics: overview._count.id,
      activeAgents: activeAgents.length,
      averagePerformance: overview._avg.value || 0,
      totalCampaigns: totalCampaigns.length,
      lastUpdated: new Date(),
    },
    performance,
    trends,
    topMetrics: topMetrics.map(m => ({
      metricType: m.metricType,
      value: m._avg.value || 0,
      trend: null,
      changePercent: null,
    })),
  };
}

function getAverageForMetricType(metrics: any[], metricType: string): number | null {
  const filteredMetrics = metrics.filter(m => m.metricType === metricType);
  if (filteredMetrics.length === 0) return null;
  
  return filteredMetrics.reduce((sum, m) => sum + m.value, 0) / filteredMetrics.length;
}

function generateCampaignRecommendations(metrics: any[], overview: any) {
  const recommendations = [];

  // Check for poor performance
  if (overview.averagePerformance < 2.5) {
    recommendations.push({
      type: "performance",
      priority: "high" as const,
      message: "Campaign performance is below average. Consider reviewing agent configurations and optimization strategies.",
      agentName: null,
      metricType: null,
    });
  }

  // Check for declining trends
  const decliningMetrics = metrics.filter(m => m.trend === 'decreasing');
  if (decliningMetrics.length > metrics.length * 0.3) {
    recommendations.push({
      type: "trend",
      priority: "medium" as const,
      message: "Multiple metrics are showing declining trends. Review recent campaign changes and market conditions.",
      agentName: null,
      metricType: null,
    });
  }

  // Check for low engagement
  const engagementMetrics = metrics.filter(m => m.metricType === 'engagement');
  const lowEngagement = engagementMetrics.filter(m => m.performance === 'poor' || m.performance === 'critical');
  if (lowEngagement.length > 0) {
    recommendations.push({
      type: "engagement",
      priority: "medium" as const,
      message: "Engagement metrics are underperforming. Consider content optimization and audience targeting improvements.",
      agentName: null,
      metricType: "engagement",
    });
  }

  return recommendations;
}

function generateTopPerformers(metrics: any[]) {
  // Top performing agents
  const agentPerformance = metrics.reduce((acc: any, metric) => {
    if (!acc[metric.agentName]) {
      acc[metric.agentName] = {
        name: metric.agentName,
        type: metric.agentType,
        scores: [],
        values: [],
      };
    }
    if (metric.performance) {
      const score = {
        'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'critical': 1
      }[metric.performance] || 3;
      acc[metric.agentName].scores.push(score);
    }
    acc[metric.agentName].values.push(metric.value);
    return acc;
  }, {});

  const topAgents = Object.values(agentPerformance)
    .map((agent: any) => ({
      name: agent.name,
      type: agent.type,
      performance: agent.scores.length > 0 
        ? agent.scores.reduce((sum: number, score: number) => sum + score, 0) / agent.scores.length
        : 3,
      change: null, // Could calculate from historical data
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5);

  // Top performing campaigns
  const campaignPerformance = metrics
    .filter(m => m.campaign)
    .reduce((acc: any, metric) => {
      const campaignId = metric.campaignId;
      if (!acc[campaignId]) {
        acc[campaignId] = {
          id: campaignId,
          name: metric.campaign?.name || `Campaign ${campaignId}`,
          scores: [],
          count: 0,
        };
      }
      if (metric.performance) {
        const score = {
          'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'critical': 1
        }[metric.performance] || 3;
        acc[campaignId].scores.push(score);
      }
      acc[campaignId].count++;
      return acc;
    }, {});

  const topCampaigns = Object.values(campaignPerformance)
    .map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      performance: campaign.scores.length > 0 
        ? campaign.scores.reduce((sum: number, score: number) => sum + score, 0) / campaign.scores.length
        : 3,
      metricsCount: campaign.count,
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5);

  // Top metrics by value
  const metricsByType = metrics.reduce((acc: any, metric) => {
    if (!acc[metric.metricType]) {
      acc[metric.metricType] = {
        type: metric.metricType,
        values: [],
        units: [],
        trends: [],
      };
    }
    acc[metric.metricType].values.push(metric.value);
    if (metric.unit) acc[metric.metricType].units.push(metric.unit);
    if (metric.trend) acc[metric.metricType].trends.push(metric.trend);
    return acc;
  }, {});

  const topMetrics = Object.values(metricsByType)
    .map((metric: any) => ({
      type: metric.type,
      value: metric.values.reduce((sum: number, val: number) => sum + val, 0) / metric.values.length,
      unit: metric.units[0] || null,
      trend: metric.trends[metric.trends.length - 1] || null,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    agents: topAgents,
    campaigns: topCampaigns,
    metrics: topMetrics,
  };
}

function generateAlerts(metrics: any[]) {
  const alerts = [];

  // Check for critical performance issues
  const criticalMetrics = metrics.filter(m => m.performance === 'critical');
  if (criticalMetrics.length > 0) {
    alerts.push({
      type: "performance",
      severity: "error" as const,
      message: `${criticalMetrics.length} metrics showing critical performance`,
      agentName: criticalMetrics[0].agentName,
      metricType: criticalMetrics[0].metricType,
      timestamp: criticalMetrics[0].timestamp,
    });
  }

  // Check for declining trends
  const decliningMetrics = metrics.filter(m => m.trend === 'decreasing');
  if (decliningMetrics.length > metrics.length * 0.4) {
    alerts.push({
      type: "trend",
      severity: "warning" as const,
      message: "Multiple metrics showing declining trends",
      agentName: null,
      metricType: null,
      timestamp: new Date(),
    });
  }

  // Check for low confidence
  const lowConfidenceMetrics = metrics.filter(m => m.confidence !== null && m.confidence < 0.5);
  if (lowConfidenceMetrics.length > 0) {
    alerts.push({
      type: "confidence",
      severity: "warning" as const,
      message: `${lowConfidenceMetrics.length} metrics with low confidence levels`,
      agentName: null,
      metricType: null,
      timestamp: new Date(),
    });
  }

  return alerts.slice(0, 10); // Limit to 10 most recent alerts
} 