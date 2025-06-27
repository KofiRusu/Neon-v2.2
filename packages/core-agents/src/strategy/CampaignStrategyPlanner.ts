import { AgentMemoryStore, MemoryMetrics } from '../memory/AgentMemoryStore';
import { PerformanceTuner } from '../tuner/PerformanceTuner';

export interface CampaignGoal {
  type:
    | 'product_launch'
    | 'seasonal_promo'
    | 'retargeting'
    | 'b2b_outreach'
    | 'brand_awareness'
    | 'lead_generation';
  objective: string;
  kpis: Array<{
    metric: 'conversions' | 'engagement' | 'reach' | 'leads' | 'sales' | 'brand_mentions';
    target: number;
    timeframe: string;
  }>;
  budget?: {
    total: number;
    allocation: Record<string, number>; // channel -> percentage
  };
}

export interface CampaignAudience {
  segment: 'enterprise' | 'smb' | 'agencies' | 'ecommerce' | 'saas' | 'consumer';
  demographics: {
    ageRange: string;
    interests: string[];
    painPoints: string[];
    channels: string[];
  };
  persona: {
    name: string;
    description: string;
    motivations: string[];
    objections: string[];
  };
}

export interface CampaignContext {
  product?: {
    name: string;
    category: string;
    features: string[];
    pricing: string;
    launchDate?: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    keyMilestones?: Array<{
      date: string;
      event: string;
    }>;
  };
  channels: Array<'email' | 'social' | 'ads' | 'content' | 'seo' | 'outreach' | 'whatsapp'>;
  constraints?: {
    budgetLimits: Record<string, number>;
    brandGuidelines: string[];
    complianceRequirements: string[];
  };
}

export interface AgentAction {
  id: string;
  agent: string;
  action: string;
  prompt: string;
  config: Record<string, any>;
  dependsOn: string[];
  estimatedDuration: number; // minutes
  priority: 'high' | 'medium' | 'low';
  stage: string;
  outputs: string[];
  brandScore?: number;
  performanceScore?: number;
  metadata?: Record<string, any>;
}

export interface CampaignStrategy {
  id: string;
  name: string;
  goal: CampaignGoal;
  audience: CampaignAudience;
  context: CampaignContext;
  actions: AgentAction[];
  timeline: Array<{
    stage: string;
    actions: string[];
    startDate: string;
    endDate: string;
  }>;
  estimatedCost: number;
  estimatedDuration: number;
  brandAlignment: number;
  successProbability: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface StrategyGenerationOptions {
  useMemoryOptimization: boolean;
  brandComplianceLevel: 'strict' | 'moderate' | 'flexible';
  agentSelectionCriteria: 'performance' | 'cost' | 'balanced';
  maxActions: number;
  timelineFlexibility: 'rigid' | 'flexible' | 'adaptive';
}

export class CampaignStrategyPlanner {
  private memoryStore: AgentMemoryStore;
  private performanceTuner: PerformanceTuner;
  private agentCapabilities: Record<string, string[]>;

  constructor(memoryStore: AgentMemoryStore, performanceTuner?: PerformanceTuner) {
    this.memoryStore = memoryStore;
    this.performanceTuner = performanceTuner || new PerformanceTuner(memoryStore);
    this.agentCapabilities = this.initializeAgentCapabilities();
  }

  /**
   * Generate a comprehensive campaign strategy
   */
  async generateStrategy(
    goal: CampaignGoal,
    audience: CampaignAudience,
    context: CampaignContext,
    options: Partial<StrategyGenerationOptions> = {}
  ): Promise<CampaignStrategy> {
    const opts: StrategyGenerationOptions = {
      useMemoryOptimization: true,
      brandComplianceLevel: 'moderate',
      agentSelectionCriteria: 'balanced',
      maxActions: 20,
      timelineFlexibility: 'flexible',
      ...options,
    };

    // Step 1: Analyze agent performance data
    const agentPerformance = await this.analyzeAgentPerformance(goal.type, audience.segment);

    // Step 2: Select optimal agents based on performance and context
    const selectedAgents = await this.selectOptimalAgents(
      goal,
      audience,
      context,
      agentPerformance,
      opts
    );

    // Step 3: Generate action sequence
    const actions = await this.generateActionSequence(
      goal,
      audience,
      context,
      selectedAgents,
      opts
    );

    // Step 4: Optimize timeline and dependencies
    const optimizedActions = await this.optimizeActionSequence(actions, context.timeline);

    // Step 5: Calculate strategy metrics
    const metrics = await this.calculateStrategyMetrics(optimizedActions, goal, context);

    // Step 6: Build complete strategy
    const strategy: CampaignStrategy = {
      id: `strategy-${Date.now()}`,
      name: this.generateStrategyName(goal, context),
      goal,
      audience,
      context,
      actions: optimizedActions,
      timeline: this.generateTimeline(optimizedActions, context.timeline),
      estimatedCost: metrics.estimatedCost,
      estimatedDuration: metrics.estimatedDuration,
      brandAlignment: metrics.brandAlignment,
      successProbability: metrics.successProbability,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    return strategy;
  }

  /**
   * Analyze historical agent performance for similar campaigns
   */
  private async analyzeAgentPerformance(
    campaignType: string,
    audienceSegment: string
  ): Promise<Record<string, MemoryMetrics>> {
    try {
      const allMetrics = await this.memoryStore.getAllAgentMetrics(90); // 90 days

      // Filter and score agents based on campaign type and audience
      const scoredMetrics: Record<string, MemoryMetrics & { campaignScore: number }> = {};

      for (const [agentId, metrics] of Object.entries(allMetrics)) {
        const campaignScore = this.calculateCampaignSpecificScore(
          agentId,
          metrics,
          campaignType,
          audienceSegment
        );

        scoredMetrics[agentId] = {
          ...metrics,
          campaignScore,
        };
      }

      return scoredMetrics;
    } catch (error) {
      console.warn('Failed to analyze agent performance, using defaults:', error);
      return {};
    }
  }

  /**
   * Calculate campaign-specific performance score for an agent
   */
  private calculateCampaignSpecificScore(
    agentId: string,
    metrics: MemoryMetrics,
    campaignType: string,
    audienceSegment: string
  ): number {
    let score = metrics.successRate;

    // Boost score for agents that work well with specific campaign types
    const campaignBoosts: Record<string, Record<string, number>> = {
      product_launch: {
        'content-agent': 15,
        'social-agent': 10,
        'email-agent': 10,
        'trend-agent': 20,
      },
      seasonal_promo: {
        'ad-agent': 20,
        'social-agent': 15,
        'email-agent': 15,
        'design-agent': 10,
      },
      b2b_outreach: {
        'outreach-agent': 25,
        'email-agent': 15,
        'content-agent': 10,
        'insight-agent': 10,
      },
      retargeting: {
        'ad-agent': 25,
        'insight-agent': 15,
        'email-agent': 10,
      },
    };

    const campaignBoost = campaignBoosts[campaignType]?.[agentId] || 0;
    score += campaignBoost;

    // Apply audience segment multipliers
    const audienceMultipliers: Record<string, Record<string, number>> = {
      enterprise: {
        'outreach-agent': 1.2,
        'content-agent': 1.1,
        'email-agent': 1.1,
      },
      consumer: {
        'social-agent': 1.3,
        'trend-agent': 1.2,
        'design-agent': 1.1,
      },
    };

    const multiplier = audienceMultipliers[audienceSegment]?.[agentId] || 1.0;
    score *= multiplier;

    // Penalize for high costs or slow performance
    if (metrics.averageCost > 0.1) score *= 0.9;
    if (metrics.averageExecutionTime > 10000) score *= 0.95;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Select optimal agents based on performance and context
   */
  private async selectOptimalAgents(
    goal: CampaignGoal,
    audience: CampaignAudience,
    context: CampaignContext,
    agentPerformance: Record<string, any>,
    options: StrategyGenerationOptions
  ): Promise<string[]> {
    const requiredAgents = this.getRequiredAgentsForCampaign(goal.type, context.channels);
    const optionalAgents = this.getOptionalAgentsForCampaign(goal.type, audience.segment);

    // Score all agents
    const agentScores: Array<{ agentId: string; score: number }> = [];

    [...requiredAgents, ...optionalAgents].forEach(agentId => {
      const performance = agentPerformance[agentId];
      let score = performance?.campaignScore || 50;

      // Apply selection criteria
      if (options.agentSelectionCriteria === 'performance') {
        score *= 1.2;
      } else if (options.agentSelectionCriteria === 'cost') {
        const avgCost = performance?.averageCost || 0.05;
        score *= 0.1 / Math.max(avgCost, 0.01); // Favor lower cost
      }

      agentScores.push({ agentId, score });
    });

    // Sort by score and select top agents
    agentScores.sort((a, b) => b.score - a.score);

    const selectedAgents = [
      ...requiredAgents, // Always include required agents
      ...agentScores
        .filter(a => !requiredAgents.includes(a.agentId))
        .slice(0, Math.max(0, options.maxActions - requiredAgents.length))
        .map(a => a.agentId),
    ];

    return [...new Set(selectedAgents)]; // Remove duplicates
  }

  /**
   * Get required agents for specific campaign types
   */
  private getRequiredAgentsForCampaign(campaignType: string, channels: string[]): string[] {
    const baseRequirements: Record<string, string[]> = {
      product_launch: ['content-agent', 'brand-voice-agent'],
      seasonal_promo: ['ad-agent', 'social-agent'],
      b2b_outreach: ['outreach-agent', 'email-agent'],
      retargeting: ['ad-agent', 'insight-agent'],
      brand_awareness: ['content-agent', 'social-agent', 'brand-voice-agent'],
      lead_generation: ['content-agent', 'email-agent', 'seo-agent'],
    };

    const channelRequirements: Record<string, string> = {
      email: 'email-agent',
      social: 'social-agent',
      ads: 'ad-agent',
      content: 'content-agent',
      seo: 'seo-agent',
      outreach: 'outreach-agent',
      whatsapp: 'support-agent',
    };

    const required = baseRequirements[campaignType] || ['content-agent'];
    const channelAgents = channels.map(channel => channelRequirements[channel]).filter(Boolean);

    return [...new Set([...required, ...channelAgents])];
  }

  /**
   * Get optional agents that could enhance the campaign
   */
  private getOptionalAgentsForCampaign(campaignType: string, audienceSegment: string): string[] {
    const optional: Record<string, string[]> = {
      product_launch: ['trend-agent', 'design-agent', 'insight-agent'],
      seasonal_promo: ['trend-agent', 'email-agent', 'content-agent'],
      b2b_outreach: ['content-agent', 'insight-agent', 'brand-voice-agent'],
      retargeting: ['content-agent', 'email-agent', 'social-agent'],
      brand_awareness: ['trend-agent', 'insight-agent', 'design-agent'],
      lead_generation: ['ad-agent', 'social-agent', 'trend-agent'],
    };

    return optional[campaignType] || [];
  }

  /**
   * Generate action sequence with dependencies
   */
  private async generateActionSequence(
    goal: CampaignGoal,
    audience: CampaignAudience,
    context: CampaignContext,
    selectedAgents: string[],
    options: StrategyGenerationOptions
  ): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    let actionCounter = 0;

    // Stage 1: Research and Analysis
    if (selectedAgents.includes('trend-agent')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'trend-agent',
          'market-analysis',
          'Research Phase',
          `Analyze market trends and opportunities for ${goal.objective} targeting ${audience.persona.name}`,
          {},
          [],
          30,
          'high'
        )
      );
    }

    if (selectedAgents.includes('insight-agent')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'insight-agent',
          'audience-analysis',
          'Research Phase',
          `Analyze audience behavior and preferences for ${audience.segment} segment`,
          { audienceSegment: audience.segment },
          selectedAgents.includes('trend-agent') ? [`action-1`] : [],
          25,
          'high'
        )
      );
    }

    // Stage 2: Content Strategy and Creation
    if (selectedAgents.includes('brand-voice-agent')) {
      const dependencies = actions.length > 0 ? [`action-${actions.length}`] : [];
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'brand-voice-agent',
          'brand-alignment',
          'Strategy Phase',
          `Ensure campaign messaging aligns with brand voice for ${audience.segment} audience`,
          {
            audienceSegment: audience.segment,
            campaignType: goal.type,
            brandComplianceLevel: options.brandComplianceLevel,
          },
          dependencies,
          20,
          'high'
        )
      );
    }

    if (selectedAgents.includes('content-agent')) {
      const dependencies = [];
      if (selectedAgents.includes('trend-agent')) dependencies.push('action-1');
      if (selectedAgents.includes('brand-voice-agent'))
        dependencies.push(`action-${actions.length}`);

      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'content-agent',
          'content-creation',
          'Content Phase',
          `Create compelling content for ${goal.objective} targeting ${audience.persona.name}`,
          {
            contentTypes: this.getContentTypesForChannels(context.channels),
            audiencePersona: audience.persona,
            campaignGoal: goal.objective,
          },
          dependencies,
          45,
          'high'
        )
      );
    }

    // Stage 3: Channel-Specific Execution
    if (selectedAgents.includes('seo-agent') && context.channels.includes('seo')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'seo-agent',
          'seo-optimization',
          'Optimization Phase',
          `Optimize content for search engines with focus on ${goal.type} keywords`,
          { targetKeywords: this.generateKeywords(goal, context.product) },
          selectedAgents.includes('content-agent')
            ? [`action-${actions.findIndex(a => a.agent === 'content-agent') + 1}`]
            : [],
          35,
          'medium'
        )
      );
    }

    if (selectedAgents.includes('social-agent') && context.channels.includes('social')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'social-agent',
          'social-campaign',
          'Execution Phase',
          `Create and schedule social media campaign for ${audience.segment} audience`,
          {
            platforms: audience.demographics.channels.filter(c =>
              ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'].includes(c)
            ),
            campaignDuration: this.calculateDaysBetween(
              context.timeline.startDate,
              context.timeline.endDate
            ),
          },
          selectedAgents.includes('content-agent')
            ? [`action-${actions.findIndex(a => a.agent === 'content-agent') + 1}`]
            : [],
          40,
          'high'
        )
      );
    }

    if (selectedAgents.includes('email-agent') && context.channels.includes('email')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'email-agent',
          'email-sequence',
          'Execution Phase',
          `Design email marketing sequence for ${goal.objective}`,
          {
            sequenceType: this.getEmailSequenceType(goal.type),
            audienceSegment: audience.segment,
            timeline: context.timeline,
          },
          selectedAgents.includes('content-agent')
            ? [`action-${actions.findIndex(a => a.agent === 'content-agent') + 1}`]
            : [],
          35,
          'medium'
        )
      );
    }

    if (selectedAgents.includes('ad-agent') && context.channels.includes('ads')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'ad-agent',
          'paid-advertising',
          'Execution Phase',
          `Create and optimize paid advertising campaigns for ${goal.objective}`,
          {
            budget: goal.budget?.allocation?.ads || goal.budget?.total || 1000,
            targetAudience: audience.demographics,
            platforms: ['google', 'facebook', 'linkedin'],
          },
          selectedAgents.includes('content-agent')
            ? [`action-${actions.findIndex(a => a.agent === 'content-agent') + 1}`]
            : [],
          50,
          'high'
        )
      );
    }

    if (selectedAgents.includes('outreach-agent') && context.channels.includes('outreach')) {
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'outreach-agent',
          'b2b-outreach',
          'Execution Phase',
          `Execute B2B outreach campaign for ${goal.objective}`,
          {
            outreachType: goal.type === 'b2b_outreach' ? 'cold' : 'warm',
            targetCompanies: audience.demographics.interests,
            personalizedMessaging: true,
          },
          selectedAgents.includes('content-agent')
            ? [`action-${actions.findIndex(a => a.agent === 'content-agent') + 1}`]
            : [],
          60,
          'medium'
        )
      );
    }

    // Stage 4: Design and Creative
    if (selectedAgents.includes('design-agent')) {
      const contentDependency = actions.find(a => a.agent === 'content-agent');
      actions.push(
        this.createAgentAction(
          ++actionCounter,
          'design-agent',
          'creative-assets',
          'Creative Phase',
          `Design visual assets and creative materials for ${goal.objective}`,
          {
            assetTypes: ['social-graphics', 'ad-banners', 'email-headers'],
            brandGuidelines: context.constraints?.brandGuidelines || [],
            campaignTheme: goal.type,
          },
          contentDependency ? [contentDependency.id] : [],
          55,
          'medium'
        )
      );
    }

    return actions;
  }

  /**
   * Create a standardized agent action
   */
  private createAgentAction(
    counter: number,
    agent: string,
    action: string,
    stage: string,
    prompt: string,
    config: Record<string, any>,
    dependencies: string[],
    estimatedDuration: number,
    priority: 'high' | 'medium' | 'low'
  ): AgentAction {
    return {
      id: `action-${counter}`,
      agent,
      action,
      prompt,
      config,
      dependsOn: dependencies,
      estimatedDuration,
      priority,
      stage,
      outputs: this.getExpectedOutputs(agent, action),
    };
  }

  /**
   * Get expected outputs for an agent action
   */
  private getExpectedOutputs(agent: string, action: string): string[] {
    const outputMap: Record<string, Record<string, string[]>> = {
      'trend-agent': {
        'market-analysis': ['trend-report', 'opportunity-insights', 'competitor-analysis'],
      },
      'content-agent': {
        'content-creation': ['blog-posts', 'social-content', 'email-copy', 'ad-copy'],
      },
      'brand-voice-agent': {
        'brand-alignment': ['brand-guidelines', 'voice-recommendations', 'compliance-check'],
      },
      'social-agent': {
        'social-campaign': ['post-schedule', 'content-calendar', 'engagement-strategy'],
      },
      'email-agent': {
        'email-sequence': ['email-templates', 'automation-flow', 'subject-lines'],
      },
      'ad-agent': {
        'paid-advertising': ['ad-campaigns', 'targeting-config', 'budget-allocation'],
      },
      'seo-agent': {
        'seo-optimization': ['optimized-content', 'keyword-strategy', 'meta-tags'],
      },
      'design-agent': {
        'creative-assets': ['graphics', 'banners', 'brand-assets'],
      },
      'outreach-agent': {
        'b2b-outreach': ['prospect-list', 'outreach-templates', 'follow-up-sequences'],
      },
      'insight-agent': {
        'audience-analysis': ['audience-insights', 'behavior-analysis', 'recommendations'],
      },
    };

    return outputMap[agent]?.[action] || ['output'];
  }

  /**
   * Optimize action sequence for timeline and dependencies
   */
  private async optimizeActionSequence(
    actions: AgentAction[],
    timeline: any
  ): Promise<AgentAction[]> {
    // Add performance scores based on memory data
    const optimizedActions = await Promise.all(
      actions.map(async action => {
        try {
          const metrics = await this.memoryStore.getAgentMetrics(action.agent, 30);
          const performanceProfile = await this.performanceTuner.analyzeAgent(action.agent, 30);

          return {
            ...action,
            performanceScore: performanceProfile.healthScore,
            brandScore: Math.min(100, performanceProfile.healthScore + 10), // Assume brand alignment close to performance
          };
        } catch (error) {
          return {
            ...action,
            performanceScore: 75, // Default score
            brandScore: 80,
          };
        }
      })
    );

    // Sort actions by stage and priority
    const stageOrder = [
      'Research Phase',
      'Strategy Phase',
      'Content Phase',
      'Optimization Phase',
      'Creative Phase',
      'Execution Phase',
    ];
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    optimizedActions.sort((a, b) => {
      const stageComparison = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
      if (stageComparison !== 0) return stageComparison;

      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return optimizedActions;
  }

  /**
   * Calculate strategy metrics
   */
  private async calculateStrategyMetrics(
    actions: AgentAction[],
    goal: CampaignGoal,
    context: CampaignContext
  ): Promise<{
    estimatedCost: number;
    estimatedDuration: number;
    brandAlignment: number;
    successProbability: number;
  }> {
    const estimatedCost = actions.reduce((total, action) => {
      const baseCost = this.getBaseCostForAction(action.agent, action.action);
      return total + baseCost;
    }, 0);

    const estimatedDuration = Math.max(...this.calculateParallelDuration(actions));

    const brandAlignment =
      actions.reduce((sum, action) => sum + (action.brandScore || 80), 0) / actions.length;

    const avgPerformanceScore =
      actions.reduce((sum, action) => sum + (action.performanceScore || 75), 0) / actions.length;
    const successProbability = Math.min(95, avgPerformanceScore * 0.8 + brandAlignment * 0.2);

    return {
      estimatedCost,
      estimatedDuration,
      brandAlignment,
      successProbability,
    };
  }

  /**
   * Generate timeline with stages
   */
  private generateTimeline(
    actions: AgentAction[],
    timelineContext: any
  ): Array<{
    stage: string;
    actions: string[];
    startDate: string;
    endDate: string;
  }> {
    const stages = [...new Set(actions.map(a => a.stage))];
    const timeline = [];

    const startDate = new Date(timelineContext.startDate);
    const totalDays = this.calculateDaysBetween(timelineContext.startDate, timelineContext.endDate);
    const daysPerStage = Math.floor(totalDays / stages.length);

    stages.forEach((stage, index) => {
      const stageStartDate = new Date(startDate);
      stageStartDate.setDate(startDate.getDate() + index * daysPerStage);

      const stageEndDate = new Date(stageStartDate);
      stageEndDate.setDate(stageStartDate.getDate() + daysPerStage - 1);

      timeline.push({
        stage,
        actions: actions.filter(a => a.stage === stage).map(a => a.id),
        startDate: stageStartDate.toISOString().split('T')[0],
        endDate: stageEndDate.toISOString().split('T')[0],
      });
    });

    return timeline;
  }

  // Helper methods
  private initializeAgentCapabilities(): Record<string, string[]> {
    return {
      'content-agent': ['content-creation', 'copywriting', 'storytelling'],
      'seo-agent': ['keyword-research', 'content-optimization', 'technical-seo'],
      'email-agent': ['email-sequences', 'automation', 'personalization'],
      'social-agent': ['social-posting', 'community-management', 'social-advertising'],
      'ad-agent': ['paid-advertising', 'campaign-optimization', 'audience-targeting'],
      'outreach-agent': ['b2b-outreach', 'lead-generation', 'relationship-building'],
      'trend-agent': ['trend-analysis', 'market-research', 'opportunity-identification'],
      'insight-agent': ['data-analysis', 'audience-insights', 'performance-tracking'],
      'design-agent': ['visual-design', 'brand-assets', 'creative-development'],
      'brand-voice-agent': ['brand-compliance', 'voice-consistency', 'messaging-alignment'],
      'support-agent': ['customer-communication', 'issue-resolution', 'relationship-management'],
    };
  }

  private generateStrategyName(goal: CampaignGoal, context: CampaignContext): string {
    const typeNames = {
      product_launch: 'Product Launch',
      seasonal_promo: 'Seasonal Promotion',
      retargeting: 'Retargeting Campaign',
      b2b_outreach: 'B2B Outreach',
      brand_awareness: 'Brand Awareness',
      lead_generation: 'Lead Generation',
    };

    const productName = context.product?.name || 'Campaign';
    const typeName = typeNames[goal.type] || 'Marketing Campaign';

    return `${productName} ${typeName}`;
  }

  private getContentTypesForChannels(channels: string[]): string[] {
    const channelContent: Record<string, string[]> = {
      email: ['email-templates', 'newsletters', 'sequences'],
      social: ['posts', 'stories', 'carousels', 'videos'],
      content: ['blog-posts', 'articles', 'whitepapers'],
      ads: ['ad-copy', 'headlines', 'descriptions'],
    };

    return channels.flatMap(channel => channelContent[channel] || []);
  }

  private generateKeywords(goal: CampaignGoal, product?: any): string[] {
    const baseKeywords = goal.objective.split(' ').filter(word => word.length > 3);
    const productKeywords = product?.features || [];
    return [...baseKeywords, ...productKeywords].slice(0, 10);
  }

  private getEmailSequenceType(campaignType: string): string {
    const sequenceTypes: Record<string, string> = {
      product_launch: 'product-announcement',
      seasonal_promo: 'promotional',
      retargeting: 'nurture',
      b2b_outreach: 'lead-nurture',
      lead_generation: 'lead-magnet',
    };

    return sequenceTypes[campaignType] || 'general';
  }

  private calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getBaseCostForAction(agent: string, action: string): number {
    const baseCosts: Record<string, number> = {
      'trend-agent': 25,
      'content-agent': 40,
      'brand-voice-agent': 15,
      'social-agent': 35,
      'email-agent': 30,
      'ad-agent': 50,
      'seo-agent': 35,
      'design-agent': 45,
      'outreach-agent': 40,
      'insight-agent': 30,
      'support-agent': 20,
    };

    return baseCosts[agent] || 30;
  }

  private calculateParallelDuration(actions: AgentAction[]): number[] {
    // This is a simplified calculation - in reality, you'd build a dependency graph
    const stages = [...new Set(actions.map(a => a.stage))];
    return stages.map(stage => {
      const stageActions = actions.filter(a => a.stage === stage);
      return Math.max(...stageActions.map(a => a.estimatedDuration));
    });
  }
}

export default CampaignStrategyPlanner;
