/**
 * A/B Testing tRPC Router
 * Handles variant generation, test management, and performance analytics
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Input schemas
const VariantGenerationRequestSchema = z.object({
  campaignId: z.string(),
  content: z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    visualTheme: z.string().optional(),
  }),
  targetAudience: z.string(),
  variantTypes: z.array(z.enum(['subject', 'copy', 'visual', 'cta', 'timing'])),
  variantCount: z.number().min(1).max(10),
  constraints: z
    .object({
      maxLength: z.number().optional(),
      tone: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      brandGuidelines: z.array(z.string()).optional(),
    })
    .optional(),
});

const ABTestCreationRequestSchema = z.object({
  campaignId: z.string(),
  name: z.string(),
  variants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      variants: z.array(z.any()), // ContentVariant array
      expectedPerformance: z.number(),
      riskLevel: z.enum(['low', 'medium', 'high']),
      testDuration: z.number(),
    })
  ),
  config: z
    .object({
      testType: z.enum(['split', 'multivariate', 'sequential']).optional(),
      duration: z.number().optional(),
      minSampleSize: z.number().optional(),
      confidenceLevel: z.number().optional(),
      primaryMetric: z.enum(['open_rate', 'click_rate', 'conversion_rate', 'revenue']).optional(),
      autoWinner: z.boolean().optional(),
    })
    .optional(),
  targetAudience: z.object({
    size: z.number(),
    segments: z.array(z.string()),
    filters: z.record(z.any()),
  }),
});

const SchedulingRequestSchema = z.object({
  campaignId: z.string(),
  targetAudience: z.object({
    segments: z.array(z.string()),
    timezone: z.string(),
    size: z.number(),
    demographics: z.record(z.any()),
  }),
  contentType: z.enum(['email', 'social', 'sms', 'push', 'ad']),
  urgency: z.enum(['low', 'medium', 'high', 'immediate']),
  duration: z.number().optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  constraints: z
    .object({
      businessHours: z.boolean().optional(),
      weekendsAllowed: z.boolean().optional(),
      blackoutDates: z.array(z.string()).optional(),
      maxSendsPerDay: z.number().optional(),
    })
    .optional(),
});

export const abTestingRouter = createTRPCRouter({
  /**
   * Generate content variants for A/B testing
   */
  generateVariants: publicProcedure
    .input(VariantGenerationRequestSchema)
    .mutation(async ({ input }) => {
      try {
        console.log(`🔀 Generating variants for campaign ${input.campaignId}`);

        // Mock variant generation - replace with actual CampaignVariantGenerator
        const mockVariants = [
          {
            id: 'subject_personalization_0',
            type: 'subject',
            original: input.content.subject || 'Your Campaign Update',
            variant: `{{firstName}}, ${input.content.subject?.toLowerCase() || 'your campaign update'}`,
            confidence: 0.82,
            brandAlignment: 0.9,
            expectedPerformance: 0.85,
            tags: ['personalization', 'subject_line'],
          },
          {
            id: 'subject_urgency_1',
            type: 'subject',
            original: input.content.subject || 'Your Campaign Update',
            variant: `🔥 Limited Time: ${input.content.subject || 'Your Campaign Update'}`,
            confidence: 0.78,
            brandAlignment: 0.85,
            expectedPerformance: 0.82,
            tags: ['urgency', 'subject_line'],
          },
          {
            id: 'copy_conversational_0',
            type: 'copy',
            original: input.content.body || 'Welcome to our campaign!',
            variant: `Hey there! ${input.content.body || 'Welcome to our campaign!'} Let me know what you think!`,
            confidence: 0.75,
            brandAlignment: 0.88,
            expectedPerformance: 0.78,
            tags: ['conversational', 'email_copy'],
          },
        ];

        const mockCombinations = [
          {
            id: 'combination_0',
            name: 'Test Variant A',
            variants: mockVariants.slice(0, 2),
            expectedPerformance: 0.83,
            riskLevel: 'low' as const,
            testDuration: 2880, // 48 hours
          },
          {
            id: 'combination_1',
            name: 'Test Variant B',
            variants: [mockVariants[0], mockVariants[2]],
            expectedPerformance: 0.81,
            riskLevel: 'medium' as const,
            testDuration: 2880,
          },
        ];

        const result = {
          campaignId: input.campaignId,
          variants: mockVariants,
          combinations: mockCombinations,
          recommendations: {
            highestConfidence: ['subject_personalization_0'],
            brandAligned: ['subject_personalization_0', 'copy_conversational_0'],
            experimental: ['subject_urgency_1'],
          },
          generatedAt: new Date(),
        };

        console.log(
          `✅ Generated ${mockVariants.length} variants with ${mockCombinations.length} combinations`
        );
        return result;
      } catch (error) {
        console.error('❌ Variant generation failed:', error);
        throw new Error(`Failed to generate variants: ${error}`);
      }
    }),

  /**
   * Create and launch A/B test
   */
  createTest: publicProcedure.input(ABTestCreationRequestSchema).mutation(async ({ input }) => {
    try {
      console.log(`🧪 Creating A/B test: ${input.name}`);

      // Mock test creation - replace with actual ABTestingManager
      const mockTest = {
        id: `abtest_${Date.now()}`,
        campaignId: input.campaignId,
        name: input.name,
        status: 'draft' as const,
        variants: input.variants.map((combination, index) => ({
          id: `variant_${index}`,
          name: combination.name,
          combination,
          trafficAllocation: 100 / input.variants.length,
          status: 'active' as const,
          metrics: {
            impressions: 0,
            opens: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            bounces: 0,
            unsubscribes: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
            revenuePerUser: 0,
            lastUpdated: new Date(),
          },
        })),
        config: {
          testType: 'split' as const,
          duration: 2880, // 48 hours
          minSampleSize: 1000,
          confidenceLevel: 0.95,
          statisticalPower: 0.8,
          primaryMetric: 'conversion_rate' as const,
          secondaryMetrics: ['open_rate', 'click_rate', 'revenue'],
          autoWinner: true,
          maxDuration: 10080, // 7 days
          trafficSplit: 'equal' as const,
          ...input.config,
        },
        results: {
          totalImpressions: 0,
          totalConversions: 0,
          testProgress: 0,
          statisticalSignificance: {
            isSignificant: false,
            pValue: 1.0,
            confidenceInterval: [0, 0] as [number, number],
            sampleSizeReached: false,
            powerAchieved: false,
          },
          recommendation: {
            action: 'continue' as const,
            reason: 'Test just started',
            confidence: 0.5,
            expectedLift: 0,
            estimatedRevenue: 0,
          },
          insights: [],
          performance: [],
        },
        createdAt: new Date(),
      };

      console.log(`✅ A/B test created: ${mockTest.id}`);
      return mockTest;
    } catch (error) {
      console.error('❌ A/B test creation failed:', error);
      throw new Error(`Failed to create A/B test: ${error}`);
    }
  }),

  /**
   * Start an A/B test
   */
  startTest: publicProcedure
    .input(
      z.object({
        testId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`🚀 Starting A/B test: ${input.testId}`);

        // Mock test start - replace with actual ABTestingManager
        const result = {
          testId: input.testId,
          status: 'running' as const,
          startedAt: new Date(),
          message: 'A/B test started successfully',
        };

        return result;
      } catch (error) {
        console.error('❌ Failed to start A/B test:', error);
        throw new Error(`Failed to start A/B test: ${error}`);
      }
    }),

  /**
   * Get A/B test results
   */
  getTestResults: publicProcedure
    .input(
      z.object({
        testId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log(`📊 Fetching A/B test results: ${input.testId}`);

        // Mock test results - replace with actual ABTestingManager
        const mockResults = {
          id: input.testId,
          name: 'Holiday Email Campaign A/B Test',
          status: 'running' as const,
          progress: 65,
          variants: [
            {
              id: 'variant_0',
              name: 'Control (Original)',
              status: 'active' as const,
              metrics: {
                impressions: 5420,
                opens: 1407,
                clicks: 267,
                conversions: 89,
                revenue: 2670,
                openRate: 26.0,
                clickRate: 19.0,
                conversionRate: 33.3,
                revenuePerUser: 0.49,
                lastUpdated: new Date(),
              },
              lift: 0,
              confidence: 0.95,
              trafficAllocation: 50,
            },
            {
              id: 'variant_1',
              name: 'Personalized Subject',
              status: 'winner' as const,
              metrics: {
                impressions: 5380,
                opens: 1531,
                clicks: 321,
                conversions: 118,
                revenue: 3540,
                openRate: 28.5,
                clickRate: 21.0,
                conversionRate: 36.8,
                revenuePerUser: 0.66,
                lastUpdated: new Date(),
              },
              lift: 32.6,
              confidence: 0.98,
              trafficAllocation: 50,
            },
          ],
          timeline: generateMockTimeline(),
          insights: [
            {
              type: 'positive' as const,
              title: 'Strong Winner Detected',
              description:
                'Variant B shows statistically significant improvement across all metrics',
              confidence: 0.98,
              action: 'Consider declaring winner',
            },
          ],
          recommendation: {
            action: 'declare_winner' as const,
            reason: 'Variant B shows statistically significant improvement with 98% confidence',
            confidence: 0.98,
            expectedLift: 32.6,
            estimatedRevenue: 2400,
          },
          statisticalSignificance: {
            isSignificant: true,
            pValue: 0.02,
            confidenceLevel: 0.98,
          },
        };

        return mockResults;
      } catch (error) {
        console.error('❌ Failed to fetch A/B test results:', error);
        throw new Error(`Failed to fetch A/B test results: ${error}`);
      }
    }),

  /**
   * Declare winner and stop test
   */
  declareWinner: publicProcedure
    .input(
      z.object({
        testId: z.string(),
        variantId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`🏆 Declaring winner for test ${input.testId}: ${input.variantId}`);

        // Mock winner declaration - replace with actual ABTestingManager
        const result = {
          testId: input.testId,
          winnerId: input.variantId,
          status: 'winner_declared' as const,
          completedAt: new Date(),
          performance: {
            lift: 32.6,
            significance: 0.98,
            estimatedRevenue: 2400,
          },
          message: 'Winner declared successfully',
        };

        return result;
      } catch (error) {
        console.error('❌ Failed to declare winner:', error);
        throw new Error(`Failed to declare winner: ${error}`);
      }
    }),

  /**
   * Stop A/B test
   */
  stopTest: publicProcedure
    .input(
      z.object({
        testId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`⏹️ Stopping A/B test: ${input.testId}`);

        // Mock test stop - replace with actual ABTestingManager
        const result = {
          testId: input.testId,
          status: 'completed' as const,
          completedAt: new Date(),
          reason: input.reason || 'manual_stop',
          message: 'A/B test stopped successfully',
        };

        return result;
      } catch (error) {
        console.error('❌ Failed to stop A/B test:', error);
        throw new Error(`Failed to stop A/B test: ${error}`);
      }
    }),

  /**
   * Generate smart schedule for campaign
   */
  generateSchedule: publicProcedure.input(SchedulingRequestSchema).mutation(async ({ input }) => {
    try {
      console.log(`📅 Generating smart schedule for campaign ${input.campaignId}`);

      // Mock schedule generation - replace with actual SmartScheduler
      const mockSchedule = {
        recommendedSchedule: [
          {
            id: 'slot_primary_tuesday_10',
            timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            timezone: input.targetAudience.timezone,
            dayOfWeek: 'Tuesday',
            hour: 10,
            minute: 0,
            audience: {
              segment: input.targetAudience.segments[0],
              size: input.targetAudience.size,
              expectedEngagement: 0.85,
            },
            priority: 'primary' as const,
            performance: {
              historical: {
                openRate: 28.5,
                clickRate: 5.2,
                conversionRate: 3.8,
                engagementScore: 85,
                sampleSize: 1200,
                lastUpdated: new Date(),
              },
              predicted: {
                openRate: 30.1,
                clickRate: 5.5,
                conversionRate: 4.1,
                engagementScore: 87,
                sampleSize: 0,
                lastUpdated: new Date(),
              },
            },
          },
        ],
        alternativeSchedules: [],
        reasoning: {
          primaryFactors: [
            'Historical performance data shows highest engagement during selected time slots',
            `${input.contentType} content performs best at scheduled times for target audience`,
          ],
          seasonalFactors: ['Current season trends support selected timing strategy'],
          audienceInsights: [
            `${input.targetAudience.segments[0]} segment shows peak activity during 9-11:00 hours`,
          ],
          competitiveAnalysis: ['Timing avoids high-competition windows when possible'],
          recommendations: ['Consider A/B testing alternative time slots for optimization'],
        },
        performance: {
          expectedOpenRate: 30.1,
          expectedClickRate: 5.5,
          expectedConversionRate: 4.1,
          confidenceScore: 0.85,
        },
        optimizations: [
          {
            type: 'time_shift' as const,
            description: 'Test sending 1-2 hours earlier/later for segments with lower confidence',
            expectedImprovement: 0.15,
            confidence: 0.7,
            implementation: 'Create variant schedules with +/- 1 hour shifts',
          },
        ],
      };

      console.log(
        `✅ Smart schedule generated with ${mockSchedule.recommendedSchedule.length} optimal slots`
      );
      return mockSchedule;
    } catch (error) {
      console.error('❌ Smart scheduling failed:', error);
      throw new Error(`Failed to generate smart schedule: ${error}`);
    }
  }),

  /**
   * Get all A/B tests for a campaign
   */
  getTestsByCampaign: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock data - replace with actual database query
        const mockTests = [
          {
            id: 'test_001',
            name: 'Holiday Email Subject Test',
            status: 'winner_declared' as const,
            progress: 100,
            winner: 'variant_1',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            variants: 2,
            performance: {
              bestLift: 32.6,
              significance: 0.98,
            },
          },
          {
            id: 'test_002',
            name: 'CTA Button Color Test',
            status: 'running' as const,
            progress: 45,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            variants: 3,
            performance: {
              bestLift: 8.2,
              significance: 0.65,
            },
          },
        ];

        return mockTests;
      } catch (error) {
        console.error('❌ Failed to fetch tests:', error);
        throw new Error(`Failed to fetch tests: ${error}`);
      }
    }),
});

// Helper function to generate mock timeline data
function generateMockTimeline() {
  const data = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseOpenA = 25 + Math.random() * 4;
    const baseOpenB = 27 + Math.random() * 4;

    data.push({
      timestamp: hour.toISOString(),
      hour: 24 - i,
      variants: {
        variant_0: {
          openRate: baseOpenA,
          clickRate: baseOpenA * 0.75,
          conversionRate: baseOpenA * 0.3,
          impressions: 200 + Math.floor(Math.random() * 100),
        },
        variant_1: {
          openRate: baseOpenB,
          clickRate: baseOpenB * 0.78,
          conversionRate: baseOpenB * 0.32,
          impressions: 195 + Math.floor(Math.random() * 100),
        },
      },
    });
  }

  return data;
}
