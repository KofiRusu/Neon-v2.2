import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaClient } from "@prisma/client";
import { TrendAgent } from "../../../../packages/core-agents/src/agents/trend-agent";

const prisma = new PrismaClient();

// Enhanced Trend schemas
const TrendSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "TWITTER", "LINKEDIN", "YOUTUBE", "PINTEREST", "GOOGLE"]),
  category: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  viralityScore: z.number(),
  relevanceScore: z.number(),
  opportunityScore: z.number(),
  overallScore: z.number(),
  volume: z.number().nullable(),
  growth: z.number().nullable(),
  engagement: z.number().nullable(),
  shares: z.number().nullable(),
  likes: z.number().nullable(),
  comments: z.number().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  language: z.string().nullable(),
  ageGroup: z.string().nullable(),
  gender: z.string().nullable(),
  tags: z.array(z.string()),
  sourceUrl: z.string().nullable(),
  influencers: z.any().nullable(),
  relatedKeywords: z.any().nullable(),
  aiExplanation: z.string().nullable(),
  campaignRelevance: z.any().nullable(),
  contentSuggestions: z.any().nullable(),
  status: z.string(),
  peakDate: z.date().nullable(),
  expiresAt: z.date().nullable(),
  data: z.any(),
  metadata: z.any().nullable(),
  detectedAt: z.date(),
  updatedAt: z.date(),
});

const TrendScoreSchema = z.object({
  id: z.string(),
  trendId: z.string(),
  viralityScore: z.number(),
  relevanceScore: z.number(),
  opportunityScore: z.number(),
  overallScore: z.number(),
  volume: z.number(),
  engagement: z.number(),
  growth: z.number(),
  momentum: z.number(),
  scoreChange: z.number(),
  volumeChange: z.number(),
  ranking: z.number().nullable(),
  predictedGrowth: z.number().nullable(),
  confidenceLevel: z.number().nullable(),
  date: z.date(),
  hour: z.number().nullable(),
  region: z.string().nullable(),
});

const TrendAnalysisRequestSchema = z.object({
  keywords: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  region: z.string().optional(),
  timeframe: z.string().optional(),
  includeAI: z.boolean().optional().default(true),
});

const TrendFilterSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "TWITTER", "LINKEDIN", "YOUTUBE", "PINTEREST", "GOOGLE", "ALL"]).optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["overallScore", "viralityScore", "relevanceScore", "opportunityScore", "growth", "volume", "detectedAt"]).optional().default("overallScore"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

const TrendForecastSchema = z.object({
  trendId: z.string(),
  timeframe: z.enum(["1d", "7d", "30d", "90d"]).optional().default("7d"),
  includeConfidence: z.boolean().optional().default(true),
});

// Initialize TrendAgent
const trendAgent = new TrendAgent("trend-agent-api", "TrendAgent API");

export const trendRouter = createTRPCRouter({
  // Get trending topics with advanced filtering
  getTrends: publicProcedure
    .input(TrendFilterSchema)
    .query(async ({ input }) => {
      try {
        const where: any = {};
        
        // Apply filters
        if (input.platform && input.platform !== "ALL") {
          where.platform = input.platform;
        }
        if (input.region) {
          where.region = input.region;
        }
        if (input.category) {
          where.category = input.category;
        }
        if (input.status) {
          where.status = input.status;
        }

        const trends = await prisma.trend.findMany({
          where,
          include: {
            trendScores: {
              take: 1,
              orderBy: { date: "desc" },
            },
          },
          orderBy: {
            [input.sortBy]: input.order,
          },
          take: input.limit,
          skip: input.offset,
        });

        const totalCount = await prisma.trend.count({ where });

        return {
          success: true,
          data: trends,
          pagination: {
            total: totalCount,
            limit: input.limit,
            offset: input.offset,
            hasMore: totalCount > input.offset + input.limit,
          },
          filters: input,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch trends: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Analyze new trends using TrendAgent
  analyzeTrends: publicProcedure
    .input(TrendAnalysisRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await trendAgent.execute({
          task: "analyze_trends",
          context: input,
        });

        return {
          success: true,
          data: result,
          message: "Trend analysis completed successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to analyze trends: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Get detailed trend information with historical data
  getTrendDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const trend = await prisma.trend.findUnique({
          where: { id: input.id },
          include: {
            trendScores: {
              orderBy: { date: "desc" },
              take: 30, // Last 30 days
            },
          },
        });

        if (!trend) {
          throw new Error(`Trend with id ${input.id} not found`);
        }

        // Calculate trend statistics
        const scores = trend.trendScores;
        const latestScore = scores[0];
        const previousScore = scores[1];
        
        const scoreChange = previousScore 
          ? latestScore.overallScore - previousScore.overallScore 
          : 0;
        const volumeChange = previousScore 
          ? ((latestScore.volume - previousScore.volume) / previousScore.volume) * 100 
          : 0;

        return {
          success: true,
          data: {
            ...trend,
            statistics: {
              scoreChange,
              volumeChange,
              averageScore: scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length,
              peakScore: Math.max(...scores.map(s => s.overallScore)),
              currentMomentum: latestScore?.momentum || 0,
            },
            historicalData: scores.map(score => ({
              date: score.date,
              overallScore: score.overallScore,
              viralityScore: score.viralityScore,
              relevanceScore: score.relevanceScore,
              opportunityScore: score.opportunityScore,
              volume: score.volume,
              growth: score.growth,
              momentum: score.momentum,
            })),
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch trend details: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Get trend forecasting
  getTrendForecast: publicProcedure
    .input(TrendForecastSchema)
    .query(async ({ input }) => {
      try {
        const trend = await prisma.trend.findUnique({
          where: { id: input.trendId },
          include: {
            trendScores: {
              orderBy: { date: "desc" },
              take: 30,
            },
          },
        });

        if (!trend) {
          throw new Error(`Trend with id ${input.trendId} not found`);
        }

        // Generate forecast using TrendAgent
        const forecastResult = await trendAgent.execute({
          task: "trend_forecasting",
          context: {
            trendId: input.trendId,
            timeframe: input.timeframe,
            includeConfidence: input.includeConfidence,
            historicalData: trend.trendScores,
          },
        });

        // Calculate forecast based on historical data
        const scores = trend.trendScores;
        const recentTrend = scores.slice(0, 7); // Last 7 days
        const averageGrowth = recentTrend.reduce((sum, s) => sum + s.growth, 0) / recentTrend.length;

        const forecast = {
          trendId: input.trendId,
          timeframe: input.timeframe,
          currentScore: scores[0]?.overallScore || 0,
          predictedScore: Math.max(0, Math.min(100, scores[0]?.overallScore + averageGrowth * 7)),
          confidence: Math.max(0.3, 1 - (Math.abs(averageGrowth) / 100)),
          trend: averageGrowth > 5 ? "increasing" : averageGrowth < -5 ? "decreasing" : "stable",
          factors: [
            `Recent growth rate: ${averageGrowth.toFixed(1)}%`,
            `Current momentum: ${scores[0]?.momentum?.toFixed(2) || 0}`,
            `Volume trend: ${trend.volume ? trend.volume.toLocaleString() : "N/A"}`,
          ],
          recommendations: [
            averageGrowth > 10 ? "Capitalize on upward trend immediately" : "Monitor trend closely",
            "Consider cross-platform content strategy",
            "Prepare contingency content for trend decline",
          ],
        };

        return {
          success: true,
          data: forecast,
          agentResult: forecastResult,
        };
      } catch (error) {
        throw new Error(
          `Failed to generate trend forecast: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Get top trending keywords
  getTopTrendingKeywords: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
      platform: z.string().optional(),
      region: z.string().optional(),
      timeframe: z.enum(["24h", "7d", "30d"]).optional().default("7d"),
    }))
    .query(async ({ input }) => {
      try {
        const where: any = {
          status: "active",
        };

        if (input.platform && input.platform !== "ALL") {
          where.platform = input.platform;
        }
        if (input.region) {
          where.region = input.region;
        }

        // Date filter based on timeframe
        const now = new Date();
        let dateFilter;
        switch (input.timeframe) {
          case "24h":
            dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "7d":
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }

        if (dateFilter) {
          where.detectedAt = { gte: dateFilter };
        }

        const trends = await prisma.trend.findMany({
          where,
          orderBy: { overallScore: "desc" },
          take: input.limit,
          select: {
            id: true,
            keyword: true,
            platform: true,
            overallScore: true,
            viralityScore: true,
            volume: true,
            growth: true,
            region: true,
            detectedAt: true,
          },
        });

        return {
          success: true,
          data: trends,
          timeframe: input.timeframe,
          generatedAt: new Date(),
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch top trending keywords: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Get platform comparison
  getPlatformComparison: publicProcedure
    .input(z.object({
      keywords: z.array(z.string()).optional(),
      region: z.string().optional(),
      timeframe: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
    }))
    .query(async ({ input }) => {
      try {
        const where: any = {
          status: "active",
        };

        if (input.keywords && input.keywords.length > 0) {
          where.keyword = { in: input.keywords };
        }
        if (input.region) {
          where.region = input.region;
        }

        const trends = await prisma.trend.findMany({
          where,
          select: {
            platform: true,
            overallScore: true,
            viralityScore: true,
            relevanceScore: true,
            opportunityScore: true,
            volume: true,
            engagement: true,
            growth: true,
          },
        });

        // Group by platform and calculate averages
        const platformStats = trends.reduce((acc, trend) => {
          if (!acc[trend.platform]) {
            acc[trend.platform] = {
              platform: trend.platform,
              count: 0,
              totalScore: 0,
              totalViralityScore: 0,
              totalRelevanceScore: 0,
              totalOpportunityScore: 0,
              totalVolume: 0,
              totalEngagement: 0,
              totalGrowth: 0,
            };
          }
          
          acc[trend.platform].count++;
          acc[trend.platform].totalScore += trend.overallScore;
          acc[trend.platform].totalViralityScore += trend.viralityScore;
          acc[trend.platform].totalRelevanceScore += trend.relevanceScore;
          acc[trend.platform].totalOpportunityScore += trend.opportunityScore;
          acc[trend.platform].totalVolume += trend.volume || 0;
          acc[trend.platform].totalEngagement += trend.engagement || 0;
          acc[trend.platform].totalGrowth += trend.growth || 0;
          
          return acc;
        }, {} as Record<string, any>);

        // Calculate averages
        const comparison = Object.values(platformStats).map((stats: any) => ({
          platform: stats.platform,
          trendCount: stats.count,
          averageScore: stats.totalScore / stats.count,
          averageViralityScore: stats.totalViralityScore / stats.count,
          averageRelevanceScore: stats.totalRelevanceScore / stats.count,
          averageOpportunityScore: stats.totalOpportunityScore / stats.count,
          averageVolume: stats.totalVolume / stats.count,
          averageEngagement: stats.totalEngagement / stats.count,
          averageGrowth: stats.totalGrowth / stats.count,
        }));

        // Sort by average score
        comparison.sort((a, b) => b.averageScore - a.averageScore);

        return {
          success: true,
          data: comparison,
          totalTrends: trends.length,
          timeframe: input.timeframe,
        };
      } catch (error) {
        throw new Error(
          `Failed to generate platform comparison: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Detect trend opportunities
  detectOpportunities: publicProcedure
    .input(z.object({
      campaignIds: z.array(z.string()).optional(),
      industry: z.string().optional(),
      targetAudience: z.string().optional(),
      minScore: z.number().optional().default(70),
      maxRisk: z.enum(["low", "medium", "high"]).optional().default("medium"),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await trendAgent.execute({
          task: "detect_trend_opportunities",
          context: input,
        });

        // Find high-opportunity trends from database
        const opportunities = await prisma.trend.findMany({
          where: {
            opportunityScore: { gte: input.minScore },
            status: "active",
          },
          include: {
            trendScores: {
              take: 1,
              orderBy: { date: "desc" },
            },
          },
          orderBy: { opportunityScore: "desc" },
          take: 20,
        });

        return {
          success: true,
          data: opportunities,
          agentResult: result,
          filters: input,
          opportunityCount: opportunities.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to detect trend opportunities: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Save trend snapshot
  saveTrendSnapshot: publicProcedure
    .input(z.object({
      trendId: z.string().optional(),
      region: z.string().optional().default("global"),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await trendAgent.execute({
          task: "save_trend_snapshots",
          context: input,
        });

        return {
          success: true,
          data: result,
          message: "Trend snapshot saved successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to save trend snapshot: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Get trend analytics dashboard data
  getTrendAnalytics: publicProcedure
    .input(z.object({
      timeframe: z.enum(["24h", "7d", "30d", "90d"]).optional().default("30d"),
      region: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        // Date filter
        const now = new Date();
        let dateFilter;
        switch (input.timeframe) {
          case "24h":
            dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "7d":
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }

        const where: any = {};
        if (dateFilter) {
          where.detectedAt = { gte: dateFilter };
        }
        if (input.region) {
          where.region = input.region;
        }

        // Get trend statistics
        const totalTrends = await prisma.trend.count({ where });
        const activeTrends = await prisma.trend.count({ 
          where: { ...where, status: "active" } 
        });
        const avgScore = await prisma.trend.aggregate({
          where,
          _avg: { overallScore: true },
        });

        // Get top categories
        const categoryStats = await prisma.trend.groupBy({
          by: ["category"],
          where,
          _count: { category: true },
          _avg: { overallScore: true },
          orderBy: { _count: { category: "desc" } },
          take: 10,
        });

        // Get platform distribution
        const platformStats = await prisma.trend.groupBy({
          by: ["platform"],
          where,
          _count: { platform: true },
          _avg: { overallScore: true },
          orderBy: { _count: { platform: "desc" } },
        });

        // Get recent high-growth trends
        const highGrowthTrends = await prisma.trend.findMany({
          where: {
            ...where,
            growth: { gt: 20 },
          },
          orderBy: { growth: "desc" },
          take: 10,
          select: {
            id: true,
            keyword: true,
            platform: true,
            growth: true,
            overallScore: true,
          },
        });

        return {
          success: true,
          data: {
            overview: {
              totalTrends,
              activeTrends,
              averageScore: avgScore._avg.overallScore || 0,
              timeframe: input.timeframe,
            },
            categories: categoryStats.map(stat => ({
              category: stat.category,
              count: stat._count.category,
              averageScore: stat._avg.overallScore || 0,
            })),
            platforms: platformStats.map(stat => ({
              platform: stat.platform,
              count: stat._count.platform,
              averageScore: stat._avg.overallScore || 0,
            })),
            highGrowthTrends,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch trend analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Generate AI explanation for trends
  generateAIExplanation: publicProcedure
    .input(z.object({
      trendIds: z.array(z.string()),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await trendAgent.execute({
          task: "generate_ai_explanation",
          context: {
            trendIds: input.trendIds,
            context: input.context,
          },
        });

        return {
          success: true,
          data: result,
          message: "AI explanations generated successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to generate AI explanations: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Score trend relevance for campaigns
  scoreTrendRelevance: publicProcedure
    .input(z.object({
      trendIds: z.array(z.string()),
      campaignIds: z.array(z.string()).optional(),
      brandKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await trendAgent.execute({
          task: "score_trend_relevance",
          context: input,
        });

        return {
          success: true,
          data: result,
          message: "Trend relevance scoring completed",
        };
      } catch (error) {
        throw new Error(
          `Failed to score trend relevance: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Search trends
  searchTrends: publicProcedure
    .input(z.object({
      query: z.string(),
      platforms: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      try {
        const where: any = {
          OR: [
            { keyword: { contains: input.query, mode: "insensitive" } },
            { title: { contains: input.query, mode: "insensitive" } },
            { description: { contains: input.query, mode: "insensitive" } },
            { tags: { has: input.query } },
          ],
        };

        if (input.platforms && input.platforms.length > 0) {
          where.platform = { in: input.platforms };
        }
        if (input.regions && input.regions.length > 0) {
          where.region = { in: input.regions };
        }

        const trends = await prisma.trend.findMany({
          where,
          include: {
            trendScores: {
              take: 1,
              orderBy: { date: "desc" },
            },
          },
          orderBy: { overallScore: "desc" },
          take: input.limit,
        });

        return {
          success: true,
          data: trends,
          query: input.query,
          count: trends.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to search trends: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),
});

export type TrendRouter = typeof trendRouter;
