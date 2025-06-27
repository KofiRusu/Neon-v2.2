/**
 * Trends Router - Market Pulse Integration
 * Handles social media trend analysis and regional scoring
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { SocialApiClient } from '@neon/utils/social-api-client';
import { logger } from '@neon/utils';

const socialApiClient = new SocialApiClient();

interface TrendData {
  keyword: string;
  platform: string;
  score: number;
  metadata?: {
    industry?: string;
    [key: string]: unknown;
  };
}

export const trendsRouter = createTRPCRouter({
  // Get all trending data across platforms
  getAllTrends: publicProcedure.query(async () => {
    try {
      const trends = await socialApiClient.getAllTrends();

      return {
        success: true,
        data: trends,
        count: trends.length,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to fetch trends', { error }, 'TrendsRouter');
      return {
        success: false,
        data: [],
        error: 'Failed to fetch trends',
      };
    }
  }),

  // Get trends by platform
  getTrendsByPlatform: publicProcedure
    .input(
      z.object({
        platform: z.enum(['tiktok', 'instagram', 'twitter']),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        let trends;

        switch (input.platform) {
          case 'tiktok':
            trends = await socialApiClient.fetchTrendingTikTok();
            break;
          case 'instagram':
            trends = await socialApiClient.fetchTrendingInstagram();
            break;
          case 'twitter':
            trends = await socialApiClient.fetchTrendingTwitter();
            break;
          default:
            trends = [];
        }

        const limitedTrends = trends.slice(0, input.limit);

        return {
          success: true,
          data: limitedTrends,
          platform: input.platform,
          count: limitedTrends.length,
        };
      } catch (error) {
        logger.error(
          'Failed to fetch platform trends',
          { error, platform: input.platform },
          'TrendsRouter'
        );
        return {
          success: false,
          data: [],
          error: `Failed to fetch ${input.platform} trends`,
        };
      }
    }),

  // Get regional trend scores
  getRegionalScores: publicProcedure
    .input(
      z.object({
        region: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const regionScores = await socialApiClient.getRegionScores(input.region);

        return {
          success: true,
          data: regionScores,
          region: input.region,
        };
      } catch (error) {
        logger.error(
          'Failed to fetch regional scores',
          { error, region: input.region },
          'TrendsRouter'
        );
        return {
          success: false,
          data: null,
          error: 'Failed to fetch regional scores',
        };
      }
    }),

  // Analyze trend predictions
  analyzeTrendPredictions: publicProcedure
    .input(
      z.object({
        keywords: z.array(z.string()).min(1).max(10),
        timeframe: z.enum(['24h', '7d', '30d']).default('7d'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const allTrends = await socialApiClient.getAllTrends();

        // Filter trends by keywords
        const relevantTrends = allTrends.filter(trend =>
          input.keywords.some(keyword =>
            trend.keyword.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        // Calculate predictions based on score trends
        const predictions = input.keywords.map(keyword => {
          const keywordTrends = relevantTrends.filter(trend =>
            trend.keyword.toLowerCase().includes(keyword.toLowerCase())
          );

          const avgScore =
            keywordTrends.length > 0
              ? keywordTrends.reduce((sum, trend) => sum + trend.score, 0) / keywordTrends.length
              : 0;

          // Simple prediction model - in production use ML algorithms
          const prediction = avgScore > 0.7 ? 'rising' : avgScore > 0.4 ? 'stable' : 'declining';
          const confidence = Math.min(avgScore * 100, 95);

          return {
            keyword,
            prediction,
            confidence,
            avgScore,
            platforms: keywordTrends.map(t => t.platform),
            recommendation: getRecommendation(prediction, avgScore),
          };
        });

        return {
          success: true,
          data: {
            predictions,
            timeframe: input.timeframe,
            analyzedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        logger.error(
          'Failed to analyze trend predictions',
          { error, keywords: input.keywords },
          'TrendsRouter'
        );
        return {
          success: false,
          data: null,
          error: 'Failed to analyze trend predictions',
        };
      }
    }),

  // Get trend insights for content strategy
  getTrendInsights: publicProcedure
    .input(
      z.object({
        industry: z.string().optional(),
        contentType: z.enum(['video', 'image', 'text', 'story']).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const allTrends = await socialApiClient.getAllTrends();

        // Filter by industry if provided
        let filteredTrends = allTrends;
        if (input.industry) {
          filteredTrends = allTrends.filter(
            trend =>
              trend.keyword.toLowerCase().includes(input.industry.toLowerCase()) ||
              trend.metadata?.industry === input.industry
          );
        }

        // Sort by score and get top trends
        const topTrends = filteredTrends.sort((a, b) => b.score - a.score).slice(0, 10);

        // Generate insights
        const insights = {
          topKeywords: topTrends.map(t => t.keyword),
          bestPlatforms: getBestPlatforms(topTrends),
          contentRecommendations: getContentRecommendations(topTrends, input.contentType),
          optimalTiming: getOptimalTiming(),
          expectedReach: calculateExpectedReach(topTrends),
        };

        return {
          success: true,
          data: insights,
          industry: input.industry,
          contentType: input.contentType,
        };
      } catch (error) {
        logger.error(
          'Failed to generate trend insights',
          { error, industry: input.industry },
          'TrendsRouter'
        );
        return {
          success: false,
          data: null,
          error: 'Failed to generate trend insights',
        };
      }
    }),

  // Monitor specific trend keywords
  monitorKeywords: publicProcedure
    .input(
      z.object({
        keywords: z.array(z.string()).min(1).max(20),
        alertThreshold: z.number().min(0).max(1).default(0.8),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const allTrends = await socialApiClient.getAllTrends();

        const monitoredTrends = input.keywords.map(keyword => {
          const relevantTrends = allTrends.filter(trend =>
            trend.keyword.toLowerCase().includes(keyword.toLowerCase())
          );

          const maxScore =
            relevantTrends.length > 0 ? Math.max(...relevantTrends.map(t => t.score)) : 0;

          const shouldAlert = maxScore >= input.alertThreshold;

          return {
            keyword,
            currentScore: maxScore,
            shouldAlert,
            trendingPlatforms: relevantTrends
              .filter(t => t.score >= input.alertThreshold)
              .map(t => t.platform),
            lastUpdated: new Date().toISOString(),
          };
        });

        const alerts = monitoredTrends.filter(t => t.shouldAlert);

        return {
          success: true,
          data: {
            monitoredTrends,
            alerts,
            alertCount: alerts.length,
          },
        };
      } catch (error) {
        logger.error(
          'Failed to monitor keywords',
          { error, keywordCount: input.keywords.length },
          'TrendsRouter'
        );
        return {
          success: false,
          data: null,
          error: 'Failed to monitor keywords',
        };
      }
    }),
});

// Helper methods (would be class methods in production)
function getRecommendation(prediction: string, score: number): string {
  if (prediction === 'rising' && score > 0.8) {
    return 'Create content immediately - high viral potential';
  } else if (prediction === 'rising') {
    return 'Good opportunity for content creation';
  } else if (prediction === 'stable') {
    return 'Safe choice for consistent engagement';
  } else {
    return 'Consider alternative keywords';
  }
}

function getBestPlatforms(trends: TrendData[]): string[] {
  const platformCounts = trends.reduce(
    (acc, trend) => {
      acc[trend.platform] = (acc[trend.platform] || 0) + trend.score;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([platform]) => platform);
}

function getContentRecommendations(trends: TrendData[], contentType?: string): string[] {
  const recommendations = [
    'Use trending hashtags in your content',
    'Create content around peak engagement times',
    'Incorporate current trending topics',
  ];

  if (contentType === 'video') {
    recommendations.push('Focus on short-form video content', 'Use trending audio tracks');
  } else if (contentType === 'image') {
    recommendations.push('Use bold, eye-catching visuals', 'Include trending colors');
  }

  return recommendations;
}

function getOptimalTiming(): string[] {
  return [
    'Post between 6-9 PM for maximum engagement',
    'Tuesday through Thursday show highest activity',
    'Weekend posts perform well for lifestyle content',
  ];
}

function calculateExpectedReach(trends: TrendData[]): number {
  const avgScore = trends.reduce((sum, trend) => sum + trend.score, 0) / trends.length;
  return Math.floor(avgScore * 100000); // Mock calculation
}
