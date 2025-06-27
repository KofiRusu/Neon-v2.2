import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Campaign schemas for multi-agent orchestration
const CampaignStage = z.enum(['creative', 'launch', 'feedback', 'optimize', 'analyze']);

const AgentType = z.enum([
  'ContentAgent',
  'AdAgent',
  'TrendAgent',
  'SupportAgent',
  'DesignAgent',
  'SEOAgent',
  'SocialAgent',
  'EmailAgent',
  'BrandVoiceAgent',
  'InsightAgent',
  'WhatsAppAgent',
  'OutreachAgent',
  'MetricAgent',
]);

const CampaignStatus = z.enum(['draft', 'running', 'paused', 'completed', 'failed']);

const CampaignTrigger = z.object({
  id: z.string(),
  name: z.string(),
  condition: z.string(), // e.g., "CTR < 3%"
  action: z.string(), // e.g., "ask DesignAgent for new creative"
  targetAgent: AgentType,
  threshold: z.number(),
  metric: z.string(),
  isActive: z.boolean(),
  lastTriggered: z.date().nullable(),
});

const AgentTask = z.object({
  id: z.string(),
  agentType: AgentType,
  stage: CampaignStage,
  taskDescription: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'retrying']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dependencies: z.array(z.string()), // Task IDs this depends on
  estimatedDuration: z.number(), // minutes
  actualDuration: z.number().nullable(),
  llmPrompt: z.string(),
  llmResponse: z.string().nullable(),
  resultScore: z.number().nullable(), // 0-1 quality score
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  createdAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

const Campaign = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['product-launch', 'seasonal-sale', 'ugc-push', 'brand-awareness', 'custom']),
  status: CampaignStatus,
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number(),
  targetAudience: z.string(),
  goals: z.array(z.string()),
  kpis: z.object({
    ctr: z.number().nullable(),
    cvr: z.number().nullable(),
    sentiment: z.number().nullable(),
    costPerMessage: z.number().nullable(),
    reach: z.number().nullable(),
    engagement: z.number().nullable(),
  }),
  context: z.object({
    brand: z.string(),
    product: z.string().nullable(),
    targetMarket: z.string(),
    competitorAnalysis: z.string().nullable(),
    previousResults: z.array(z.any()).default([]),
    sharedKnowledge: z.record(z.any()).default({}),
  }),
  agents: z.array(AgentTask),
  triggers: z.array(CampaignTrigger),
  tags: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CampaignPreset = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  defaultAgents: z.array(
    z.object({
      agentType: AgentType,
      stage: CampaignStage,
      taskTemplate: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    })
  ),
  defaultTriggers: z.array(
    z.object({
      name: z.string(),
      condition: z.string(),
      action: z.string(),
      targetAgent: AgentType,
      threshold: z.number(),
      metric: z.string(),
    })
  ),
  estimatedDuration: z.number(), // hours
  budgetRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
});

// Mock data generation for realistic campaign orchestration
function generateMockCampaigns(): Array<z.infer<typeof Campaign>> {
  return [
    {
      id: 'campaign_1',
      name: 'Q4 Holiday Product Launch',
      description: 'Launch our new AI-powered productivity suite for the holiday season',
      type: 'product-launch',
      status: 'running',
      priority: 'high',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      budget: 25000,
      targetAudience: 'Tech professionals and productivity enthusiasts',
      goals: ['Achieve 10K+ signups', 'Generate $500K revenue', 'Build brand awareness'],
      kpis: {
        ctr: 4.2,
        cvr: 2.8,
        sentiment: 0.65,
        costPerMessage: 0.35,
        reach: 125000,
        engagement: 8.5,
      },
      context: {
        brand: 'NeonHub',
        product: 'AI Productivity Suite',
        targetMarket: 'North America, Europe',
        competitorAnalysis: 'Notion, Asana, Monday.com positioning analysis',
        previousResults: [
          { campaign: 'Q3 Launch', ctr: 3.8, cvr: 2.1, roi: 4.2 },
          { campaign: 'Beta Launch', ctr: 5.1, cvr: 3.5, roi: 6.8 },
        ],
        sharedKnowledge: {
          bestPerformingChannels: ['LinkedIn', 'Twitter', 'Email'],
          audienceInsights: 'Values efficiency, responds to data-driven messaging',
          seasonalFactors: 'Holiday shopping mindset, budget decisions',
        },
      },
      agents: [
        {
          id: 'task_1',
          agentType: 'TrendAgent',
          stage: 'creative',
          taskDescription: 'Analyze Q4 productivity trends and holiday shopping patterns',
          status: 'completed',
          priority: 'high',
          dependencies: [],
          estimatedDuration: 60,
          actualDuration: 45,
          llmPrompt:
            'Analyze current productivity trends for Q4 2024 holiday season targeting tech professionals. Focus on market demand, competitor analysis, and seasonal factors.',
          llmResponse:
            'Key trends identified: AI productivity tools seeing 340% increase in search volume. Holiday season shows 45% budget increase. Competitors focusing on team collaboration features.',
          resultScore: 0.92,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date('2024-12-01T09:00:00Z'),
          startedAt: new Date('2024-12-01T09:00:00Z'),
          completedAt: new Date('2024-12-01T09:45:00Z'),
        },
        {
          id: 'task_2',
          agentType: 'ContentAgent',
          stage: 'creative',
          taskDescription: 'Create compelling product launch content strategy',
          status: 'running',
          priority: 'high',
          dependencies: ['task_1'],
          estimatedDuration: 120,
          actualDuration: null,
          llmPrompt:
            'Based on trend analysis, create content strategy for AI productivity suite launch targeting tech professionals during holiday season.',
          llmResponse: null,
          resultScore: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date('2024-12-01T09:45:00Z'),
          startedAt: new Date('2024-12-01T10:00:00Z'),
          completedAt: null,
        },
        {
          id: 'task_3',
          agentType: 'AdAgent',
          stage: 'launch',
          taskDescription: 'Set up optimized ad campaigns across platforms',
          status: 'pending',
          priority: 'high',
          dependencies: ['task_2'],
          estimatedDuration: 90,
          actualDuration: null,
          llmPrompt:
            'Create ad campaign strategy for AI productivity suite launch with $25K budget targeting LinkedIn and Twitter.',
          llmResponse: null,
          resultScore: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date('2024-12-01T10:00:00Z'),
          startedAt: null,
          completedAt: null,
        },
      ],
      triggers: [
        {
          id: 'trigger_1',
          name: 'Low CTR Alert',
          condition: 'CTR < 3%',
          action: 'Generate new ad creative variants',
          targetAgent: 'DesignAgent',
          threshold: 3,
          metric: 'ctr',
          isActive: true,
          lastTriggered: null,
        },
        {
          id: 'trigger_2',
          name: 'Negative Sentiment Detection',
          condition: 'sentiment < -0.2',
          action: 'Escalate to support team for immediate response',
          targetAgent: 'SupportAgent',
          threshold: -0.2,
          metric: 'sentiment',
          isActive: true,
          lastTriggered: null,
        },
      ],
      tags: ['Q4', 'product-launch', 'AI', 'high-priority'],
      createdBy: 'marketing_team',
      createdAt: new Date('2024-11-25T10:00:00Z'),
      updatedAt: new Date('2024-12-01T10:15:00Z'),
    },
    {
      id: 'campaign_2',
      name: 'Black Friday Flash Sale',
      description: '48-hour flash sale with aggressive pricing and urgency messaging',
      type: 'seasonal-sale',
      status: 'completed',
      priority: 'high',
      startDate: new Date('2024-11-29'),
      endDate: new Date('2024-12-01'),
      budget: 15000,
      targetAudience: 'Existing customers and warm leads',
      goals: ['Generate $200K revenue', '40% conversion rate', 'Clear inventory'],
      kpis: {
        ctr: 6.8,
        cvr: 12.5,
        sentiment: 0.45,
        costPerMessage: 0.22,
        reach: 85000,
        engagement: 15.2,
      },
      context: {
        brand: 'NeonHub',
        product: 'Annual Subscriptions',
        targetMarket: 'Global',
        competitorAnalysis: 'Aggressive Black Friday pricing across SaaS industry',
        previousResults: [{ campaign: 'Memorial Day Sale', ctr: 5.2, cvr: 8.9, roi: 7.1 }],
        sharedKnowledge: {
          bestPerformingChannels: ['Email', 'WhatsApp', 'Social'],
          audienceInsights: 'Highly price-sensitive during Black Friday',
          seasonalFactors: 'Peak shopping period, high competition',
        },
      },
      agents: [
        {
          id: 'task_4',
          agentType: 'EmailAgent',
          stage: 'launch',
          taskDescription: 'Deploy flash sale email sequence',
          status: 'completed',
          priority: 'urgent',
          dependencies: [],
          estimatedDuration: 30,
          actualDuration: 25,
          llmPrompt:
            'Create urgent Black Friday flash sale email campaign with countdown timers and scarcity messaging.',
          llmResponse:
            'Email sequence created with 48-hour countdown, limited-time pricing, and urgency-driven subject lines. A/B testing variants prepared.',
          resultScore: 0.88,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date('2024-11-29T06:00:00Z'),
          startedAt: new Date('2024-11-29T06:00:00Z'),
          completedAt: new Date('2024-11-29T06:25:00Z'),
        },
      ],
      triggers: [],
      tags: ['black-friday', 'flash-sale', 'completed'],
      createdBy: 'sales_team',
      createdAt: new Date('2024-11-20T14:00:00Z'),
      updatedAt: new Date('2024-12-01T23:59:00Z'),
    },
    {
      id: 'campaign_3',
      name: 'Community UGC Challenge',
      description: 'Encourage users to share their productivity wins using our platform',
      type: 'ugc-push',
      status: 'paused',
      priority: 'medium',
      startDate: new Date('2024-12-05'),
      endDate: new Date('2024-12-19'),
      budget: 8000,
      targetAudience: 'Active platform users and community members',
      goals: ['500+ UGC submissions', 'Increase brand advocacy', 'Generate social proof'],
      kpis: {
        ctr: 3.1,
        cvr: 1.2,
        sentiment: 0.72,
        costPerMessage: 0.18,
        reach: 45000,
        engagement: 12.8,
      },
      context: {
        brand: 'NeonHub',
        product: null,
        targetMarket: 'Global community',
        competitorAnalysis: 'UGC campaigns showing strong engagement in productivity space',
        previousResults: [],
        sharedKnowledge: {
          bestPerformingChannels: ['Instagram', 'LinkedIn', 'Twitter'],
          audienceInsights: 'Enjoys sharing success stories and tips',
          seasonalFactors: 'End-of-year reflection period',
        },
      },
      agents: [
        {
          id: 'task_5',
          agentType: 'SocialAgent',
          stage: 'creative',
          taskDescription: 'Design engaging UGC campaign hashtag and prompts',
          status: 'completed',
          priority: 'medium',
          dependencies: [],
          estimatedDuration: 60,
          actualDuration: 55,
          llmPrompt:
            'Create UGC campaign strategy for productivity wins with engaging hashtags and participation prompts.',
          llmResponse:
            'Campaign hashtag #ProductivityWinsWithNeon created with tiered engagement prompts and community challenges.',
          resultScore: 0.84,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date('2024-12-05T09:00:00Z'),
          startedAt: new Date('2024-12-05T09:00:00Z'),
          completedAt: new Date('2024-12-05T09:55:00Z'),
        },
      ],
      triggers: [
        {
          id: 'trigger_3',
          name: 'Low Participation Rate',
          condition: 'engagement < 5%',
          action: 'Increase influencer outreach and incentives',
          targetAgent: 'OutreachAgent',
          threshold: 5,
          metric: 'engagement',
          isActive: true,
          lastTriggered: new Date('2024-12-07T14:30:00Z'),
        },
      ],
      tags: ['UGC', 'community', 'paused'],
      createdBy: 'community_team',
      createdAt: new Date('2024-11-28T11:00:00Z'),
      updatedAt: new Date('2024-12-07T15:00:00Z'),
    },
  ];
}

export const campaignRouter = createTRPCRouter({
  // Get all campaigns with filtering
  getCampaigns: publicProcedure
    .input(
      z.object({
        status: CampaignStatus.optional(),
        type: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        limit: z.number().optional().default(20),
        sortBy: z
          .enum(['created', 'updated', 'startDate', 'priority'])
          .optional()
          .default('updated'),
      })
    )
    .query(async ({ input }) => {
      try {
        let campaigns = generateMockCampaigns();

        // Apply filters
        if (input.status) {
          campaigns = campaigns.filter(c => c.status === input.status);
        }

        if (input.type) {
          campaigns = campaigns.filter(c => c.type === input.type);
        }

        if (input.priority) {
          campaigns = campaigns.filter(c => c.priority === input.priority);
        }

        // Sort campaigns
        campaigns.sort((a, b) => {
          switch (input.sortBy) {
            case 'created':
              return b.createdAt.getTime() - a.createdAt.getTime();
            case 'updated':
              return b.updatedAt.getTime() - a.updatedAt.getTime();
            case 'startDate':
              return b.startDate.getTime() - a.startDate.getTime();
            case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            default:
              return b.updatedAt.getTime() - a.updatedAt.getTime();
          }
        });

        return {
          success: true,
          data: campaigns.slice(0, input.limit),
          total: campaigns.length,
          filters: input,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get campaign details with full orchestration data
  getCampaignDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        // Calculate orchestration metrics
        const totalTasks = campaign.agents.length;
        const completedTasks = campaign.agents.filter(a => a.status === 'completed').length;
        const runningTasks = campaign.agents.filter(a => a.status === 'running').length;
        const failedTasks = campaign.agents.filter(a => a.status === 'failed').length;
        const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const orchestrationData = {
          ...campaign,
          orchestration: {
            totalTasks,
            completedTasks,
            runningTasks,
            failedTasks,
            overallProgress,
            activeAgents: campaign.agents.filter(a => a.status === 'running').map(a => a.agentType),
            nextTasks: campaign.agents.filter(a => a.status === 'pending').slice(0, 3),
            avgTaskScore:
              campaign.agents
                .filter(a => a.resultScore !== null)
                .reduce((sum, a) => sum + (a.resultScore || 0), 0) /
              Math.max(campaign.agents.filter(a => a.resultScore !== null).length, 1),
          },
        };

        return {
          success: true,
          data: orchestrationData,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch campaign details: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Run orchestrated campaign (LLM-integrated)
  runOrchestratedCampaign: publicProcedure
    .input(
      z.object({
        id: z.string(),
        forceRestart: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        // Simulate LLM-integrated campaign orchestration
        const orchestrationResult = {
          campaignId: input.id,
          status: 'running',
          startedAt: new Date(),
          tasksQueued: campaign.agents.filter(a => a.status === 'pending').length,
          activeAgents: campaign.agents.filter(a => a.status === 'running').map(a => a.agentType),
          estimatedCompletion: new Date(
            Date.now() + campaign.agents.reduce((sum, a) => sum + a.estimatedDuration, 0) * 60000
          ),
          llmOrchestrationLog: [
            {
              timestamp: new Date(),
              action: 'Campaign orchestration initiated',
              agent: 'OrchestrationEngine',
              details: `Starting campaign "${campaign.name}" with ${campaign.agents.length} agents`,
              llmContext: 'Shared campaign context loaded and distributed to all agents',
            },
            {
              timestamp: new Date(),
              action: 'Agent dependencies resolved',
              agent: 'OrchestrationEngine',
              details: 'Task dependency graph validated and execution order determined',
              llmContext: 'Each agent receives contextual knowledge from previous tasks',
            },
            {
              timestamp: new Date(),
              action: 'Trigger monitoring activated',
              agent: 'OrchestrationEngine',
              details: `${campaign.triggers.length} triggers configured for automated responses`,
              llmContext: 'Real-time performance monitoring with LLM decision making enabled',
            },
          ],
        };

        return {
          success: true,
          data: orchestrationResult,
        };
      } catch (error) {
        throw new Error(
          `Failed to run campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Evaluate campaign triggers (trigger-based automation)
  evaluateCampaignTriggers: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        const evaluationResults = campaign.triggers.map(trigger => {
          const currentValue = campaign.kpis[trigger.metric as keyof typeof campaign.kpis] || 0;
          const isTriggered = trigger.condition.includes('<')
            ? currentValue < trigger.threshold
            : currentValue > trigger.threshold;

          return {
            ...trigger,
            currentValue,
            isTriggered,
            shouldExecute: isTriggered && trigger.isActive,
            evaluatedAt: new Date(),
            llmRecommendation: isTriggered
              ? `Execute LLM task: ${trigger.action} via ${trigger.targetAgent}`
              : `Monitor ${trigger.metric} - currently within acceptable range`,
            contextForLLM: {
              campaignName: campaign.name,
              currentPerformance: campaign.kpis,
              historicalContext: campaign.context.previousResults,
              urgencyLevel: isTriggered ? 'high' : 'low',
            },
          };
        });

        const triggeredActions = evaluationResults.filter(r => r.shouldExecute);

        return {
          success: true,
          data: {
            triggers: evaluationResults,
            triggeredActions,
            hasActiveAlerts: triggeredActions.length > 0,
            nextEvaluationTime: new Date(Date.now() + 300000), // 5 minutes
            llmExecutionQueue: triggeredActions.map(action => ({
              agentType: action.targetAgent,
              taskDescription: action.action,
              priority: 'urgent',
              contextFromTrigger: action.contextForLLM,
            })),
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to evaluate triggers: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get campaign context for LLM sharing
  getCampaignContext: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        const enrichedContext = {
          ...campaign.context,
          campaignMetadata: {
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            goals: campaign.goals,
            status: campaign.status,
            timeRemaining: Math.max(0, campaign.endDate.getTime() - Date.now()),
          },
          performanceSnapshot: campaign.kpis,
          activeInsights: [
            'Target audience responds well to data-driven messaging',
            'Peak engagement times: 9-11 AM and 2-4 PM EST',
            'Video content performs 2.3x better than static images',
            'Mobile traffic accounts for 65% of conversions',
          ],
          competitorActivity: [
            'Competitor A launched similar campaign with 15% lower pricing',
            'Industry trending toward AI-first messaging',
            'Holiday season showing increased budget allocation',
          ],
          sharedLearnings: campaign.agents
            .filter(a => a.resultScore && a.resultScore > 0.8)
            .map(a => ({
              agent: a.agentType,
              insight: `High-performing ${a.taskDescription} (Score: ${a.resultScore})`,
              recommendation: 'Replicate approach in future tasks',
            })),
          llmSystemMessage: `You are working on the "${campaign.name}" campaign. 
            Goals: ${campaign.goals.join(', ')}. 
            Current performance: CTR ${campaign.kpis.ctr}%, CVR ${campaign.kpis.cvr}%. 
            Target audience: ${campaign.targetAudience}. 
            Brand voice: ${campaign.context.brand}. 
            Use this context to make informed decisions and maintain consistency across all agents.`,
        };

        return {
          success: true,
          data: enrichedContext,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch campaign context: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get agent assignments and timeline
  getAgentAssignments: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        // Group agents by stage for matrix view
        const agentMatrix = campaign.agents.reduce(
          (matrix, task) => {
            if (!matrix[task.stage]) {
              matrix[task.stage] = [];
            }
            matrix[task.stage].push(task);
            return matrix;
          },
          {} as Record<string, typeof campaign.agents>
        );

        // Create timeline data
        const timeline = campaign.agents.map(task => ({
          ...task,
          startDate:
            task.startedAt || new Date(campaign.startDate.getTime() + Math.random() * 86400000),
          endDate:
            task.completedAt ||
            new Date(campaign.startDate.getTime() + task.estimatedDuration * 60000),
          progress:
            task.status === 'completed'
              ? 100
              : task.status === 'running'
                ? 50 + Math.random() * 40
                : task.status === 'failed'
                  ? 0
                  : 0,
        }));

        return {
          success: true,
          data: {
            matrix: agentMatrix,
            timeline,
            stages: ['creative', 'launch', 'feedback', 'optimize', 'analyze'],
            agentTypes: [
              'ContentAgent',
              'AdAgent',
              'TrendAgent',
              'SupportAgent',
              'DesignAgent',
              'SEOAgent',
              'SocialAgent',
              'EmailAgent',
              'BrandVoiceAgent',
              'InsightAgent',
              'WhatsAppAgent',
              'OutreachAgent',
              'MetricAgent',
            ],
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch agent assignments: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get agent stage logs for specific campaign
  getAgentStageLogs: publicProcedure
    .input(
      z.object({
        id: z.string(),
        agentType: AgentType.optional(),
        stage: CampaignStage.optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        let logs = campaign.agents;

        // Filter by agent type if specified
        if (input.agentType) {
          logs = logs.filter(a => a.agentType === input.agentType);
        }

        // Filter by stage if specified
        if (input.stage) {
          logs = logs.filter(a => a.stage === input.stage);
        }

        // Enhance logs with LLM execution details
        const enhancedLogs = logs.map(task => ({
          ...task,
          executionLog: [
            {
              timestamp: task.createdAt,
              event: 'Task created',
              details: `${task.agentType} assigned to ${task.stage} stage`,
              llmContext: 'Campaign context loaded for agent',
            },
            ...(task.startedAt
              ? [
                  {
                    timestamp: task.startedAt,
                    event: 'LLM execution started',
                    details: 'Agent prompt sent to LLM with campaign context',
                    llmContext: `Prompt: ${task.llmPrompt.substring(0, 100)}...`,
                  },
                ]
              : []),
            ...(task.completedAt
              ? [
                  {
                    timestamp: task.completedAt,
                    event: 'Task completed',
                    details: `Result score: ${task.resultScore} (${task.actualDuration} min)`,
                    llmContext: `Response: ${task.llmResponse?.substring(0, 100) || 'No response'}...`,
                  },
                ]
              : []),
            ...(task.retryCount > 0
              ? [
                  {
                    timestamp: new Date(task.createdAt.getTime() + 60000),
                    event: 'LLM task retried',
                    details: `Retry attempt ${task.retryCount}/${task.maxRetries} due to low score`,
                    llmContext: 'Enhanced context provided for retry',
                  },
                ]
              : []),
          ],
        }));

        return {
          success: true,
          data: {
            logs: enhancedLogs,
            summary: {
              totalTasks: logs.length,
              completedTasks: logs.filter(l => l.status === 'completed').length,
              avgScore:
                logs
                  .filter(l => l.resultScore !== null)
                  .reduce((sum, l) => sum + (l.resultScore || 0), 0) /
                Math.max(logs.filter(l => l.resultScore !== null).length, 1),
              totalExecutionTime: logs.reduce((sum, l) => sum + (l.actualDuration || 0), 0),
            },
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch agent logs: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Pause campaign
  pauseCampaign: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    try {
      const campaigns = generateMockCampaigns();
      const campaign = campaigns.find(c => c.id === input.id);

      if (!campaign) {
        throw new Error(`Campaign ${input.id} not found`);
      }

      return {
        success: true,
        data: {
          campaignId: input.id,
          status: 'paused',
          pausedAt: new Date(),
          runningTasks: campaign.agents.filter(a => a.status === 'running').length,
          message: 'Campaign paused successfully. Running LLM tasks will complete before stopping.',
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to pause campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  // Resume campaign
  resumeCampaign: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const campaigns = generateMockCampaigns();
        const campaign = campaigns.find(c => c.id === input.id);

        if (!campaign) {
          throw new Error(`Campaign ${input.id} not found`);
        }

        return {
          success: true,
          data: {
            campaignId: input.id,
            status: 'running',
            resumedAt: new Date(),
            pendingTasks: campaign.agents.filter(a => a.status === 'pending').length,
            message: 'Campaign resumed successfully with updated context.',
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to resume campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get campaign KPIs and performance metrics
  getCampaignKPIs: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      const campaigns = generateMockCampaigns();
      const campaign = campaigns.find(c => c.id === input.id);

      if (!campaign) {
        throw new Error(`Campaign ${input.id} not found`);
      }

      // Generate historical KPI data
      const kpiHistory = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(Date.now() - (13 - i) * 86400000);
        const progress = Math.min(1, i / 10); // Simulate campaign ramp-up

        return {
          date: date.toISOString().split('T')[0],
          ctr: (campaign.kpis.ctr || 3) * (0.5 + progress * 0.5 + Math.random() * 0.2),
          cvr: (campaign.kpis.cvr || 2) * (0.5 + progress * 0.5 + Math.random() * 0.2),
          sentiment: (campaign.kpis.sentiment || 0.5) + (Math.random() - 0.5) * 0.3,
          costPerMessage:
            (campaign.kpis.costPerMessage || 0.3) * (1.5 - progress * 0.5 + Math.random() * 0.1),
          reach: Math.floor(
            (campaign.kpis.reach || 50000) * progress * (0.8 + Math.random() * 0.4)
          ),
          engagement:
            (campaign.kpis.engagement || 8) * (0.5 + progress * 0.5 + Math.random() * 0.2),
        };
      });

      const performanceAnalysis = {
        ...campaign.kpis,
        trends: {
          ctr:
            kpiHistory[kpiHistory.length - 1].ctr > kpiHistory[kpiHistory.length - 7].ctr
              ? 'improving'
              : 'declining',
          cvr:
            kpiHistory[kpiHistory.length - 1].cvr > kpiHistory[kpiHistory.length - 7].cvr
              ? 'improving'
              : 'declining',
          sentiment:
            kpiHistory[kpiHistory.length - 1].sentiment >
            kpiHistory[kpiHistory.length - 7].sentiment
              ? 'improving'
              : 'declining',
        },
        benchmarks: {
          ctr: { industry: 3.2, good: 4.0, excellent: 6.0 },
          cvr: { industry: 2.1, good: 3.0, excellent: 5.0 },
          sentiment: { industry: 0.3, good: 0.5, excellent: 0.7 },
        },
        alerts: [
          ...(campaign.kpis.ctr && campaign.kpis.ctr < 2
            ? [{ type: 'warning', message: 'CTR below industry average', metric: 'ctr' }]
            : []),
          ...(campaign.kpis.sentiment && campaign.kpis.sentiment < 0
            ? [{ type: 'critical', message: 'Negative sentiment detected', metric: 'sentiment' }]
            : []),
        ],
        history: kpiHistory,
      };

      return {
        success: true,
        data: performanceAnalysis,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch campaign KPIs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  // Get campaign presets
  getCampaignPresets: publicProcedure.query(async () => {
    try {
      const presets = generateCampaignPresets();

      return {
        success: true,
        data: presets,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch campaign presets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  // Create campaign from preset
  createCampaignFromPreset: publicProcedure
    .input(
      z.object({
        presetId: z.string(),
        name: z.string(),
        description: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        budget: z.number(),
        targetAudience: z.string(),
        customizations: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const presets = generateCampaignPresets();
        const preset = presets.find(p => p.id === input.presetId);

        if (!preset) {
          throw new Error(`Preset ${input.presetId} not found`);
        }

        const newCampaign = {
          id: `campaign_${Date.now()}`,
          name: input.name,
          description: input.description,
          type: preset.type,
          status: 'draft' as const,
          priority: 'medium' as const,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget,
          targetAudience: input.targetAudience,
          goals: ['Generated from preset - customize as needed'],
          presetUsed: preset.name,
          estimatedDuration: preset.estimatedDuration,
          agentsAssigned: preset.defaultAgents.length,
          triggersConfigured: preset.defaultTriggers.length,
        };

        return {
          success: true,
          data: newCampaign,
          message: `Campaign "${input.name}" created from "${preset.name}" preset`,
        };
      } catch (error) {
        throw new Error(
          `Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),
});

export type CampaignRouter = typeof campaignRouter;
