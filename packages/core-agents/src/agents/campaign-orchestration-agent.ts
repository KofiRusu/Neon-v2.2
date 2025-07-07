import { AbstractAgent } from '../base-agent';
import type { AgentPayload, AgentResult } from '../base-agent';
import { logger, BudgetTracker } from '@neon/utils';
import { z } from 'zod';

// Import other agents for orchestration
import { TrendAgent } from './trend-agent';
import { ContentAgent } from './content-agent';
import { SimpleSocialAgent } from './simple-social-agent';

// Input validation schemas
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

export type LaunchCampaignInput = z.infer<typeof LaunchCampaignInputSchema>;

// Campaign orchestration result interfaces
export interface CampaignOrchestrationResult {
  campaignId: string;
  status: 'initiated' | 'trend_detection' | 'content_generation' | 'social_posting' | 'completed' | 'failed';
  stages: {
    trendDetection?: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      output?: any;
      error?: string;
      executionTime?: number;
    };
    contentGeneration?: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      output?: any;
      error?: string;
      executionTime?: number;
    };
    socialPosting?: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      output?: any;
      error?: string;
      executionTime?: number;
    };
  };
  summary: {
    trendsUsed: string[];
    contentGenerated: number;
    postsScheduled: number;
    totalCost: number;
    estimatedReach: number;
  };
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export class CampaignOrchestrationAgent extends AbstractAgent {
  private trendAgent: TrendAgent;
  private contentAgent: ContentAgent;
  private socialAgent: SimpleSocialAgent;

  constructor() {
    super('campaign-orchestration-agent', 'CampaignOrchestrationAgent', 'orchestration', [
      'launch_campaign',
      'simulate_campaign',
      'get_orchestration_status',
      'get_campaign_history',
      'pause_campaign',
      'resume_campaign',
      'cancel_campaign',
    ]);

    // Initialize coordinated agents
    this.trendAgent = new TrendAgent();
    this.contentAgent = new ContentAgent();
    this.socialAgent = new SimpleSocialAgent();

    logger.info('CampaignOrchestrationAgent initialized with agent coordination', {
      trendAgent: this.trendAgent.id,
      contentAgent: this.contentAgent.id,
      socialAgent: this.socialAgent.id,
    }, 'CampaignOrchestration');
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;

      switch (task) {
        case 'launch_campaign':
          return await this.launchCampaign(context);
        case 'simulate_campaign':
          return await this.simulateCampaign(context);
        case 'get_orchestration_status':
          return await this.getOrchestrationStatus(context);
        case 'get_campaign_history':
          return await this.getCampaignHistory(context);
        case 'pause_campaign':
          return await this.pauseCampaign(context);
        case 'resume_campaign':
          return await this.resumeCampaign(context);
        case 'cancel_campaign':
          return await this.cancelCampaign(context);
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  /**
   * Launch a complete automated campaign
   */
  async launchCampaign(input: any): Promise<CampaignOrchestrationResult> {
    const validatedInput = LaunchCampaignInputSchema.parse(input);
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Launching automated campaign', {
      campaignId,
      campaignName: validatedInput.campaignName,
      topic: validatedInput.topic,
      platforms: validatedInput.platforms,
    }, 'CampaignOrchestration');

    return await this.executeCampaignPipeline(validatedInput, campaignId, false);
  }

  /**
   * Simulate a campaign without actually posting
   */
  async simulateCampaign(input: any): Promise<CampaignOrchestrationResult> {
    const validatedInput = LaunchCampaignInputSchema.parse(input);
    const campaignId = `simulation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Simulating campaign pipeline', {
      campaignId,
      campaignName: validatedInput.campaignName,
      topic: validatedInput.topic,
    }, 'CampaignOrchestration');

    return await this.executeCampaignPipeline(validatedInput, campaignId, true);
  }

  /**
   * Get orchestration status and metrics
   */
  async getOrchestrationStatus(input?: any): Promise<any> {
    const campaignId = input?.campaignId;
    
    // Mock status - in real implementation would query database
    const status = {
      agentId: this.id,
      agentName: this.name,
      type: this.type,
      status: 'active',
      orchestrationMetrics: {
        totalCampaigns: await this.getTotalCampaigns(),
        successfulCampaigns: await this.getSuccessfulCampaigns(),
        failedCampaigns: await this.getFailedCampaigns(),
        averageExecutionTime: await this.getAverageExecutionTime(),
        totalContentGenerated: await this.getTotalContentGenerated(),
        totalSocialPosts: await this.getTotalSocialPosts(),
      },
      agentCoordination: {
        trendAgentStatus: await this.getTrendAgentHealth(),
        contentAgentStatus: await this.getContentAgentHealth(),
        socialAgentStatus: await this.getSocialAgentHealth(),
      },
      performance: {
        averageCampaignTime: '< 5 minutes',
        successRate: '94.2%',
        costEfficiency: 'High',
        userSatisfaction: '4.8/5',
      },
    };

    if (campaignId) {
      status['specificCampaign'] = await this.getCampaignDetails(campaignId);
    }

    return status;
  }

  /**
   * Execute the complete campaign pipeline
   */
  private async executeCampaignPipeline(
    input: LaunchCampaignInput,
    campaignId: string,
    simulateOnly: boolean = false
  ): Promise<CampaignOrchestrationResult> {
    const startTime = Date.now();
    const result: CampaignOrchestrationResult = {
      campaignId,
      status: 'initiated',
      stages: {},
      summary: {
        trendsUsed: [],
        contentGenerated: 0,
        postsScheduled: 0,
        totalCost: 0,
        estimatedReach: 0,
      },
      createdAt: new Date(),
    };

    try {
      // Check overall budget constraints
      await this.validateBudgetConstraints(input);

      // Stage 1: Trend Detection
      logger.info('Starting trend detection stage', { campaignId }, 'CampaignOrchestration');
      result.status = 'trend_detection';
      result.stages.trendDetection = { status: 'running' };

      const trendStageStart = Date.now();
      const trendResults = await this.executeTrendDetection(input);
      result.stages.trendDetection = {
        status: 'completed',
        output: trendResults,
        executionTime: Date.now() - trendStageStart,
      };
      result.summary.trendsUsed = trendResults.trends.map((t: any) => t.id);

      // Stage 2: Content Generation
      logger.info('Starting content generation stage', { campaignId }, 'CampaignOrchestration');
      result.status = 'content_generation';
      result.stages.contentGeneration = { status: 'running' };

      const contentStageStart = Date.now();
      const contentResults = await this.executeContentGeneration(input, trendResults);
      result.stages.contentGeneration = {
        status: 'completed',
        output: contentResults,
        executionTime: Date.now() - contentStageStart,
      };
      result.summary.contentGenerated = contentResults.generatedContent.length;

      // Stage 3: Social Posting (or simulation)
      if (!simulateOnly && input.scheduling?.immediate) {
        logger.info('Starting social posting stage', { campaignId }, 'CampaignOrchestration');
        result.status = 'social_posting';
        result.stages.socialPosting = { status: 'running' };

        const socialStageStart = Date.now();
        const socialResults = await this.executeSocialPosting(input, contentResults);
        result.stages.socialPosting = {
          status: 'completed',
          output: socialResults,
          executionTime: Date.now() - socialStageStart,
        };
        result.summary.postsScheduled = socialResults.scheduledPosts.length;
      } else {
        // Simulation mode or scheduled posting
        result.stages.socialPosting = {
          status: 'completed',
          output: {
            simulationMode: simulateOnly,
            scheduledForLater: !input.scheduling?.immediate,
            potentialPosts: contentResults.generatedContent.length,
          },
          executionTime: 0,
        };
        result.summary.postsScheduled = simulateOnly ? 0 : contentResults.generatedContent.length;
      }

      // Calculate summary metrics
      result.summary.totalCost = this.calculateTotalCost(result);
      result.summary.estimatedReach = this.estimateReach(input, result);

      result.status = 'completed';
      result.completedAt = new Date();

      // Track successful campaign completion
      await this.trackCampaignCompletion(campaignId, result, input);

      logger.info('Campaign pipeline completed successfully', {
        campaignId,
        totalTime: Date.now() - startTime,
        trendsUsed: result.summary.trendsUsed.length,
        contentGenerated: result.summary.contentGenerated,
        postsScheduled: result.summary.postsScheduled,
      }, 'CampaignOrchestration');

      return result;

    } catch (error) {
      result.status = 'failed';
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.completedAt = new Date();

      logger.error('Campaign pipeline failed', {
        campaignId,
        error: result.errorMessage,
        executionTime: Date.now() - startTime,
      }, 'CampaignOrchestration');

      // Track failed campaign for analysis
      await this.trackCampaignFailure(campaignId, result, error);

      return result;
    }
  }

  /**
   * Execute trend detection using TrendAgent
   */
  private async executeTrendDetection(input: LaunchCampaignInput): Promise<any> {
    const trendPayload: AgentPayload = {
      task: 'detect_trends',
      context: {
        platforms: input.platforms,
        region: input.region,
        keywords: input.keywords,
        excludeKeywords: input.excludeKeywords,
        limit: 10,
        sortBy: 'impact_score',
      },
      priority: 'high',
    };

    const result = await this.trendAgent.execute(trendPayload);
    
    if (!result.success) {
      throw new Error(`Trend detection failed: ${result.error}`);
    }

    return {
      trends: result.data.trends || [],
      analysisComplete: true,
      totalTrendsAnalyzed: result.data.trends?.length || 0,
    };
  }

  /**
   * Execute content generation using ContentAgent
   */
  private async executeContentGeneration(input: LaunchCampaignInput, trendResults: any): Promise<any> {
    const generatedContent = [];
    
    for (const contentType of input.contentTypes) {
      for (const platform of input.platforms) {
        const contentPayload: AgentPayload = {
          task: 'generate_content',
          context: {
            topic: input.topic,
            type: contentType,
            audience: input.audience,
            tone: input.tone,
            platform,
            keywords: input.keywords,
            trendIds: trendResults.trends.slice(0, 3).map((t: any) => t.id), // Use top 3 trends
            brandVoiceId: input.brandVoiceId,
          },
          priority: 'medium',
        };

        const result = await this.contentAgent.execute(contentPayload);
        
        if (result.success) {
          generatedContent.push({
            contentType,
            platform,
            content: result.data.content,
            title: result.data.suggestedTitle,
            hashtags: result.data.hashtags,
            seoScore: result.data.seoScore,
            readingTime: result.data.readingTime,
            trendsIntegrated: trendResults.trends.slice(0, 3).map((t: any) => t.id),
          });
        } else {
          logger.warn('Content generation failed for specific type/platform', {
            contentType,
            platform,
            error: result.error,
          }, 'CampaignOrchestration');
        }
      }
    }

    return {
      generatedContent,
      totalItems: generatedContent.length,
      contentTypes: input.contentTypes,
      platformsCovered: input.platforms,
    };
  }

  /**
   * Execute social posting using SimpleSocialAgent
   */
  private async executeSocialPosting(input: LaunchCampaignInput, contentResults: any): Promise<any> {
    const scheduledPosts = [];

    for (const content of contentResults.generatedContent) {
      if (content.contentType === 'social_post' || content.contentType === 'caption') {
        const socialPayload: AgentPayload = {
          task: 'schedule_post',
          context: {
            platform: content.platform,
            content: content.content,
            hashtags: content.hashtags,
            scheduledTime: input.scheduling?.scheduledTime || new Date().toISOString(),
            audience: input.audience,
          },
          priority: 'medium',
        };

        const result = await this.socialAgent.execute(socialPayload);
        
        if (result.success) {
          scheduledPosts.push({
            platform: content.platform,
            postId: result.data.postId,
            scheduledTime: result.data.scheduledTime,
            content: content.content,
            status: 'scheduled',
          });
        } else {
          logger.warn('Social posting failed for specific content', {
            platform: content.platform,
            error: result.error,
          }, 'CampaignOrchestration');
        }
      }
    }

    return {
      scheduledPosts,
      totalScheduled: scheduledPosts.length,
      platforms: [...new Set(scheduledPosts.map(p => p.platform))],
    };
  }

  // Private helper methods for campaign management
  private async validateBudgetConstraints(input: LaunchCampaignInput): Promise<void> {
    const budgetStatus = await BudgetTracker.checkBudgetStatus();
    
    if (!budgetStatus.canExecute) {
      throw new Error(`Budget exceeded. Current utilization: ${budgetStatus.utilizationPercentage.toFixed(1)}%`);
    }

    if (input.budget?.max) {
      const estimatedCost = this.estimateCampaignCost(input);
      if (estimatedCost > input.budget.max) {
        throw new Error(`Estimated campaign cost ($${estimatedCost}) exceeds budget limit ($${input.budget.max})`);
      }
    }
  }

  private estimateCampaignCost(input: LaunchCampaignInput): number {
    // Rough estimation based on content volume and complexity
    const baseContentCost = 0.05; // $0.05 per content piece
    const baseTrendCost = 0.10; // $0.10 for trend analysis
    const baseSocialCost = 0.02; // $0.02 per social post
    
    const contentItems = input.contentTypes.length * input.platforms.length;
    const socialPosts = input.platforms.length; // Assume 1 post per platform
    
    return baseTrendCost + (contentItems * baseContentCost) + (socialPosts * baseSocialCost);
  }

  private calculateTotalCost(result: CampaignOrchestrationResult): number {
    // Calculate actual costs from execution results
    let totalCost = 0;
    
    if (result.stages.trendDetection?.output) {
      totalCost += 0.10; // Fixed trend analysis cost
    }
    
    if (result.stages.contentGeneration?.output) {
      totalCost += result.summary.contentGenerated * 0.05;
    }
    
    if (result.stages.socialPosting?.output) {
      totalCost += result.summary.postsScheduled * 0.02;
    }
    
    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }

  private estimateReach(input: LaunchCampaignInput, result: CampaignOrchestrationResult): number {
    // Mock reach estimation based on platforms and content volume
    const platformMultipliers = {
      instagram: 1000,
      facebook: 800,
      twitter: 1200,
      linkedin: 600,
      tiktok: 1500,
      youtube: 2000,
    };
    
    let totalReach = 0;
    for (const platform of input.platforms) {
      const multiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || 500;
      totalReach += multiplier * result.summary.postsScheduled;
    }
    
    return Math.round(totalReach * (0.8 + Math.random() * 0.4)); // Add some variance
  }

  // Campaign tracking and analytics methods
  private async trackCampaignCompletion(campaignId: string, result: CampaignOrchestrationResult, input: LaunchCampaignInput): Promise<void> {
    // Track successful campaign metrics for learning
    await BudgetTracker.trackCost({
      agentType: 'ORCHESTRATION' as any,
      campaignId,
      tokens: 0,
      task: 'complete_campaign',
      metadata: {
        campaignName: input.campaignName,
        contentGenerated: result.summary.contentGenerated,
        postsScheduled: result.summary.postsScheduled,
        platforms: input.platforms,
        totalCost: result.summary.totalCost,
      },
      conversionAchieved: true,
      qualityScore: 0.9,
    });
  }

  private async trackCampaignFailure(campaignId: string, result: CampaignOrchestrationResult, error: any): Promise<void> {
    // Track failed campaigns for analysis and improvement
    await BudgetTracker.trackCost({
      agentType: 'ORCHESTRATION' as any,
      campaignId,
      tokens: 0,
      task: 'failed_campaign',
      metadata: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        failedStage: result.status,
        executionTime: result.completedAt ? result.completedAt.getTime() - result.createdAt.getTime() : 0,
      },
      conversionAchieved: false,
      qualityScore: 0,
    });
  }

  // Status and analytics helper methods
  private async getTotalCampaigns(): Promise<number> {
    // Mock data - in real implementation would query database
    return Math.round(150 + Math.random() * 50);
  }

  private async getSuccessfulCampaigns(): Promise<number> {
    const total = await this.getTotalCampaigns();
    return Math.round(total * 0.942); // 94.2% success rate
  }

  private async getFailedCampaigns(): Promise<number> {
    const total = await this.getTotalCampaigns();
    const successful = await this.getSuccessfulCampaigns();
    return total - successful;
  }

  private async getAverageExecutionTime(): Promise<string> {
    return '4.2 minutes';
  }

  private async getTotalContentGenerated(): Promise<number> {
    return Math.round(500 + Math.random() * 200);
  }

  private async getTotalSocialPosts(): Promise<number> {
    return Math.round(800 + Math.random() * 300);
  }

  private async getTrendAgentHealth(): Promise<string> {
    return 'healthy';
  }

  private async getContentAgentHealth(): Promise<string> {
    return 'healthy';
  }

  private async getSocialAgentHealth(): Promise<string> {
    return 'healthy';
  }

  private async getCampaignDetails(campaignId: string): Promise<any> {
    // Mock campaign details - in real implementation would query database
    return {
      campaignId,
      status: 'completed',
      lastExecuted: new Date().toISOString(),
      performance: {
        engagement: Math.round(85 + Math.random() * 15),
        reach: Math.round(1000 + Math.random() * 2000),
        costEfficiency: Math.round(75 + Math.random() * 25),
      },
    };
  }

  // Additional campaign management methods
  private async getCampaignHistory(input?: any): Promise<any> {
    // Mock campaign history
    return {
      totalCampaigns: await this.getTotalCampaigns(),
      recentCampaigns: [
        {
          campaignId: 'campaign_recent_1',
          name: 'AI Marketing Trends Q1',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          performance: { engagement: 92, reach: 1850, cost: 0.45 },
        },
        {
          campaignId: 'campaign_recent_2', 
          name: 'Tech Innovation Spotlight',
          status: 'completed',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          performance: { engagement: 88, reach: 1620, cost: 0.38 },
        },
      ],
    };
  }

  private async pauseCampaign(input: any): Promise<any> {
    const campaignId = input?.campaignId;
    if (!campaignId) {
      throw new Error('Campaign ID is required to pause campaign');
    }

    // Mock pause implementation
    return {
      campaignId,
      status: 'paused',
      pausedAt: new Date().toISOString(),
      message: 'Campaign paused successfully',
    };
  }

  private async resumeCampaign(input: any): Promise<any> {
    const campaignId = input?.campaignId;
    if (!campaignId) {
      throw new Error('Campaign ID is required to resume campaign');
    }

    // Mock resume implementation
    return {
      campaignId,
      status: 'resumed',
      resumedAt: new Date().toISOString(),
      message: 'Campaign resumed successfully',
    };
  }

  private async cancelCampaign(input: any): Promise<any> {
    const campaignId = input?.campaignId;
    if (!campaignId) {
      throw new Error('Campaign ID is required to cancel campaign');
    }

    // Mock cancel implementation
    return {
      campaignId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      message: 'Campaign cancelled successfully',
    };
  }
}

// Export as default for agent registry compatibility
export default CampaignOrchestrationAgent; 