import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  CampaignStrategyPlanner,
  CampaignGoal,
  CampaignAudience,
  CampaignContext,
  StrategyGenerationOptions,
} from '@neon/core-agents';
import {
  StrategyManager,
  InMemoryStrategyAdapter,
  StrategyExecutionState,
} from '@neon/core-agents';
import {
  strategyTemplates,
  getTemplateByType,
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateRecommendations,
} from '@neon/core-agents';
import { AgentMemoryStore, PerformanceTuner } from '@neon/core-agents';
import { PrismaClient } from '@neon/data-model';

// Initialize components
const prisma = new PrismaClient();
const memoryStore = new AgentMemoryStore(prisma);
const performanceTuner = new PerformanceTuner(memoryStore);
const strategyPlanner = new CampaignStrategyPlanner(memoryStore, performanceTuner);
const strategyManager = new StrategyManager(new InMemoryStrategyAdapter());

// Validation schemas
const CampaignGoalSchema = z.object({
  type: z.enum([
    'product_launch',
    'seasonal_promo',
    'retargeting',
    'b2b_outreach',
    'brand_awareness',
    'lead_generation',
  ]),
  objective: z.string(),
  kpis: z.array(
    z.object({
      metric: z.enum(['conversions', 'engagement', 'reach', 'leads', 'sales', 'brand_mentions']),
      target: z.number(),
      timeframe: z.string(),
    })
  ),
  budget: z
    .object({
      total: z.number(),
      allocation: z.record(z.number()),
    })
    .optional(),
});

const CampaignAudienceSchema = z.object({
  segment: z.enum(['enterprise', 'smb', 'agencies', 'ecommerce', 'saas', 'consumer']),
  demographics: z.object({
    ageRange: z.string(),
    interests: z.array(z.string()),
    painPoints: z.array(z.string()),
    channels: z.array(z.string()),
  }),
  persona: z.object({
    name: z.string(),
    description: z.string(),
    motivations: z.array(z.string()),
    objections: z.array(z.string()),
  }),
});

const CampaignContextSchema = z.object({
  product: z
    .object({
      name: z.string(),
      category: z.string(),
      features: z.array(z.string()),
      pricing: z.string(),
      launchDate: z.string().optional(),
    })
    .optional(),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    keyMilestones: z
      .array(
        z.object({
          date: z.string(),
          event: z.string(),
        })
      )
      .optional(),
  }),
  channels: z.array(z.enum(['email', 'social', 'ads', 'content', 'seo', 'outreach', 'whatsapp'])),
  constraints: z
    .object({
      budgetLimits: z.record(z.number()),
      brandGuidelines: z.array(z.string()),
      complianceRequirements: z.array(z.string()),
    })
    .optional(),
});

const StrategyGenerationOptionsSchema = z.object({
  useMemoryOptimization: z.boolean().default(true),
  brandComplianceLevel: z.enum(['strict', 'moderate', 'flexible']).default('moderate'),
  agentSelectionCriteria: z.enum(['performance', 'cost', 'balanced']).default('balanced'),
  maxActions: z.number().default(20),
  timelineFlexibility: z.enum(['rigid', 'flexible', 'adaptive']).default('flexible'),
});

export const strategyRouter = createTRPCRouter({
  // Generate a new campaign strategy
  generateStrategy: publicProcedure
    .input(
      z.object({
        goal: CampaignGoalSchema,
        audience: CampaignAudienceSchema,
        context: CampaignContextSchema,
        options: StrategyGenerationOptionsSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { goal, audience, context, options } = input;

        const strategy = await strategyPlanner.generateStrategy(
          goal as CampaignGoal,
          audience as CampaignAudience,
          context as CampaignContext,
          options as Partial<StrategyGenerationOptions>
        );

        // Save the generated strategy
        await strategyManager.saveStrategy(strategy);

        return {
          success: true,
          strategy,
          message: 'Strategy generated successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate strategy',
          strategy: null,
        };
      }
    }),

  // Get recent strategies
  getRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        status: z.enum(['draft', 'approved', 'executing', 'completed', 'cancelled']).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { limit, status } = input;

        let strategies = await strategyManager.loadAllStrategies();

        if (status) {
          strategies = strategies.filter(s => s.status === status);
        }

        return strategies
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      } catch (error) {
        throw new Error(
          `Failed to load strategies: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get strategy by ID
  getStrategy: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const strategy = await strategyManager.loadStrategy(input.id);
    if (!strategy) {
      throw new Error(`Strategy ${input.id} not found`);
    }
    return strategy;
  }),

  // Update strategy
  updateStrategy: publicProcedure
    .input(
      z.object({
        id: z.string(),
        updates: z.object({
          name: z.string().optional(),
          status: z.enum(['draft', 'approved', 'executing', 'completed', 'cancelled']).optional(),
          metadata: z.any().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await strategyManager.updateStrategy(input.id, input.updates);
        const updatedStrategy = await strategyManager.loadStrategy(input.id);

        return {
          success: true,
          strategy: updatedStrategy,
          message: 'Strategy updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update strategy',
        };
      }
    }),

  // Delete strategy
  deleteStrategy: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await strategyManager.deleteStrategy(input.id);
        return {
          success: true,
          message: 'Strategy deleted successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete strategy',
        };
      }
    }),

  // Clone strategy
  cloneStrategy: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        newName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const clonedStrategy = await strategyManager.cloneStrategy(input.sourceId, input.newName);
        return {
          success: true,
          strategy: clonedStrategy,
          message: 'Strategy cloned successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to clone strategy',
        };
      }
    }),

  // Execute strategy (initialize execution)
  executeStrategy: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Update strategy status to executing
        await strategyManager.updateStrategy(input.id, { status: 'executing' });

        // Initialize execution state
        const executionState = await strategyManager.initializeExecution(input.id);

        return {
          success: true,
          executionState,
          message: 'Strategy execution initialized',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to execute strategy',
        };
      }
    }),

  // Get execution state
  getExecutionState: publicProcedure
    .input(z.object({ strategyId: z.string() }))
    .query(async ({ input }) => {
      const executionState = await strategyManager.getExecutionState(input.strategyId);
      if (!executionState) {
        throw new Error(`Execution state for strategy ${input.strategyId} not found`);
      }
      return executionState;
    }),

  // Get active executions
  getActiveExecutions: publicProcedure.query(async () => {
    return await strategyManager.getActiveExecutions();
  }),

  // Update execution state
  updateExecutionState: publicProcedure
    .input(
      z.object({
        strategyId: z.string(),
        updates: z.object({
          status: z.enum(['pending', 'running', 'paused', 'completed', 'failed']).optional(),
          currentStage: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await strategyManager.updateExecutionState(input.strategyId, input.updates);
        return {
          success: true,
          message: 'Execution state updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update execution state',
        };
      }
    }),

  // Log action event
  logActionEvent: publicProcedure
    .input(
      z.object({
        strategyId: z.string(),
        actionId: z.string(),
        event: z.enum(['started', 'completed', 'failed', 'skipped']),
        details: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await strategyManager.logActionEvent(
          input.strategyId,
          input.actionId,
          input.event,
          input.details
        );
        return {
          success: true,
          message: 'Action event logged successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to log action event',
        };
      }
    }),

  // Get all templates
  getTemplates: publicProcedure
    .input(
      z.object({
        category: z.enum(['product', 'promotion', 'engagement', 'conversion']).optional(),
      })
    )
    .query(async ({ input }) => {
      if (input.category) {
        return getTemplatesByCategory(input.category);
      }
      return getAllTemplates();
    }),

  // Get template by campaign type
  getTemplateByType: publicProcedure
    .input(
      z.object({
        campaignType: z.enum(['product_launch', 'seasonal_promo', 'retargeting', 'b2b_outreach']),
      })
    )
    .query(async ({ input }) => {
      const template = getTemplateByType(input.campaignType);
      if (!template) {
        throw new Error(`Template for campaign type ${input.campaignType} not found`);
      }
      return template;
    }),

  // Get template recommendations
  getTemplateRecommendations: publicProcedure
    .input(
      z.object({
        budget: z.number().optional(),
        timeline: z.number().optional(),
        channels: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      return getTemplateRecommendations(input.budget, input.timeline, input.channels);
    }),

  // Generate strategy from template
  generateFromTemplate: publicProcedure
    .input(
      z.object({
        templateId: z.string(),
        customizations: z
          .object({
            name: z.string().optional(),
            goal: CampaignGoalSchema.partial().optional(),
            audience: CampaignAudienceSchema.partial().optional(),
            context: CampaignContextSchema.partial().optional(),
            options: StrategyGenerationOptionsSchema.optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const template = strategyTemplates[input.templateId];
        if (!template) {
          throw new Error(`Template ${input.templateId} not found`);
        }

        // Merge template with customizations
        const goal = { ...template.goal, ...input.customizations?.goal } as CampaignGoal;
        const audience = {
          ...template.audience,
          ...input.customizations?.audience,
        } as CampaignAudience;
        const context = {
          ...template.context,
          ...input.customizations?.context,
        } as CampaignContext;
        const options = input.customizations?.options || {};

        // Generate strategy using the planner
        const strategy = await strategyPlanner.generateStrategy(goal, audience, context, options);

        // Update name if provided
        if (input.customizations?.name) {
          strategy.name = input.customizations.name;
        }

        // Save the generated strategy
        await strategyManager.saveStrategy(strategy);

        return {
          success: true,
          strategy,
          message: 'Strategy generated from template successfully',
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to generate strategy from template',
          strategy: null,
        };
      }
    }),

  // Export strategy as template
  exportAsTemplate: publicProcedure
    .input(z.object({ strategyId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const strategy = await strategyManager.loadStrategy(input.strategyId);
        if (!strategy) {
          throw new Error(`Strategy ${input.strategyId} not found`);
        }

        const template = strategyManager.exportToTemplate(strategy);

        return {
          success: true,
          template,
          message: 'Strategy exported as template successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to export strategy as template',
        };
      }
    }),

  // Get strategy analytics
  getStrategyAnalytics: publicProcedure
    .input(
      z.object({
        strategyId: z.string(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const strategy = await strategyManager.loadStrategy(input.strategyId);
        if (!strategy) {
          throw new Error(`Strategy ${input.strategyId} not found`);
        }

        const executionState = await strategyManager.getExecutionState(input.strategyId);

        // Get performance metrics for agents used in the strategy
        const agentMetrics = {};
        for (const action of strategy.actions) {
          try {
            const metrics = await memoryStore.getAgentMetrics(action.agent, input.days);
            agentMetrics[action.agent] = metrics;
          } catch (error) {
            console.warn(`Failed to get metrics for agent ${action.agent}:`, error);
          }
        }

        return {
          strategy,
          executionState,
          agentMetrics,
          analytics: {
            estimatedROI: this.calculateEstimatedROI(strategy),
            riskScore: this.calculateRiskScore(strategy, agentMetrics),
            timelineOptimization: this.analyzeTimelineOptimization(strategy),
            budgetAllocation: this.analyzeBudgetAllocation(strategy),
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to get strategy analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Health check
  healthCheck: publicProcedure.query(async () => {
    try {
      // Test all components
      const strategiesCount = (await strategyManager.loadAllStrategies()).length;
      const templatesCount = getAllTemplates().length;
      const activeExecutions = await strategyManager.getActiveExecutions();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          strategyPlanner: 'operational',
          strategyManager: 'operational',
          templates: 'operational',
          memoryStore: 'operational',
        },
        stats: {
          strategiesCount,
          templatesCount,
          activeExecutions: activeExecutions.length,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        components: {
          strategyPlanner: 'unknown',
          strategyManager: 'unknown',
          templates: 'unknown',
          memoryStore: 'unknown',
        },
      };
    }
  }),
});

// Helper functions for analytics
function calculateEstimatedROI(strategy: any): number {
  // Simple ROI calculation based on expected revenue and costs
  const expectedRevenue =
    strategy.goal.kpis.find((kpi: any) => kpi.metric === 'sales')?.target || 0;
  const estimatedCost = strategy.estimatedCost;
  return estimatedCost > 0 ? ((expectedRevenue - estimatedCost) / estimatedCost) * 100 : 0;
}

function calculateRiskScore(strategy: any, agentMetrics: any): number {
  // Calculate risk based on agent reliability, strategy complexity, and timeline
  let riskScore = 0;

  // Agent reliability risk
  const agentSuccessRates = Object.values(agentMetrics).map(
    (metrics: any) => metrics.successRate || 90
  );
  const avgSuccessRate =
    agentSuccessRates.reduce((sum, rate) => sum + rate, 0) / agentSuccessRates.length;
  riskScore += (100 - avgSuccessRate) * 0.4; // 40% weight

  // Complexity risk
  const complexityScore =
    strategy.actions.length > 15 ? 30 : strategy.actions.length > 10 ? 20 : 10;
  riskScore += complexityScore * 0.3; // 30% weight

  // Timeline risk
  const timelineRisk =
    strategy.estimatedDuration > 60 ? 25 : strategy.estimatedDuration > 30 ? 15 : 5;
  riskScore += timelineRisk * 0.3; // 30% weight

  return Math.min(100, Math.max(0, riskScore));
}

function analyzeTimelineOptimization(strategy: any): any {
  // Analyze if timeline can be optimized
  const stages = strategy.timeline;
  const parallelizable = strategy.actions.filter((action: any) => action.dependsOn.length === 0);

  return {
    currentDuration: strategy.estimatedDuration,
    parallelizableActions: parallelizable.length,
    optimizationPotential:
      parallelizable.length > 3 ? 'high' : parallelizable.length > 1 ? 'medium' : 'low',
    recommendations: [
      'Consider running independent actions in parallel',
      'Review dependency chains for optimization opportunities',
      'Identify bottlenecks in the execution flow',
    ],
  };
}

function analyzeBudgetAllocation(strategy: any): any {
  // Analyze budget allocation across channels and agents
  const agentCosts = strategy.actions.reduce((acc: any, action: any) => {
    acc[action.agent] = (acc[action.agent] || 0) + (action.estimatedCost || 0);
    return acc;
  }, {});

  return {
    totalBudget: strategy.estimatedCost,
    agentAllocation: agentCosts,
    recommendations: [
      'Review high-cost agents for optimization opportunities',
      'Consider budget reallocation based on agent performance',
      'Monitor spending throughout campaign execution',
    ],
  };
}
