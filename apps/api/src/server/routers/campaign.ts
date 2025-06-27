/**
 * Campaign Router - tRPC API for Campaign Management
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { logger } from '@neon/utils';
import { CampaignAgent } from '@neon/core-agents';
import { CampaignRunner } from '@neon/core-agents/src/strategy/campaign-runner';
import { CampaignTuner } from '@neon/core-agents/src/strategy/campaign-tuner';
import {
  getCampaignTemplate,
  getAvailableTemplates,
} from '@neon/core-agents/src/strategy/campaign-templates';
import { type CampaignType, type CampaignStatus } from '@neon/data-model';

// Input schemas
const CampaignContextSchema = z.object({
  goal: z.enum([
    'brand_awareness',
    'lead_generation',
    'customer_retention',
    'product_launch',
    'event_promotion',
    'retargeting',
    'nurture_sequence',
  ]),
  channels: z.array(
    z.enum(['email', 'social_media', 'content_marketing', 'paid_ads', 'multi_channel'])
  ),
  targetAudience: z.string().min(1),
  budget: z.number().optional(),
  duration: z.string().optional(),
  brandTone: z.string().optional(),
  customMessage: z.string().optional(),
  scheduledStart: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

const ScheduleCampaignSchema = z.object({
  campaignContext: CampaignContextSchema,
  scheduledTime: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  recurring: z
    .object({
      interval: z.enum(['daily', 'weekly', 'monthly']),
      endDate: z.string().optional(),
    })
    .optional(),
});

// Initialize campaign services
const campaignAgent = new CampaignAgent();
const campaignRunner = new CampaignRunner();
const campaignTuner = new CampaignTuner();

export const campaignRouter = router({
  /**
   * Get available campaign templates
   */
  getTemplates: publicProcedure.query(async () => {
    try {
      logger.info('📋 Fetching campaign templates');
      const templates = getAvailableTemplates();

      return {
        success: true,
        data: templates,
        count: templates.length,
      };
    } catch (error) {
      logger.error('Failed to get campaign templates', { error });
      throw new Error('Failed to retrieve campaign templates');
    }
  }),

  /**
   * Get specific campaign template by goal
   */
  getTemplate: publicProcedure
    .input(
      z.object({
        goal: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info('📋 Fetching campaign template', { goal: input.goal });
        const template = getCampaignTemplate(input.goal);

        if (!template) {
          throw new Error(`Template not found for goal: ${input.goal}`);
        }

        return {
          success: true,
          data: template,
        };
      } catch (error) {
        logger.error('Failed to get campaign template', { goal: input.goal, error });
        throw new Error(`Failed to retrieve template for goal: ${input.goal}`);
      }
    }),

  /**
   * Plan a campaign
   */
  planCampaign: publicProcedure.input(CampaignContextSchema).mutation(async ({ input }) => {
    try {
      logger.info('🎯 Planning campaign', {
        goal: input.goal,
        channels: input.channels,
        audience: input.targetAudience,
      });

      // Mock campaign plan for now
      const plan = {
        id: `campaign_${Date.now()}`,
        goal: input.goal,
        channels: input.channels,
        targetAudience: input.targetAudience,
        steps: [
          {
            id: 'step_1',
            agentId: 'insight-agent',
            action: 'analyze_audience',
            status: 'pending',
            timing: { estimated: 300000 },
          },
          {
            id: 'step_2',
            agentId: 'content-agent',
            action: 'generate_content',
            status: 'pending',
            timing: { estimated: 600000 },
          },
        ],
        metrics: {
          targets: {
            conversion_rate: 0.05,
            open_rate: 0.25,
            click_rate: 0.05,
          },
          tracking: ['utm_tracking', 'pixel_tracking'],
        },
      };

      return {
        success: true,
        data: plan,
        message: 'Campaign plan created successfully',
      };
    } catch (error) {
      logger.error('Campaign planning failed', { input, error });
      throw new Error(
        `Campaign planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Execute a campaign
   */
  executeCampaign: publicProcedure.input(CampaignContextSchema).mutation(async ({ input }) => {
    try {
      logger.info('🚀 Executing campaign', {
        goal: input.goal,
        channels: input.channels,
      });

      // Mock campaign execution
      const execution = {
        id: `exec_${Date.now()}`,
        planId: `plan_${Date.now()}`,
        status: 'running' as const,
        progress: 25,
        metrics: {
          delivered: 150,
          opened: 35,
          clicked: 8,
          converted: 2,
          revenue: 450,
        },
        agentActivity: [
          {
            agentId: 'insight-agent',
            action: 'analyze_audience',
            timestamp: new Date(),
            result: 'Audience analysis completed',
          },
        ],
      };

      return {
        success: true,
        data: execution,
        message: 'Campaign execution started successfully',
      };
    } catch (error) {
      logger.error('Campaign execution failed', { input, error });
      throw new Error(
        `Campaign execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Schedule a campaign for future execution
   */
  scheduleCampaign: publicProcedure.input(ScheduleCampaignSchema).mutation(async ({ input }) => {
    try {
      logger.info('📅 Scheduling campaign', {
        goal: input.campaignContext.goal,
        scheduledTime: input.scheduledTime,
      });

      const scheduleId = await campaignRunner.scheduleCampaign(
        input.campaignContext,
        new Date(input.scheduledTime),
        {
          priority: input.priority,
          recurring: input.recurring,
        }
      );

      return {
        success: true,
        data: { scheduleId },
        message: 'Campaign scheduled successfully',
      };
    } catch (error) {
      logger.error('Campaign scheduling failed', { input, error });
      throw new Error(
        `Campaign scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Get campaign status and monitoring data
   */
  getCampaignStatus: publicProcedure.query(async () => {
    try {
      logger.info('📊 Fetching campaign status');

      const status = campaignRunner.getCampaignStatus();
      const monitoringData = await campaignAgent.execute({
        task: 'monitor_campaign',
        context: {},
      });

      return {
        success: true,
        data: {
          ...status,
          monitoring: monitoringData,
        },
      };
    } catch (error) {
      logger.error('Failed to get campaign status', { error });
      throw new Error('Failed to retrieve campaign status');
    }
  }),

  /**
   * Get detailed campaign information
   */
  getCampaign: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info('📖 Fetching campaign details', { campaignId: input.campaignId });

        const campaign = campaignAgent.getCampaign(input.campaignId);

        if (!campaign) {
          throw new Error(`Campaign not found: ${input.campaignId}`);
        }

        return {
          success: true,
          data: campaign,
        };
      } catch (error) {
        logger.error('Failed to get campaign', { campaignId: input.campaignId, error });
        throw new Error(`Failed to retrieve campaign: ${input.campaignId}`);
      }
    }),

  /**
   * Analyze campaign performance
   */
  analyzeCampaign: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('🔬 Analyzing campaign', { campaignId: input.campaignId });

        const campaign = campaignAgent.getCampaign(input.campaignId);
        if (!campaign) {
          throw new Error(`Campaign not found: ${input.campaignId}`);
        }

        const analysis = await campaignTuner.analyzeCampaign(campaign);

        return {
          success: true,
          data: analysis,
          message: 'Campaign analysis completed',
        };
      } catch (error) {
        logger.error('Campaign analysis failed', { campaignId: input.campaignId, error });
        throw new Error(
          `Campaign analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Optimize campaign performance
   */
  optimizeCampaign: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        autoApply: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('🎯 Optimizing campaign', {
          campaignId: input.campaignId,
          autoApply: input.autoApply,
        });

        // First analyze the campaign
        const campaign = campaignAgent.getCampaign(input.campaignId);
        if (!campaign) {
          throw new Error(`Campaign not found: ${input.campaignId}`);
        }

        const analysis = await campaignTuner.analyzeCampaign(campaign);

        let optimizationResults = null;
        if (input.autoApply && analysis.opportunities.length > 0) {
          // Apply high-confidence optimizations automatically
          const highConfidenceOptimizations = analysis.opportunities.filter(
            opt => opt.confidence > 0.8
          );

          if (highConfidenceOptimizations.length > 0) {
            optimizationResults = await campaignTuner.applyOptimizations(
              input.campaignId,
              highConfidenceOptimizations
            );
          }
        }

        return {
          success: true,
          data: {
            analysis,
            optimizationResults,
          },
          message: optimizationResults
            ? `Campaign optimized: ${optimizationResults.applied.length} optimizations applied`
            : 'Campaign analysis completed, review suggestions before applying',
        };
      } catch (error) {
        logger.error('Campaign optimization failed', { campaignId: input.campaignId, error });
        throw new Error(
          `Campaign optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Apply specific optimizations
   */
  applyOptimizations: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        optimizations: z.array(
          z.object({
            type: z.enum(['content', 'timing', 'audience', 'channel', 'budget']),
            confidence: z.number(),
            impact: z.enum(['low', 'medium', 'high', 'critical']),
            description: z.string(),
            recommendation: z.string(),
            expectedImprovement: z.number(),
            implementationDifficulty: z.enum(['easy', 'medium', 'hard']),
            dataPoints: z.array(z.string()),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('⚡ Applying optimizations', {
          campaignId: input.campaignId,
          count: input.optimizations.length,
        });

        const results = await campaignTuner.applyOptimizations(
          input.campaignId,
          input.optimizations
        );

        return {
          success: true,
          data: results,
          message: `Applied ${results.applied.length} of ${input.optimizations.length} optimizations`,
        };
      } catch (error) {
        logger.error('Failed to apply optimizations', { campaignId: input.campaignId, error });
        throw new Error(
          `Failed to apply optimizations: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Generate campaign report
   */
  generateReport: publicProcedure
    .input(
      z.object({
        campaignId: z.string().optional(),
        reportType: z
          .enum(['summary', 'detailed', 'performance', 'optimization'])
          .default('summary'),
        dateRange: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('📊 Generating campaign report', {
          campaignId: input.campaignId,
          reportType: input.reportType,
        });

        const report = await campaignAgent.execute({
          task: 'generate_report',
          context: {
            campaignId: input.campaignId,
            reportType: input.reportType,
            dateRange: input.dateRange,
          },
        });

        return {
          success: true,
          data: report,
          message: 'Campaign report generated successfully',
        };
      } catch (error) {
        logger.error('Report generation failed', { input, error });
        throw new Error(
          `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Cancel a scheduled campaign
   */
  cancelCampaign: publicProcedure
    .input(
      z.object({
        scheduleId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('❌ Cancelling campaign', { scheduleId: input.scheduleId });

        const success = await campaignRunner.cancelScheduledCampaign(input.scheduleId);

        if (!success) {
          throw new Error(`Campaign not found or cannot be cancelled: ${input.scheduleId}`);
        }

        return {
          success: true,
          message: 'Campaign cancelled successfully',
        };
      } catch (error) {
        logger.error('Campaign cancellation failed', { scheduleId: input.scheduleId, error });
        throw new Error(
          `Campaign cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Validate campaign configuration
   */
  validateCampaign: publicProcedure.input(CampaignContextSchema).mutation(async ({ input }) => {
    try {
      logger.info('✅ Validating campaign', { goal: input.goal });

      const validation = await campaignRunner.validateCampaign(input);

      return {
        success: true,
        data: validation,
        message: validation.isValid
          ? 'Campaign configuration is valid'
          : `Campaign validation failed: ${validation.errors.join(', ')}`,
      };
    } catch (error) {
      logger.error('Campaign validation failed', { input, error });
      throw new Error(
        `Campaign validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Get campaign metrics and KPIs
   */
  getCampaignMetrics: publicProcedure
    .input(
      z.object({
        campaignId: z.string().optional(),
        timeframe: z.enum(['1h', '24h', '7d', '30d', 'all']).default('24h'),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info('📈 Fetching campaign metrics', {
          campaignId: input.campaignId,
          timeframe: input.timeframe,
        });

        const metrics = await campaignAgent.execute({
          task: 'analyze_results',
          context: {
            campaignId: input.campaignId,
            timeframe: input.timeframe,
          },
        });

        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        logger.error('Failed to get campaign metrics', { input, error });
        throw new Error('Failed to retrieve campaign metrics');
      }
    }),

  /**
   * Get optimization history
   */
  getOptimizationHistory: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info('📚 Fetching optimization history', { campaignId: input.campaignId });

        const history = campaignTuner.getOptimizationHistory(input.campaignId);

        return {
          success: true,
          data: history,
          count: history.length,
        };
      } catch (error) {
        logger.error('Failed to get optimization history', { campaignId: input.campaignId, error });
        throw new Error('Failed to retrieve optimization history');
      }
    }),

  // Get all campaigns
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.userId && { userId: input.userId }),
        ...(input.status && { status: input.status as CampaignStatus }),
      };

      return ctx.db.campaign.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit,
      });
    }),

  // Get campaign by ID
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.campaign.findUnique({
      where: { id: input.id },
      include: {
        user: true,
      },
    });
  }),

  // Create new campaign
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum([
          'CONTENT_GENERATION',
          'AD_OPTIMIZATION',
          'B2B_OUTREACH',
          'TREND_ANALYSIS',
          'DESIGN_GENERATION',
        ]),
        userId: z.string(),
        status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).default('DRAFT'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaign.create({
        data: {
          name: input.name,
          type: input.type as CampaignType,
          status: input.status as CampaignStatus,
          userId: input.userId,
        },
        include: {
          user: true,
        },
      });
    }),

  // Update campaign
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.campaign.update({
        where: { id },
        data: data as { name?: string; status?: CampaignStatus },
        include: {
          user: true,
        },
      });
    }),

  // Delete campaign
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaign.delete({
        where: { id: input.id },
      });
    }),

  // Get campaign statistics
  getStats: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const where = input.userId ? { userId: input.userId } : {};

      const [total, active, completed] = await Promise.all([
        ctx.db.campaign.count({ where }),
        ctx.db.campaign.count({
          where: { ...where, status: 'ACTIVE' },
        }),
        ctx.db.campaign.count({
          where: { ...where, status: 'COMPLETED' },
        }),
      ]);

      return {
        total,
        active,
        completed,
        draft: total - active - completed,
      };
    }),
});

export type CampaignRouter = typeof campaignRouter;
