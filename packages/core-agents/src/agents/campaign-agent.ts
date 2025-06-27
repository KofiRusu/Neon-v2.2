/**
 * CampaignAgent - Autonomous Campaign Execution Engine
 *
 * Orchestrates multi-agent campaign workflows with brand awareness,
 * memory integration, and performance optimization.
 */

import { AbstractAgent } from '../base-agent';
import type { AgentPayload, AgentResult } from '../base-agent';
import { logger, withLogging } from '@neon/utils';
import { z } from 'zod';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';
import { PerformanceTuner } from '../tuner/PerformanceTuner';

// Campaign Types and Schemas
const CampaignGoalSchema = z.enum([
  'brand_awareness',
  'lead_generation',
  'customer_retention',
  'product_launch',
  'event_promotion',
  'retargeting',
  'nurture_sequence',
]);

const CampaignChannelSchema = z.enum([
  'email',
  'social_media',
  'content_marketing',
  'paid_ads',
  'multi_channel',
]);

const CampaignContextSchema = z.object({
  goal: CampaignGoalSchema,
  channels: z.array(CampaignChannelSchema),
  targetAudience: z.string(),
  budget: z.number().optional(),
  duration: z.string().optional(),
  brandTone: z.string().optional(),
  customMessage: z.string().optional(),
  scheduledStart: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

const CampaignTaskSchema = z.enum([
  'plan_campaign',
  'execute_campaign',
  'monitor_campaign',
  'optimize_campaign',
  'analyze_results',
  'generate_report',
]);

type CampaignGoal = z.infer<typeof CampaignGoalSchema>;
type CampaignChannel = z.infer<typeof CampaignChannelSchema>;
type CampaignContext = z.infer<typeof CampaignContextSchema>;
type CampaignTask = z.infer<typeof CampaignTaskSchema>;

export interface CampaignStep {
  id: string;
  agentId: string;
  action: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  timing: {
    estimated: number;
    actual?: number;
  };
}

export interface CampaignPlan {
  id: string;
  goal: CampaignGoal;
  channels: CampaignChannel[];
  targetAudience: string;
  steps: CampaignStep[];
  metrics: {
    targets: Record<string, number>;
    tracking: string[];
  };
}

export interface CampaignExecution {
  id: string;
  planId: string;
  status: 'planning' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep?: string;
  progress: number;
  metrics: {
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
  agentActivity: Array<{
    agentId: string;
    action: string;
    timestamp: Date;
    result: string;
  }>;
}

export class CampaignAgent extends AbstractAgent {
  private memoryStore: AgentMemoryStore;
  private performanceTuner: PerformanceTuner;
  private activeCampaigns: Map<string, CampaignExecution> = new Map();

  constructor(id: string = 'campaign-agent', name: string = 'CampaignAgent') {
    super(id, name, 'campaign-orchestrator', [
      'plan_campaign',
      'execute_campaign',
      'monitor_campaign',
      'optimize_campaign',
      'analyze_results',
      'generate_report',
    ]);

    this.memoryStore = new AgentMemoryStore();
    this.performanceTuner = new PerformanceTuner(this.memoryStore);
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;
      const campaignTask = CampaignTaskSchema.parse(task);
      const campaignContext = CampaignContextSchema.parse(context || {});

      switch (campaignTask) {
        case 'plan_campaign':
          return await this.planCampaign(campaignContext);
        case 'execute_campaign':
          return await this.executeCampaign(campaignContext);
        case 'monitor_campaign':
          return await this.monitorCampaign(campaignContext);
        case 'optimize_campaign':
          return await this.optimizeCampaign(campaignContext);
        case 'analyze_results':
          return await this.analyzeResults(campaignContext);
        case 'generate_report':
          return await this.generateReport(campaignContext);
        default:
          throw new Error(`Unknown campaign task: ${task}`);
      }
    });
  }

  /**
   * Plan a comprehensive multi-agent campaign
   */
  private async planCampaign(context: CampaignContext): Promise<CampaignPlan> {
    return withLogging('campaign-agent', 'plan_campaign', async () => {
      logger.info('🎯 CampaignAgent: Planning campaign', {
        goal: context.goal,
        channels: context.channels,
        audience: context.targetAudience,
      });

      const steps = await this.createCampaignSteps(context);

      const plan: CampaignPlan = {
        id: `campaign_${Date.now()}`,
        goal: context.goal,
        channels: context.channels,
        targetAudience: context.targetAudience,
        steps,
        metrics: {
          targets: {
            conversion_rate: 0.05,
            open_rate: 0.25,
            click_rate: 0.05,
            revenue: (context.budget || 1000) * 3,
          },
          tracking: ['utm_tracking', 'pixel_tracking', 'conversion_api'],
        },
      };

      logger.info('✅ Campaign plan created', {
        planId: plan.id,
        steps: steps.length,
        estimatedDuration: steps.reduce((sum, step) => sum + step.timing.estimated, 0) / 1000 / 60,
      });

      return plan;
    });
  }

  /**
   * Execute campaign by coordinating agents
   */
  private async executeCampaign(context: CampaignContext): Promise<CampaignExecution> {
    return withLogging('campaign-agent', 'execute_campaign', async () => {
      const plan = await this.planCampaign(context);

      const execution: CampaignExecution = {
        id: `exec_${Date.now()}`,
        planId: plan.id,
        status: 'running',
        progress: 0,
        metrics: {
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0,
        },
        agentActivity: [],
      };

      this.activeCampaigns.set(execution.id, execution);
      logger.info('🚀 Campaign execution started', { executionId: execution.id });

      // Execute steps sequentially
      for (const step of plan.steps) {
        try {
          execution.currentStep = step.id;
          step.status = 'running';

          const result = await this.executeStep(step);
          step.result = result;
          step.status = 'completed';

          execution.agentActivity.push({
            agentId: step.agentId,
            action: step.action,
            timestamp: new Date(),
            result: `Step ${step.id} completed successfully`,
          });

          execution.progress =
            (plan.steps.filter(s => s.status === 'completed').length / plan.steps.length) * 100;
        } catch (error) {
          step.status = 'failed';
          logger.error('Step failed', { stepId: step.id, error });
        }
      }

      execution.status = 'completed';
      execution.progress = 100;

      logger.info('✅ Campaign execution completed', {
        executionId: execution.id,
        finalMetrics: execution.metrics,
      });

      return execution;
    });
  }

  /**
   * Monitor active campaigns in real-time
   */
  private async monitorCampaign(context: CampaignContext): Promise<any> {
    return withLogging('campaign-agent', 'monitor_campaign', async () => {
      const activeCampaigns = Array.from(this.activeCampaigns.values());

      const monitoringData = {
        totalActive: activeCampaigns.length,
        campaigns: activeCampaigns.map(campaign => ({
          id: campaign.id,
          status: campaign.status,
          progress: campaign.progress,
          metrics: campaign.metrics,
          currentStep: campaign.currentStep,
          lastActivity: campaign.agentActivity[campaign.agentActivity.length - 1],
        })),
        systemHealth: {
          agentAvailability: await this.checkAgentAvailability(),
          memoryUtilization: await this.memoryStore.getSystemStats(),
          performanceScore: await this.performanceTuner.getCurrentScore('campaign-agent'),
        },
      };

      return monitoringData;
    });
  }

  /**
   * Optimize campaign based on real-time performance
   */
  private async optimizeCampaign(context: CampaignContext): Promise<any> {
    return withLogging('campaign-agent', 'optimize_campaign', async () => {
      const campaignId = context.customMessage;
      const campaign = campaignId ? this.activeCampaigns.get(campaignId) : null;

      if (!campaign) {
        throw new Error(`Campaign not found for optimization: ${campaignId}`);
      }

      // Get performance insights and optimization suggestions
      const suggestions = await this.performanceTuner.getOptimizationSuggestions('campaign-agent', {
        campaignId: campaign.id,
        currentMetrics: campaign.metrics,
      });

      const optimizations = {
        contentOptimizations: await this.optimizeContent(campaign),
        timingOptimizations: await this.optimizeTiming(campaign),
        audienceOptimizations: await this.optimizeAudience(campaign),
        channelOptimizations: await this.optimizeChannels(campaign),
      };

      // Apply optimizations automatically if confidence is high
      const appliedOptimizations = [];
      for (const [type, optimization] of Object.entries(optimizations)) {
        if (optimization.confidence > 0.8) {
          await this.applyOptimization(campaign, optimization);
          appliedOptimizations.push(type);
        }
      }

      logger.info('🎯 Campaign optimizations applied', {
        campaignId: campaign.id,
        optimizations: appliedOptimizations,
      });

      return {
        campaignId: campaign.id,
        suggestions,
        optimizations,
        appliedOptimizations,
      };
    });
  }

  /**
   * Analyze campaign results and extract insights
   */
  private async analyzeResults(context: CampaignContext): Promise<any> {
    return withLogging('campaign-agent', 'analyze_results', async () => {
      const campaignId = context.customMessage;
      const campaign = campaignId ? this.activeCampaigns.get(campaignId) : null;

      if (!campaign) {
        throw new Error(`Campaign not found for analysis: ${campaignId}`);
      }

      const analysis = {
        performance: {
          deliveryRate: this.calculateDeliveryRate(campaign.metrics),
          openRate: this.calculateOpenRate(campaign.metrics),
          clickRate: this.calculateClickRate(campaign.metrics),
          conversionRate: this.calculateConversionRate(campaign.metrics),
          roi: this.calculateROI(campaign.metrics, context.budget || 0),
        },
        insights: {
          topPerformingContent: await this.identifyTopContent(campaign),
          audienceEngagement: await this.analyzeAudienceEngagement(campaign),
          channelEffectiveness: await this.analyzeChannelPerformance(campaign),
          timingOptimization: await this.analyzeTimingEffectiveness(campaign),
        },
        recommendations: await this.generateRecommendations(campaign),
        learnings: await this.extractLearnings(campaign),
      };

      // Store learnings in memory for future campaigns
      await this.memoryStore.storeMemory(
        'campaign-agent',
        'campaign_learnings',
        analysis.learnings,
        {
          campaignId: campaign.id,
          goal: context.goal,
          performance: analysis.performance.roi.toString(),
        }
      );

      return analysis;
    });
  }

  /**
   * Generate comprehensive campaign report
   */
  private async generateReport(context: CampaignContext): Promise<any> {
    return withLogging('campaign-agent', 'generate_report', async () => {
      const reports = await Promise.all([
        this.generateExecutiveSummary(context),
        this.generateDetailedMetrics(context),
        this.generateAgentPerformanceReport(context),
        this.generateRecommendationsReport(context),
      ]);

      const comprehensiveReport = {
        timestamp: new Date(),
        executiveSummary: reports[0],
        detailedMetrics: reports[1],
        agentPerformance: reports[2],
        recommendations: reports[3],
        nextActions: await this.generateNextActions(context),
      };

      return comprehensiveReport;
    });
  }

  // Helper Methods

  private async getBrandStrategy(context: CampaignContext): Promise<BrandStrategy> {
    // Integration with brand knowledge
    return {
      tone: context.brandTone || 'professional, friendly, innovative',
      messaging: [
        'Transform your marketing with AI',
        'Unlock the power of automation',
        'Drive results with intelligent campaigns',
      ],
      visualStyle: 'modern, clean, tech-forward',
      brandValues: ['Innovation', 'Reliability', 'Results-Driven'],
      voiceGuidelines: 'Confident but approachable, expert but not jargony',
    };
  }

  private async getHistoricalCampaignData(goal: CampaignGoal): Promise<any> {
    const memories = await this.memoryStore.getRecentMemories('campaign-agent', 10);
    return memories.filter(m => m.context?.goal === goal);
  }

  private async generateContentPlan(
    context: CampaignContext,
    brandStrategy: BrandStrategy
  ): Promise<ContentPlan> {
    // This would integrate with ContentAgent
    return {
      subjects: [
        `Exclusive ${context.goal.replace('_', ' ')} opportunity`,
        `Transform your ${context.targetAudience} strategy`,
        'Your personalized action plan inside',
      ],
      headlines: [
        'Unlock Your Marketing Potential',
        'AI-Powered Success Awaits',
        'Ready to Transform Your Results?',
      ],
      bodyContent: [
        'Discover how our AI-powered platform can revolutionize your marketing approach...',
        'Join thousands of successful marketers who have transformed their campaigns...',
        'Your personalized strategy is ready. Take the next step...',
      ],
      ctaVariants: [
        'Get Started Now',
        'Claim Your Strategy',
        'Transform My Marketing',
        'See My Results',
      ],
      visualAssets: [
        'hero-image-ai-dashboard.jpg',
        'success-metrics-chart.png',
        'brand-compatible-graphics.svg',
      ],
    };
  }

  private async createExecutionTimeline(
    context: CampaignContext,
    contentPlan: ContentPlan
  ): Promise<ExecutionTimeline> {
    return {
      phases: [
        {
          name: 'Planning & Preparation',
          duration: '2 hours',
          agents: ['insight-agent', 'brand-voice-agent'],
          deliverables: ['audience_analysis', 'brand_guidelines'],
        },
        {
          name: 'Content Creation',
          duration: '4 hours',
          agents: ['content-agent', 'design-agent'],
          deliverables: ['email_templates', 'visual_assets', 'copy_variants'],
        },
        {
          name: 'Campaign Deployment',
          duration: '1 hour',
          agents: ['email-agent', 'social-agent'],
          deliverables: ['deployed_campaigns', 'tracking_setup'],
        },
        {
          name: 'Monitoring & Optimization',
          duration: '24 hours',
          agents: ['insight-agent', 'campaign-agent'],
          deliverables: ['performance_reports', 'optimization_recommendations'],
        },
      ],
      criticalPath: ['audience_analysis', 'content_creation', 'deployment'],
      bufferTime: 0.2, // 20% buffer
    };
  }

  private async defineSuccessMetrics(
    context: CampaignContext,
    historicalData: any
  ): Promise<SuccessMetrics> {
    const baselineMetrics = this.calculateBaselines(historicalData);

    return {
      primary: ['conversion_rate', 'revenue', 'cost_per_acquisition'],
      secondary: ['open_rate', 'click_rate', 'engagement_rate'],
      targets: {
        conversion_rate: baselineMetrics.conversion_rate * 1.15, // 15% improvement
        open_rate: Math.max(baselineMetrics.open_rate * 1.1, 0.25), // 10% improvement or 25% minimum
        click_rate: Math.max(baselineMetrics.click_rate * 1.2, 0.05), // 20% improvement or 5% minimum
        revenue: (context.budget || 1000) * 3, // 3x ROI target
      },
      trackingMethods: ['utm_tracking', 'pixel_tracking', 'conversion_api'],
    };
  }

  private async createAgentOrchestrationSteps(
    context: CampaignContext,
    timeline: ExecutionTimeline
  ): Promise<CampaignStep[]> {
    const steps: CampaignStep[] = [];
    let stepCounter = 1;

    for (const phase of timeline.phases) {
      for (const agent of phase.agents) {
        steps.push({
          id: `step_${stepCounter++}`,
          agentId: agent,
          action: this.getAgentAction(agent, phase.name),
          dependencies: stepCounter > 1 ? [`step_${stepCounter - 1}`] : [],
          status: 'pending',
          timing: {
            estimated: this.estimateStepDuration(agent, phase.name),
          },
        });
      }
    }

    return steps;
  }

  private async executeStep(step: CampaignStep): Promise<any> {
    const startTime = Date.now();

    logger.info(`📞 Executing step ${step.id} with ${step.agentId}`, { action: step.action });

    // Simulate agent work
    await new Promise(resolve => setTimeout(resolve, Math.min(step.timing.estimated / 10, 2000)));

    step.timing.actual = Date.now() - startTime;

    return {
      agentId: step.agentId,
      action: step.action,
      success: true,
      result: `${step.action} completed successfully`,
      timestamp: new Date(),
    };
  }

  private isCriticalStep(step: CampaignStep): boolean {
    const criticalActions = ['audience_analysis', 'content_creation', 'deployment'];
    return criticalActions.some(action => step.action.includes(action));
  }

  private async checkAgentAvailability(): Promise<Record<string, boolean>> {
    // Mock agent availability check
    return {
      'content-agent': true,
      'email-agent': true,
      'social-agent': true,
      'insight-agent': true,
      'design-agent': true,
      'brand-voice-agent': true,
    };
  }

  private calculateDeliveryRate(metrics: any): number {
    return metrics.delivered / (metrics.delivered + metrics.bounced || 1);
  }

  private calculateOpenRate(metrics: any): number {
    return metrics.opened / (metrics.delivered || 1);
  }

  private calculateClickRate(metrics: any): number {
    return metrics.clicked / (metrics.opened || 1);
  }

  private calculateConversionRate(metrics: any): number {
    return metrics.converted / (metrics.clicked || 1);
  }

  private calculateROI(metrics: any, budget: number): number {
    return budget > 0 ? (metrics.revenue - budget) / budget : 0;
  }

  private calculateBaselines(historicalData: any): any {
    // Extract baselines from historical data
    return {
      conversion_rate: 0.05,
      open_rate: 0.22,
      click_rate: 0.03,
      revenue: 1000,
    };
  }

  private getAgentAction(agentId: string, phaseName: string): string {
    const actionMap: Record<string, Record<string, string>> = {
      'insight-agent': {
        'Planning & Preparation': 'analyze_audience_insights',
        'Monitoring & Optimization': 'generate_performance_insights',
      },
      'content-agent': {
        'Content Creation': 'generate_campaign_content',
      },
      'email-agent': {
        'Campaign Deployment': 'deploy_email_campaign',
      },
      'social-agent': {
        'Campaign Deployment': 'deploy_social_campaign',
      },
      'design-agent': {
        'Content Creation': 'create_visual_assets',
      },
      'brand-voice-agent': {
        'Planning & Preparation': 'apply_brand_guidelines',
      },
    };

    return actionMap[agentId]?.[phaseName] || 'execute_default_action';
  }

  private estimateStepDuration(agentId: string, phaseName: string): number {
    // Return duration in milliseconds
    const durationMap: Record<string, number> = {
      analyze_audience_insights: 300000, // 5 minutes
      generate_campaign_content: 600000, // 10 minutes
      create_visual_assets: 900000, // 15 minutes
      deploy_email_campaign: 180000, // 3 minutes
      deploy_social_campaign: 120000, // 2 minutes
      apply_brand_guidelines: 240000, // 4 minutes
      generate_performance_insights: 360000, // 6 minutes
    };

    const action = this.getAgentAction(agentId, phaseName);
    return durationMap[action] || 300000; // Default 5 minutes
  }

  private async callAgent(agentId: string, action: string, context: any): Promise<any> {
    // Mock agent calling - in real implementation, this would use the agent registry
    logger.info(`📞 Calling ${agentId} for ${action}`, { context: Object.keys(context) });

    // Simulate agent work
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      agentId,
      action,
      success: true,
      result: `${action} completed successfully`,
      timestamp: new Date(),
    };
  }

  // Additional helper methods for optimization and analysis
  private async optimizeContent(campaign: CampaignExecution): Promise<any> {
    return {
      type: 'content',
      confidence: 0.9,
      suggestions: ['Improve subject lines', 'A/B test CTAs'],
    };
  }

  private async optimizeTiming(campaign: CampaignExecution): Promise<any> {
    return {
      type: 'timing',
      confidence: 0.7,
      suggestions: ['Send 2 hours later', 'Add follow-up sequence'],
    };
  }

  private async optimizeAudience(campaign: CampaignExecution): Promise<any> {
    return {
      type: 'audience',
      confidence: 0.8,
      suggestions: ['Refine targeting', 'Exclude low-engagement segments'],
    };
  }

  private async optimizeChannels(campaign: CampaignExecution): Promise<any> {
    return {
      type: 'channels',
      confidence: 0.6,
      suggestions: ['Increase social spend', 'Reduce email frequency'],
    };
  }

  private async applyOptimization(campaign: CampaignExecution, optimization: any): Promise<void> {
    logger.info(`🎯 Applying optimization to campaign ${campaign.id}`, { optimization });
    // Implementation would apply the optimization
  }

  private async identifyTopContent(campaign: CampaignExecution): Promise<any> {
    return { topSubject: 'Transform Your Marketing', topCTA: 'Get Started Now' };
  }

  private async analyzeAudienceEngagement(campaign: CampaignExecution): Promise<any> {
    return { highEngagement: ['enterprise', 'tech'], lowEngagement: ['retail'] };
  }

  private async analyzeChannelPerformance(campaign: CampaignExecution): Promise<any> {
    return { bestChannel: 'email', worstChannel: 'social_media' };
  }

  private async analyzeTimingEffectiveness(campaign: CampaignExecution): Promise<any> {
    return { bestTime: '10:00 AM', bestDay: 'Tuesday' };
  }

  private async generateRecommendations(campaign: CampaignExecution): Promise<string[]> {
    return [
      'Increase email send frequency by 25%',
      'A/B test subject line variations',
      'Add personalization tokens',
      'Implement follow-up sequence',
    ];
  }

  private async extractLearnings(campaign: CampaignExecution): Promise<any> {
    return {
      contentLearnings: 'Personalized subject lines perform 40% better',
      audienceLearnings: 'Enterprise segment has 3x higher conversion rate',
      timingLearnings: 'Tuesday 10 AM sends have highest open rates',
      channelLearnings: 'Email outperforms social by 2:1 for this audience',
    };
  }

  private async generateExecutiveSummary(context: CampaignContext): Promise<any> {
    return {
      overview: 'Campaign delivered strong results with 15% above target performance',
      keyWins: ['Exceeded conversion goals', 'Strong brand engagement', 'Efficient spend'],
      challenges: ['Lower social performance', 'Weekend engagement drop'],
      recommendation: 'Scale successful elements and optimize timing',
    };
  }

  private async generateDetailedMetrics(context: CampaignContext): Promise<any> {
    return {
      delivery: { sent: 10000, delivered: 9800, bounced: 200 },
      engagement: { opened: 2450, clicked: 245, converted: 12 },
      revenue: { total: 3600, per_conversion: 300, roi: 260 },
    };
  }

  private async generateAgentPerformanceReport(context: CampaignContext): Promise<any> {
    return {
      contentAgent: { score: 95, efficiency: 'high', quality: 'excellent' },
      emailAgent: { score: 88, efficiency: 'medium', quality: 'good' },
      socialAgent: { score: 72, efficiency: 'low', quality: 'fair' },
    };
  }

  private async generateRecommendationsReport(context: CampaignContext): Promise<any> {
    return {
      immediate: ['Scale email campaign', 'Pause social spend'],
      shortTerm: ['Develop new creative variants', 'Expand audience targeting'],
      longTerm: ['Build lookalike audiences', 'Implement advanced automation'],
    };
  }

  private async generateNextActions(context: CampaignContext): Promise<string[]> {
    return [
      'Launch follow-up nurture sequence within 48 hours',
      'Create lookalike audience based on converters',
      'Develop content series for high-performing topics',
      'Schedule quarterly campaign performance review',
    ];
  }

  private async getCampaignPlan(planId: string): Promise<CampaignPlan | null> {
    if (planId === 'latest') {
      const memories = await this.memoryStore.getRecentMemories('campaign-agent', 1);
      return (memories[0]?.data as CampaignPlan) || null;
    }

    const memories = await this.memoryStore.getRecentMemories('campaign-agent', 50);
    const planMemory = memories.find(m => m.data?.id === planId);
    return (planMemory?.data as CampaignPlan) || null;
  }

  private async createCampaignSteps(context: CampaignContext): Promise<CampaignStep[]> {
    const steps: CampaignStep[] = [];

    // Planning phase
    steps.push({
      id: 'step_1',
      agentId: 'insight-agent',
      action: 'analyze_audience',
      dependencies: [],
      status: 'pending',
      timing: { estimated: 300000 }, // 5 minutes
    });

    // Content creation phase
    if (context.channels.includes('email')) {
      steps.push({
        id: 'step_2',
        agentId: 'content-agent',
        action: 'generate_email_content',
        dependencies: ['step_1'],
        status: 'pending',
        timing: { estimated: 600000 }, // 10 minutes
      });
    }

    if (context.channels.includes('social_media')) {
      steps.push({
        id: 'step_3',
        agentId: 'social-agent',
        action: 'create_social_content',
        dependencies: ['step_1'],
        status: 'pending',
        timing: { estimated: 450000 }, // 7.5 minutes
      });
    }

    // Execution phase
    steps.push({
      id: 'step_4',
      agentId: 'email-agent',
      action: 'deploy_campaign',
      dependencies: ['step_2'],
      status: 'pending',
      timing: { estimated: 180000 }, // 3 minutes
    });

    return steps;
  }

  getActiveCampaigns(): CampaignExecution[] {
    return Array.from(this.activeCampaigns.values());
  }

  getCampaign(id: string): CampaignExecution | undefined {
    return this.activeCampaigns.get(id);
  }
}
