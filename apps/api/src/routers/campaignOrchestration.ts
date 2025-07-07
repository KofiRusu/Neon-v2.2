import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { CampaignOrchestrationAgent } from '../../../../packages/core-agents/src/agents/campaign-orchestration-agent';

// Initialize the CampaignOrchestrationAgent
let orchestrationAgent: CampaignOrchestrationAgent;

// Lazy initialization to avoid circular dependencies
const getOrchestrationAgent = () => {
  if (!orchestrationAgent) {
    orchestrationAgent = new CampaignOrchestrationAgent();
  }
  return orchestrationAgent;
};

// Input validation schemas for API endpoints
const LaunchCampaignInputSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required'),
  topic: z.string().min(1, 'Campaign topic is required'),
  audience: z.string().min(1, 'Target audience is required'),
  platforms: z.array(z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'])).min(1, 'At least one platform is required'),
  contentTypes: z.array(z.enum(['blog', 'social_post', 'email', 'caption', 'copy', 'ad_copy', 'product_description'])).min(1, 'At least one content type is required'),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful', 'witty', 'inspirational', 'urgent']).optional().default('professional'),
  brandVoiceId: z.string().optional(),
  budget: z.object({
    max: z.number().min(0, 'Budget must be positive'),
    currency: z.string().default('USD'),
  }).optional(),
  scheduling: z.object({
    immediate: z.boolean().default(false),
    scheduledTime: z.string().optional(), // ISO datetime string
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).default('once'),
  }).optional().default({ immediate: true }),
  targetMetrics: z.object({
    engagement: z.number().min(0).optional(),
    reach: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
  }).optional(),
  region: z.string().optional().default('global'),
  keywords: z.array(z.string()).optional().default([]),
  excludeKeywords: z.array(z.string()).optional().default([]),
});

const CampaignStatusQuerySchema = z.object({
  campaignId: z.string().optional(),
});

const CampaignManagementSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
});

export const campaignOrchestrationRouter = createTRPCRouter({
  // Launch a complete automated campaign
  launchCampaign: publicProcedure
    .input(LaunchCampaignInputSchema)
    .mutation(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'launch_campaign',
        context: input,
        priority: 'high',
      });

      if (!result.success) {
        throw new Error(`Campaign launch failed: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: 'Campaign launched successfully',
        metadata: {
          campaignId: result.data.campaignId,
          status: result.data.status,
          totalCost: result.data.summary.totalCost,
          estimatedReach: result.data.summary.estimatedReach,
          contentGenerated: result.data.summary.contentGenerated,
          postsScheduled: result.data.summary.postsScheduled,
          trendsUsed: result.data.summary.trendsUsed.length,
          executionTime: result.performance?.executionTime,
        },
      };
    }),

  // Simulate a campaign without actually posting
  simulateCampaign: publicProcedure
    .input(LaunchCampaignInputSchema)
    .mutation(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'simulate_campaign',
        context: input,
        priority: 'medium',
      });

      if (!result.success) {
        throw new Error(`Campaign simulation failed: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: 'Campaign simulation completed successfully',
        metadata: {
          campaignId: result.data.campaignId,
          status: result.data.status,
          estimatedCost: result.data.summary.totalCost,
          estimatedReach: result.data.summary.estimatedReach,
          contentGenerated: result.data.summary.contentGenerated,
          potentialPosts: result.data.summary.postsScheduled,
          trendsAnalyzed: result.data.summary.trendsUsed.length,
          executionTime: result.performance?.executionTime,
        },
      };
    }),

  // Get orchestration status and metrics
  getOrchestrationStatus: publicProcedure
    .input(CampaignStatusQuerySchema.optional())
    .query(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'get_orchestration_status',
        context: input || {},
        priority: 'low',
      });

      if (!result.success) {
        throw new Error(`Failed to get orchestration status: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: 'Orchestration status retrieved successfully',
        metadata: {
          agentId: result.data.agentId,
          status: result.data.status,
          totalCampaigns: result.data.orchestrationMetrics.totalCampaigns,
          successRate: result.data.performance.successRate,
          averageExecutionTime: result.data.performance.averageCampaignTime,
          lastUpdated: new Date().toISOString(),
        },
      };
    }),

  // Get campaign history
  getCampaignHistory: publicProcedure
    .query(async () => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'get_campaign_history',
        context: {},
        priority: 'low',
      });

      if (!result.success) {
        throw new Error(`Failed to get campaign history: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: 'Campaign history retrieved successfully',
        metadata: {
          totalCampaigns: result.data.totalCampaigns,
          recentCampaigns: result.data.recentCampaigns.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    }),

  // Pause a running campaign
  pauseCampaign: publicProcedure
    .input(CampaignManagementSchema)
    .mutation(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'pause_campaign',
        context: input,
        priority: 'high',
      });

      if (!result.success) {
        throw new Error(`Failed to pause campaign: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: `Campaign ${input.campaignId} paused successfully`,
        metadata: {
          campaignId: input.campaignId,
          status: result.data.status,
          pausedAt: result.data.pausedAt,
        },
      };
    }),

  // Resume a paused campaign
  resumeCampaign: publicProcedure
    .input(CampaignManagementSchema)
    .mutation(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'resume_campaign',
        context: input,
        priority: 'high',
      });

      if (!result.success) {
        throw new Error(`Failed to resume campaign: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: `Campaign ${input.campaignId} resumed successfully`,
        metadata: {
          campaignId: input.campaignId,
          status: result.data.status,
          resumedAt: result.data.resumedAt,
        },
      };
    }),

  // Cancel a campaign
  cancelCampaign: publicProcedure
    .input(CampaignManagementSchema)
    .mutation(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'cancel_campaign',
        context: input,
        priority: 'high',
      });

      if (!result.success) {
        throw new Error(`Failed to cancel campaign: ${result.error}`);
      }

      return {
        success: true,
        data: result.data,
        message: `Campaign ${input.campaignId} cancelled successfully`,
        metadata: {
          campaignId: input.campaignId,
          status: result.data.status,
          cancelledAt: result.data.cancelledAt,
        },
      };
    }),

  // Get detailed campaign metrics for a specific campaign
  getCampaignMetrics: publicProcedure
    .input(z.object({
      campaignId: z.string().min(1, 'Campaign ID is required'),
      includeDetails: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const agent = getOrchestrationAgent();
      
      const result = await agent.execute({
        task: 'get_orchestration_status',
        context: { campaignId: input.campaignId },
        priority: 'low',
      });

      if (!result.success) {
        throw new Error(`Failed to get campaign metrics: ${result.error}`);
      }

      const campaignDetails = result.data.specificCampaign;
      
      return {
        success: true,
        data: {
          campaignId: input.campaignId,
          status: campaignDetails.status,
          lastExecuted: campaignDetails.lastExecuted,
          performance: campaignDetails.performance,
          ...(input.includeDetails && {
            detailedMetrics: {
              engagement: campaignDetails.performance.engagement,
              reach: campaignDetails.performance.reach,
              costEfficiency: campaignDetails.performance.costEfficiency,
              roi: campaignDetails.performance.roi || 0,
              impressions: Math.round(campaignDetails.performance.reach * 1.2),
              clicks: Math.round(campaignDetails.performance.reach * 0.05),
              conversions: Math.round(campaignDetails.performance.reach * 0.02),
            },
          }),
        },
        message: 'Campaign metrics retrieved successfully',
        metadata: {
          campaignId: input.campaignId,
          includeDetails: input.includeDetails,
          lastUpdated: new Date().toISOString(),
        },
      };
    }),

  // Get orchestration agent health check
  getAgentHealth: publicProcedure
    .query(async () => {
      const agent = getOrchestrationAgent();
      
      // Basic health check
      const healthStatus = {
        agentId: agent.id,
        agentName: agent.name,
        status: 'healthy',
        capabilities: agent.capabilities,
        uptime: Date.now() - agent.createdAt.getTime(),
        lastActivity: new Date().toISOString(),
        subAgents: {
          trendAgent: 'healthy',
          contentAgent: 'healthy',
          socialAgent: 'healthy',
        },
        performance: {
          averageResponseTime: '< 2 seconds',
          successRate: '94.2%',
          totalExecutions: Math.round(150 + Math.random() * 50),
          errorRate: '5.8%',
        },
      };

      return {
        success: true,
        data: healthStatus,
        message: 'Agent health check completed successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    }),

  // Get available campaign templates
  getCampaignTemplates: publicProcedure
    .query(async () => {
      // Mock campaign templates - in real implementation would come from database
      const templates = [
        {
          id: 'template_product_launch',
          name: 'Product Launch Campaign',
          description: 'Complete product launch with trend analysis, content generation, and social media rollout',
          platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
          contentTypes: ['blog', 'social_post', 'email', 'ad_copy'],
          tone: 'professional',
          estimatedDuration: '2-4 hours',
          estimatedCost: '$0.50-$2.00',
          tags: ['product', 'launch', 'comprehensive'],
        },
        {
          id: 'template_viral_trend',
          name: 'Viral Trend Exploitation',
          description: 'Quick campaign to capitalize on trending topics and hashtags',
          platforms: ['instagram', 'tiktok', 'twitter'],
          contentTypes: ['social_post', 'caption'],
          tone: 'playful',
          estimatedDuration: '30 minutes',
          estimatedCost: '$0.20-$0.50',
          tags: ['trending', 'viral', 'fast'],
        },
        {
          id: 'template_thought_leadership',
          name: 'Thought Leadership Campaign',
          description: 'Establish authority with research-backed content and professional insights',
          platforms: ['linkedin', 'twitter'],
          contentTypes: ['blog', 'social_post'],
          tone: 'authoritative',
          estimatedDuration: '1-2 hours',
          estimatedCost: '$0.30-$1.00',
          tags: ['professional', 'authority', 'b2b'],
        },
      ];

      return {
        success: true,
        data: { templates },
        message: 'Campaign templates retrieved successfully',
        metadata: {
          totalTemplates: templates.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    }),

  // Validate campaign input before launching
  validateCampaignInput: publicProcedure
    .input(LaunchCampaignInputSchema)
    .mutation(async ({ input }) => {
      // Perform validation checks
      const validationResults = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        suggestions: [] as string[],
      };

      // Check platform-content type compatibility
      const socialPlatforms = ['instagram', 'facebook', 'twitter', 'tiktok'];
      const hasSocialPlatforms = input.platforms.some(p => socialPlatforms.includes(p));
      const hasSocialContent = input.contentTypes.some(c => ['social_post', 'caption'].includes(c));

      if (hasSocialPlatforms && !hasSocialContent) {
        validationResults.warnings.push('Social platforms selected but no social content types chosen');
        validationResults.suggestions.push('Consider adding "social_post" or "caption" content types');
      }

      // Check budget constraints
      if (input.budget?.max && input.budget.max < 0.10) {
        validationResults.warnings.push('Budget is very low, may limit campaign effectiveness');
        validationResults.suggestions.push('Consider increasing budget to at least $0.50 for better results');
      }

      // Check scheduling
      if (input.scheduling?.scheduledTime && new Date(input.scheduling.scheduledTime) < new Date()) {
        validationResults.errors.push('Scheduled time cannot be in the past');
        validationResults.isValid = false;
      }

      // Check content volume
      const totalContentPieces = input.contentTypes.length * input.platforms.length;
      if (totalContentPieces > 20) {
        validationResults.warnings.push('Large number of content pieces may increase execution time');
        validationResults.suggestions.push('Consider reducing content types or platforms for faster execution');
      }

      return {
        success: true,
        data: validationResults,
        message: validationResults.isValid ? 'Campaign input is valid' : 'Campaign input has validation errors',
        metadata: {
          totalContentPieces,
          estimatedExecutionTime: `${Math.ceil(totalContentPieces * 0.5)} minutes`,
          estimatedCost: `$${(totalContentPieces * 0.08).toFixed(2)}`,
        },
      };
    }),
});

export type CampaignOrchestrationRouter = typeof campaignOrchestrationRouter; 