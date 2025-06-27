import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  EmailMarketingAgent,
  type EmailSequenceInput,
  type PersonalizationInput,
  type EmailPerformanceData,
  type ABTestInput,
} from '@neon/core-agents';
import { logger } from '@neon/utils';

// Validation schemas
const EmailSequenceInputSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  audience: z.string().min(1, 'Audience is required'),
  businessType: z.string().optional(),
  sequenceLength: z.number().min(1).max(10).default(3),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).default('professional'),
  goals: z.array(z.string()).optional(),
  industry: z.string().optional(),
});

const PersonalizationInputSchema = z.object({
  baseEmail: z.string().min(1, 'Base email content is required'),
  userTraits: z.record(z.any()),
  segmentData: z
    .object({
      segment: z.string(),
      characteristics: z.array(z.string()),
      preferences: z.array(z.string()).optional(),
    })
    .optional(),
  businessContext: z.string().optional(),
});

const EmailPerformanceDataSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  sent: z.number().min(0),
  delivered: z.number().min(0),
  opens: z.number().min(0),
  clicks: z.number().min(0),
  conversions: z.number().min(0).optional(),
  unsubscribes: z.number().min(0).optional(),
  bounces: z.number().min(0).optional(),
  complaints: z.number().min(0).optional(),
  timeRange: z.string().default('30d'),
});

const ABTestInputSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  variants: z
    .array(
      z.object({
        name: z.string(),
        subject: z.string().optional(),
        content: z.string().optional(),
        sendTime: z.string().optional(),
        fromName: z.string().optional(),
      })
    )
    .min(2, 'At least 2 variants required'),
  testMetric: z.enum(['open_rate', 'click_rate', 'conversion_rate']).default('open_rate'),
  sampleSize: z.number().min(100),
  duration: z.number().min(1).max(168), // Max 1 week
  audience: z.array(z.any()).default([]),
});

const SendCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject line is required'),
  content: z.object({
    text: z.string().min(1, 'Email content is required'),
    html: z.string().optional(),
  }),
  recipients: z.object({
    emails: z.array(z.string().email()),
    segments: z.array(z.string()).optional(),
    excludeList: z.array(z.string().email()).optional(),
  }),
  scheduling: z
    .object({
      sendImmediately: z.boolean().default(true),
      scheduledAt: z.date().optional(),
      timezone: z.string().default('UTC'),
    })
    .optional(),
  settings: z
    .object({
      trackOpens: z.boolean().default(true),
      trackClicks: z.boolean().default(true),
      replyTo: z.string().email().optional(),
      fromName: z.string().optional(),
      fromEmail: z.string().email().optional(),
    })
    .optional(),
});

export const emailRouter = createTRPCRouter({
  /**
   * Generate AI-powered email sequence
   */
  generateSequence: publicProcedure.input(EmailSequenceInputSchema).mutation(async ({ input }) => {
    try {
      logger.info(
        'Generating email sequence',
        { topic: input.topic, audience: input.audience },
        'EmailRouter'
      );

      const agent = new EmailMarketingAgent();
      const result = await agent.generateSequence(input as EmailSequenceInput);

      logger.info(
        'Email sequence generated successfully',
        { sequenceId: result.sequenceId },
        'EmailRouter'
      );

      return {
        success: true,
        data: result,
        message: 'Email sequence generated successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to generate email sequence',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'EmailRouter'
      );
      throw new Error(
        `Failed to generate email sequence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Personalize email content for specific user segments
   */
  personalizeEmail: publicProcedure
    .input(PersonalizationInputSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info(
          'Personalizing email content',
          { userTraits: Object.keys(input.userTraits) },
          'EmailRouter'
        );

        const agent = new EmailMarketingAgent();
        const result = await agent.personalize(input as PersonalizationInput);

        logger.info(
          'Email personalized successfully',
          { score: result.personalizationScore },
          'EmailRouter'
        );

        return {
          success: true,
          data: result,
          message: 'Email personalized successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to personalize email',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'EmailRouter'
        );
        throw new Error(
          `Failed to personalize email: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Analyze email campaign performance with AI insights
   */
  analyzePerformance: publicProcedure.input(EmailPerformanceDataSchema).query(async ({ input }) => {
    try {
      logger.info('Analyzing email performance', { campaignId: input.campaignId }, 'EmailRouter');

      const agent = new EmailMarketingAgent();
      const result = await agent.analyzePerformance(input as EmailPerformanceData);

      logger.info(
        'Performance analysis completed',
        { score: result.score, campaignId: input.campaignId },
        'EmailRouter'
      );

      return {
        success: true,
        data: result,
        message: 'Performance analysis completed',
      };
    } catch (error) {
      logger.error(
        'Failed to analyze performance',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'EmailRouter'
      );
      throw new Error(
        `Failed to analyze performance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Create and run A/B tests for email campaigns
   */
  runABTest: publicProcedure.input(ABTestInputSchema).mutation(async ({ input }) => {
    try {
      logger.info(
        'Creating A/B test',
        { name: input.name, variants: input.variants.length },
        'EmailRouter'
      );

      const agent = new EmailMarketingAgent();
      const result = await agent.runABTest(input as ABTestInput);

      logger.info(
        'A/B test created successfully',
        { testId: result.testId, winner: result.winner },
        'EmailRouter'
      );

      return {
        success: true,
        data: result,
        message: 'A/B test created successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to create A/B test',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'EmailRouter'
      );
      throw new Error(
        `Failed to create A/B test: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Send email campaign
   */
  sendCampaign: publicProcedure.input(SendCampaignSchema).mutation(async ({ input }) => {
    try {
      logger.info(
        'Sending email campaign',
        { name: input.name, recipientCount: input.recipients.emails.length },
        'EmailRouter'
      );

      const agent = new EmailMarketingAgent();
      const result = await agent.execute({
        task: 'send_campaign',
        context: input,
        priority: 'high',
      });

      logger.info(
        'Email campaign sent successfully',
        { campaignId: result.data?.campaignId },
        'EmailRouter'
      );

      return {
        success: true,
        data: result.data,
        message: 'Email campaign sent successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to send campaign',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'EmailRouter'
      );
      throw new Error(
        `Failed to send campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Get email templates
   */
  getTemplates: publicProcedure.query(async () => {
    try {
      const agent = new EmailMarketingAgent();
      const result = await agent.execute({
        task: 'manage_templates',
        context: { action: 'list' },
        priority: 'low',
      });

      return {
        success: true,
        data: result.data,
        message: 'Templates retrieved successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to get templates',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'EmailRouter'
      );
      throw new Error(
        `Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Generate AI-powered subject lines
   */
  generateSubjectLines: publicProcedure
    .input(
      z.object({
        topic: z.string().min(1, 'Topic is required'),
        audience: z.string().min(1, 'Audience is required'),
        tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).default('professional'),
        count: z.number().min(1).max(10).default(5),
        keywords: z.array(z.string()).optional(),
        industry: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info(
          'Generating subject lines',
          { topic: input.topic, count: input.count },
          'EmailRouter'
        );

        const agent = new EmailMarketingAgent();
        const result = await agent.execute({
          task: 'generate_subject_lines',
          context: input,
          priority: 'medium',
        });

        logger.info(
          'Subject lines generated successfully',
          { count: result.data?.subjectLines?.length },
          'EmailRouter'
        );

        return {
          success: true,
          data: result.data,
          message: 'Subject lines generated successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to generate subject lines',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'EmailRouter'
        );
        throw new Error(
          `Failed to generate subject lines: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Optimize send times for better engagement
   */
  optimizeSendTimes: publicProcedure
    .input(
      z.object({
        audience: z.array(
          z.object({
            email: z.string().email(),
            timezone: z.string().optional(),
            behaviorData: z
              .object({
                lastOpen: z.date().optional(),
                avgOpenTime: z.string().optional(),
                engagementHistory: z.array(z.any()).optional(),
              })
              .optional(),
          })
        ),
        campaignType: z.string().optional(),
        industry: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info(
          'Optimizing send times',
          { audienceSize: input.audience.length },
          'EmailRouter'
        );

        const agent = new EmailMarketingAgent();
        const result = await agent.execute({
          task: 'optimize_send_times',
          context: input,
          priority: 'medium',
        });

        logger.info(
          'Send times optimized successfully',
          { optimalTimes: result.data?.optimalTimes?.length },
          'EmailRouter'
        );

        return {
          success: true,
          data: result.data,
          message: 'Send times optimized successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to optimize send times',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'EmailRouter'
        );
        throw new Error(
          `Failed to optimize send times: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Segment audience for targeted campaigns
   */
  segmentAudience: publicProcedure
    .input(
      z.object({
        contacts: z.array(
          z.object({
            email: z.string().email(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            company: z.string().optional(),
            customFields: z.record(z.any()).optional(),
            behaviorData: z
              .object({
                lastOpen: z.date().optional(),
                lastClick: z.date().optional(),
                totalOpens: z.number().optional(),
                totalClicks: z.number().optional(),
              })
              .optional(),
          })
        ),
        segmentRules: z.record(z.any()).optional(),
        segmentName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('Segmenting audience', { contactCount: input.contacts.length }, 'EmailRouter');

        const agent = new EmailMarketingAgent();
        const result = await agent.execute({
          task: 'segment_audience',
          context: input,
          priority: 'medium',
        });

        logger.info(
          'Audience segmented successfully',
          { segmentCount: result.data?.segments?.length },
          'EmailRouter'
        );

        return {
          success: true,
          data: result.data,
          message: 'Audience segmented successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to segment audience',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'EmailRouter'
        );
        throw new Error(
          `Failed to segment audience: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Create newsletter with AI assistance
   */
  createNewsletter: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Newsletter title is required'),
        topics: z.array(z.string()).min(1, 'At least one topic is required'),
        audience: z.string().min(1, 'Target audience is required'),
        tone: z.enum(['professional', 'casual', 'friendly']).default('professional'),
        includeImages: z.boolean().default(true),
        sections: z.array(z.string()).optional(),
        industry: z.string().optional(),
        companyInfo: z
          .object({
            name: z.string(),
            website: z.string().optional(),
            description: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info(
          'Creating newsletter',
          { title: input.title, topicCount: input.topics.length },
          'EmailRouter'
        );

        const agent = new EmailMarketingAgent();
        const result = await agent.execute({
          task: 'create_newsletter',
          context: input,
          priority: 'medium',
        });

        logger.info(
          'Newsletter created successfully',
          { newsletterId: result.data?.newsletter?.id },
          'EmailRouter'
        );

        return {
          success: true,
          data: result.data,
          message: 'Newsletter created successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to create newsletter',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'EmailRouter'
        );
        throw new Error(
          `Failed to create newsletter: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Get email analytics and performance data
   */
  getAnalytics: publicProcedure
    .input(
      z.object({
        timeRange: z.string().default('30d'),
        campaignIds: z.array(z.string()).optional(),
        segment: z.string().optional(),
        includeComparison: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info(
          'Getting email analytics',
          { timeRange: input.timeRange, campaignCount: input.campaignIds?.length },
          'EmailRouter'
        );

        // Mock analytics data - in real implementation would pull from database/analytics service
        const mockAnalytics = {
          summary: {
            totalCampaigns: 24,
            totalSent: 45620,
            totalDelivered: 44890,
            totalOpens: 12750,
            totalClicks: 1890,
            totalConversions: 320,
            openRate: 28.4,
            clickRate: 14.8,
            conversionRate: 16.9,
            unsubscribeRate: 0.8,
            bounceRate: 1.6,
          },
          trends: {
            daily: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              sent: Math.floor(Math.random() * 2000 + 500),
              opens: Math.floor(Math.random() * 600 + 100),
              clicks: Math.floor(Math.random() * 100 + 20),
              conversions: Math.floor(Math.random() * 20 + 5),
            })),
            monthly: Array.from({ length: 12 }, (_, i) => ({
              month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
              sent: Math.floor(Math.random() * 20000 + 10000),
              opens: Math.floor(Math.random() * 6000 + 2000),
              clicks: Math.floor(Math.random() * 1200 + 400),
              conversions: Math.floor(Math.random() * 200 + 50),
            })),
          },
          segments: [
            { name: 'New Subscribers', openRate: 32.1, clickRate: 6.8, size: 8500 },
            { name: 'Active Users', openRate: 26.3, clickRate: 4.2, size: 15200 },
            { name: 'VIP Customers', openRate: 41.7, clickRate: 12.4, size: 2800 },
            { name: 'Inactive Users', openRate: 18.9, clickRate: 2.1, size: 9600 },
          ],
          topPerforming: [
            {
              id: 'camp_1',
              name: 'Welcome Series #3',
              openRate: 45.2,
              clickRate: 18.6,
              sent: 1250,
            },
            {
              id: 'camp_2',
              name: 'Product Update January',
              openRate: 38.1,
              clickRate: 12.3,
              sent: 5420,
            },
            { id: 'camp_3', name: 'Flash Sale Alert', openRate: 35.7, clickRate: 15.9, sent: 2890 },
          ],
          deviceBreakdown: {
            mobile: 68.4,
            desktop: 25.1,
            tablet: 6.5,
          },
          timeOptimization: {
            bestSendTime: '10:00 AM',
            bestSendDay: 'Tuesday',
            timezoneData: {
              EST: { openRate: 32.1, clickRate: 6.8 },
              PST: { openRate: 28.9, clickRate: 5.4 },
              GMT: { openRate: 24.6, clickRate: 4.2 },
            },
          },
        };

        logger.info(
          'Email analytics retrieved successfully',
          {
            campaigns: mockAnalytics.summary.totalCampaigns,
            openRate: mockAnalytics.summary.openRate,
          },
          'EmailRouter'
        );

        return {
          success: true,
          data: mockAnalytics,
          message: 'Analytics retrieved successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to get analytics',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'EmailRouter'
        );
        throw new Error(
          `Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Get agent status and health check
   */
  getAgentStatus: publicProcedure.query(async () => {
    try {
      const agent = new EmailMarketingAgent();
      const status = await agent.getStatus();

      return {
        success: true,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          type: agent.type,
          capabilities: agent.capabilities,
          status: status.status,
          performance: status.performance,
          lastExecution: status.lastExecution,
          availableFeatures: {
            aiPowered: !!process.env.OPENAI_API_KEY,
            emailSending: true, // Would be based on email service configuration
            analytics: true,
            abTesting: true,
            personalization: true,
          },
        },
        message: 'Agent status retrieved successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to get agent status',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'EmailRouter'
      );
      throw new Error(
        `Failed to get agent status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),
});
