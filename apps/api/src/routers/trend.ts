import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Trend schemas
const TrendTopic = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['hashtag', 'sound', 'style', 'challenge', 'format']),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin']),
  region: z.string(),
  impactScore: z.number().min(0).max(100),
  projectedLift: z.number(),
  velocity: z.number(), // trending velocity (-100 to 100)
  description: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
  detectedAt: z.date(),
  expiresAt: z.date().nullable(),
  relatedKeywords: z.array(z.string()),
  metrics: z.object({
    mentions: z.number(),
    engagement: z.number(),
    reach: z.number(),
    growth: z.number(),
  }),
});

const GeoDemandData = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  region: z.string(),
  demandIntensity: z.number().min(0).max(100),
  engagementDelta: z.number(), // week-over-week growth percentage
  opportunityScore: z.number().min(0).max(100),
  topTrend: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  metrics: z.object({
    leads: z.number(),
    conversions: z.number(),
    revenue: z.number(),
    sessions: z.number(),
  }),
});

const TrendPrediction = z.object({
  trendId: z.string(),
  predictedImpact: z.number().min(0).max(100),
  timeframe: z.string(),
  factors: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high']),
  actionItems: z.array(z.string()),
});

// Mock data generators
function generateMockTrends(): Array<z.infer<typeof TrendTopic>> {
  const trendTemplates = [
    {
      title: 'AI-Generated Art Challenge',
      type: 'challenge' as const,
      platform: 'instagram' as const,
      description: 'Users creating art with AI tools and sharing before/after comparisons',
      recommendation: 'Create tutorial content showing AI art creation process with your brand',
    },
    {
      title: '#ProductivityHacks2024',
      type: 'hashtag' as const,
      platform: 'tiktok' as const,
      description: 'Short-form videos showing productivity tips and tools',
      recommendation: 'Share quick productivity tips related to your industry expertise',
    },
    {
      title: 'Minimalist Aesthetic Trend',
      type: 'style' as const,
      platform: 'youtube' as const,
      description: 'Clean, minimal design approaches across all content types',
      recommendation: 'Redesign visual content with minimal, clean aesthetics',
    },
    {
      title: 'Behind-the-Scenes Audio',
      type: 'sound' as const,
      platform: 'instagram' as const,
      description: 'Raw, unedited audio revealing authentic business moments',
      recommendation: 'Share authentic behind-the-scenes moments with original audio',
    },
    {
      title: 'Interactive Story Format',
      type: 'format' as const,
      platform: 'linkedin' as const,
      description: 'Multi-part story content with polls and engagement hooks',
      recommendation: 'Create interactive story series about your industry insights',
    },
    {
      title: '#SustainableBusiness',
      type: 'hashtag' as const,
      platform: 'twitter' as const,
      description: 'Content focusing on sustainable business practices and green initiatives',
      recommendation: 'Highlight your sustainability efforts and eco-friendly practices',
    },
    {
      title: 'Quick Tutorial Format',
      type: 'format' as const,
      platform: 'tiktok' as const,
      description: '60-second educational content with step-by-step guides',
      recommendation: 'Create bite-sized tutorials showcasing your expertise',
    },
    {
      title: 'Voice-Over Storytelling',
      type: 'sound' as const,
      platform: 'youtube' as const,
      description: 'Personal voice narration over visual content for authentic connection',
      recommendation: 'Add personal voice-overs to explain your creative process',
    },
  ];

  const regions = ['Global', 'UAE', 'USA', 'Europe', 'APAC', 'LATAM', 'Africa'];

  return trendTemplates.map((template, index) => {
    const now = new Date();
    const velocity = (Math.random() - 0.5) * 200; // -100 to 100
    const impactScore = Math.round(60 + Math.random() * 40); // 60-100

    return {
      id: `trend_${index + 1}`,
      title: template.title,
      type: template.type,
      platform: template.platform,
      region: regions[Math.floor(Math.random() * regions.length)],
      impactScore,
      projectedLift: Math.round(15 + Math.random() * 35), // 15-50%
      velocity,
      description: template.description,
      recommendation: template.recommendation,
      confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
      detectedAt: new Date(now.getTime() - Math.random() * 86400000 * 7), // Last week
      expiresAt:
        Math.random() > 0.3 ? new Date(now.getTime() + Math.random() * 86400000 * 30) : null,
      relatedKeywords: [
        'trending',
        'viral',
        'engagement',
        'growth',
        'marketing',
        'content',
        'strategy',
      ].slice(0, 3 + Math.floor(Math.random() * 3)),
      metrics: {
        mentions: Math.round(1000 + Math.random() * 50000),
        engagement: Math.round(5000 + Math.random() * 100000),
        reach: Math.round(50000 + Math.random() * 1000000),
        growth: Math.round(velocity * 0.5), // Correlated with velocity
      },
    };
  });
}

function generateMockGeoData(): Array<z.infer<typeof GeoDemandData>> {
  const countries = [
    { code: 'US', name: 'United States', region: 'North America', lat: 39.8283, lng: -98.5795 },
    { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', lat: 23.4241, lng: 53.8478 },
    { code: 'GB', name: 'United Kingdom', region: 'Europe', lat: 55.3781, lng: -3.436 },
    { code: 'DE', name: 'Germany', region: 'Europe', lat: 51.1657, lng: 10.4515 },
    { code: 'FR', name: 'France', region: 'Europe', lat: 46.2276, lng: 2.2137 },
    { code: 'CA', name: 'Canada', region: 'North America', lat: 56.1304, lng: -106.3468 },
    { code: 'AU', name: 'Australia', region: 'APAC', lat: -25.2744, lng: 133.7751 },
    { code: 'JP', name: 'Japan', region: 'APAC', lat: 36.2048, lng: 138.2529 },
    { code: 'SG', name: 'Singapore', region: 'APAC', lat: 1.3521, lng: 103.8198 },
    { code: 'BR', name: 'Brazil', region: 'South America', lat: -14.235, lng: -51.9253 },
    { code: 'IN', name: 'India', region: 'APAC', lat: 20.5937, lng: 78.9629 },
    { code: 'NL', name: 'Netherlands', region: 'Europe', lat: 52.1326, lng: 5.2913 },
    { code: 'SE', name: 'Sweden', region: 'Europe', lat: 60.1282, lng: 18.6435 },
    { code: 'CH', name: 'Switzerland', region: 'Europe', lat: 46.8182, lng: 8.2275 },
    { code: 'NO', name: 'Norway', region: 'Europe', lat: 60.472, lng: 8.4689 },
  ];

  const trendTitles = [
    'AI Art Challenge',
    'Productivity Hacks',
    'Minimalist Aesthetic',
    'Behind-the-Scenes',
    'Interactive Stories',
    'Sustainable Business',
    'Quick Tutorials',
    'Voice Storytelling',
  ];

  return countries.map(country => {
    const demandIntensity = Math.round(30 + Math.random() * 70); // 30-100
    const engagementDelta = (Math.random() - 0.3) * 100; // -30 to 70

    return {
      countryCode: country.code,
      countryName: country.name,
      region: country.region,
      demandIntensity,
      engagementDelta,
      opportunityScore: Math.round(demandIntensity * 0.8 + Math.random() * 20),
      topTrend: trendTitles[Math.floor(Math.random() * trendTitles.length)],
      coordinates: {
        lat: country.lat,
        lng: country.lng,
      },
      metrics: {
        leads: Math.round(100 + Math.random() * 2000),
        conversions: Math.round(20 + Math.random() * 400),
        revenue: Math.round(5000 + Math.random() * 100000),
        sessions: Math.round(1000 + Math.random() * 50000),
      },
    };
  });
}

function generateTrendPrediction(trendId: string): z.infer<typeof TrendPrediction> {
  const factors = [
    'Historical performance data',
    'Current engagement velocity',
    'Platform algorithm changes',
    'Seasonal trends',
    'Competitor analysis',
    'Audience behavior patterns',
    'External market conditions',
  ];

  const actionItems = [
    'Create content within the next 48 hours',
    'Optimize posting schedule for peak engagement',
    'Collaborate with relevant influencers',
    'Adapt trend to your brand voice',
    'Monitor competitor responses',
    'Prepare follow-up content series',
    'Analyze performance and iterate',
  ];

  const riskLevels = ['low', 'medium', 'high'] as const;

  return {
    trendId,
    predictedImpact: Math.round(60 + Math.random() * 40),
    timeframe: Math.random() > 0.5 ? '2-4 weeks' : '1-2 weeks',
    factors: factors.slice(0, 3 + Math.floor(Math.random() * 3)),
    riskLevel: riskLevels[Math.floor(Math.random() * 3)],
    actionItems: actionItems.slice(0, 3 + Math.floor(Math.random() * 3)),
  };
}

export const trendRouter = createTRPCRouter({
  // Get trending topics with filters
  getTrendingTopics: publicProcedure
    .input(
      z.object({
        platform: z
          .enum(['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'all'])
          .optional(),
        region: z.string().optional(),
        sortBy: z
          .enum(['impact', 'velocity', 'confidence', 'recency'])
          .optional()
          .default('impact'),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        let trends = generateMockTrends();

        // Filter by platform
        if (input.platform && input.platform !== 'all') {
          trends = trends.filter(trend => trend.platform === input.platform);
        }

        // Filter by region
        if (input.region && input.region !== 'Global') {
          trends = trends.filter(
            trend => trend.region === input.region || trend.region === 'Global'
          );
        }

        // Sort trends
        trends.sort((a, b) => {
          switch (input.sortBy) {
            case 'impact':
              return b.impactScore - a.impactScore;
            case 'velocity':
              return b.velocity - a.velocity;
            case 'confidence':
              return b.confidence - a.confidence;
            case 'recency':
              return b.detectedAt.getTime() - a.detectedAt.getTime();
            default:
              return b.impactScore - a.impactScore;
          }
        });

        // Limit results
        trends = trends.slice(0, input.limit);

        return {
          success: true,
          data: trends,
          count: trends.length,
          filters: {
            platform: input.platform || 'all',
            region: input.region || 'Global',
            sortBy: input.sortBy,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch trending topics: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get geographic demand mapping data
  getGeoDemandMap: publicProcedure
    .input(
      z.object({
        layer: z
          .enum(['demand', 'engagement', 'opportunity', 'revenue'])
          .optional()
          .default('demand'),
        timeframe: z.enum(['24h', '7d', '30d', '90d']).optional().default('7d'),
      })
    )
    .query(async ({ input }) => {
      try {
        const geoData = generateMockGeoData();

        // Sort by selected layer
        const sortedData = geoData.sort((a, b) => {
          switch (input.layer) {
            case 'demand':
              return b.demandIntensity - a.demandIntensity;
            case 'engagement':
              return b.engagementDelta - a.engagementDelta;
            case 'opportunity':
              return b.opportunityScore - a.opportunityScore;
            case 'revenue':
              return b.metrics.revenue - a.metrics.revenue;
            default:
              return b.demandIntensity - a.demandIntensity;
          }
        });

        return {
          success: true,
          data: sortedData,
          metadata: {
            layer: input.layer,
            timeframe: input.timeframe,
            totalCountries: sortedData.length,
            avgDemandIntensity: Math.round(
              sortedData.reduce((sum, item) => sum + item.demandIntensity, 0) / sortedData.length
            ),
            avgEngagementDelta:
              Math.round(
                (sortedData.reduce((sum, item) => sum + item.engagementDelta, 0) /
                  sortedData.length) *
                  10
              ) / 10,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch geo demand data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get detailed trend information
  getTrendDetails: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      const trends = generateMockTrends();
      const trend = trends.find(t => t.id === input.id);

      if (!trend) {
        throw new Error(`Trend with id ${input.id} not found`);
      }

      // Generate additional details for this specific trend
      const detailedTrend = {
        ...trend,
        historicalData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 86400000),
          mentions: Math.round(trend.metrics.mentions * (0.5 + Math.random())),
          engagement: Math.round(trend.metrics.engagement * (0.5 + Math.random())),
          reach: Math.round(trend.metrics.reach * (0.5 + Math.random())),
        })),
        competitors: [
          { name: 'Brand A', participation: Math.round(Math.random() * 100) },
          { name: 'Brand B', participation: Math.round(Math.random() * 100) },
          { name: 'Brand C', participation: Math.round(Math.random() * 100) },
        ],
        demographics: {
          ageGroups: {
            '18-24': Math.round(Math.random() * 40),
            '25-34': Math.round(Math.random() * 35),
            '35-44': Math.round(Math.random() * 25),
            '45+': Math.round(Math.random() * 15),
          },
          genders: {
            female: Math.round(40 + Math.random() * 20),
            male: Math.round(40 + Math.random() * 20),
            other: Math.round(Math.random() * 5),
          },
        },
      };

      return {
        success: true,
        data: detailedTrend,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch trend details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  // Predict trend impact for a specific trend
  predictTrendImpact: publicProcedure
    .input(
      z.object({
        trendId: z.string(),
        brandContext: z
          .object({
            industry: z.string().optional(),
            audience: z.string().optional(),
            contentStyle: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prediction = generateTrendPrediction(input.trendId);

        // Adjust prediction based on brand context if provided
        if (input.brandContext) {
          // Simulate context-aware adjustments
          if (input.brandContext.industry === 'tech') {
            prediction.predictedImpact += 10;
          }
          if (input.brandContext.audience === 'young') {
            prediction.predictedImpact += 5;
          }
        }

        // Cap at 100
        prediction.predictedImpact = Math.min(prediction.predictedImpact, 100);

        return {
          success: true,
          data: prediction,
          brandContext: input.brandContext,
        };
      } catch (error) {
        throw new Error(
          `Failed to predict trend impact: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get trend analytics summary
  getTrendAnalytics: publicProcedure
    .input(
      z.object({
        timeframe: z.enum(['24h', '7d', '30d']).optional().default('7d'),
      })
    )
    .query(async ({ input }) => {
      try {
        const trends = generateMockTrends();
        const geoData = generateMockGeoData();

        const analytics = {
          summary: {
            totalTrends: trends.length,
            hotTrends: trends.filter(t => t.impactScore > 80).length,
            risingTrends: trends.filter(t => t.velocity > 20).length,
            globalReach: trends.reduce((sum, t) => sum + t.metrics.reach, 0),
            avgConfidence:
              Math.round((trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length) * 100) /
              100,
          },
          platforms: {
            instagram: trends.filter(t => t.platform === 'instagram').length,
            tiktok: trends.filter(t => t.platform === 'tiktok').length,
            youtube: trends.filter(t => t.platform === 'youtube').length,
            twitter: trends.filter(t => t.platform === 'twitter').length,
            linkedin: trends.filter(t => t.platform === 'linkedin').length,
          },
          topRegions: geoData
            .sort((a, b) => b.demandIntensity - a.demandIntensity)
            .slice(0, 5)
            .map(region => ({
              name: region.countryName,
              score: region.demandIntensity,
              trend: region.topTrend,
            })),
          timeframe: input.timeframe,
        };

        return {
          success: true,
          data: analytics,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch trend analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),
});

export type TrendRouter = typeof trendRouter;
