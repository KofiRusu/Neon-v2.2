import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { 
  AgentType, 
  ChainType, 
  ChainExecutionMode, 
  ChainCategory, 
  ChainComplexity,
  ChainTriggerType,
  ChainExecutionStatus,
  ChainStepStatus,
  HandoffType
} from '@neon/data-model';
import { 
  AgentChainOrchestrator, 
  ChainDefinition, 
  ChainExecutionContext, 
  ChainExecutionResult 
} from '@neon/core-agents/src/collaboration/AgentChainOrchestrator';
import { 
  ChainDefinitionEngine, 
  ChainGoal, 
  DynamicChainRequest 
} from '@neon/core-agents/src/collaboration/ChainDefinitionEngine';
import { 
  ChainPerformanceAnalyzer, 
  ChainPerformanceMetrics 
} from '@neon/core-agents/src/collaboration/ChainPerformanceAnalyzer';
import { AgentCommunicationProtocol } from '@neon/core-agents/src/collaboration/AgentCommunicationProtocol';
import { prisma } from '@neon/data-model';

// Input validation schemas
const ChainDefinitionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  chainType: z.nativeEnum(ChainType),
  executionMode: z.nativeEnum(ChainExecutionMode),
  steps: z.array(z.object({
    stepNumber: z.number().int().min(0),
    stepName: z.string().min(1).max(100),
    stepType: z.string(), // ChainStepType
    agentType: z.nativeEnum(AgentType),
    agentConfig: z.record(z.any()).optional(),
    dependsOn: z.array(z.number().int()).optional(),
    conditions: z.array(z.any()).optional(),
    retries: z.number().int().min(0).max(10).optional(),
    timeout: z.number().int().min(1000).optional(),
    inputMapping: z.record(z.string()).optional(),
    outputMapping: z.record(z.string()).optional()
  })),
  successCriteria: z.object({
    minStepsCompleted: z.number().int().min(0).optional(),
    requiredSteps: z.array(z.number().int()).optional(),
    minQualityScore: z.number().min(0).max(1).optional(),
    maxErrorRate: z.number().min(0).max(1).optional(),
    customConditions: z.record(z.any()).optional()
  }),
  maxRetries: z.number().int().min(0).max(10).optional(),
  timeoutMinutes: z.number().int().min(1).max(1440).optional(),
  budgetLimit: z.number().positive().optional()
});

const ChainGoalSchema = z.object({
  primary: z.string().min(1).max(200),
  secondary: z.array(z.string()).optional(),
  targetMetrics: z.array(z.object({
    name: z.string(),
    target: z.number(),
    operator: z.enum(['greater_than', 'less_than', 'equals'])
  })).optional(),
  constraints: z.object({
    maxCost: z.number().positive().optional(),
    maxTime: z.number().positive().optional(),
    requiredAgents: z.array(z.nativeEnum(AgentType)).optional(),
    forbiddenAgents: z.array(z.nativeEnum(AgentType)).optional()
  }).optional()
});

const DynamicChainRequestSchema = z.object({
  goal: ChainGoalSchema,
  context: z.object({
    campaignId: z.string().optional(),
    industry: z.string().optional(),
    region: z.string().optional(),
    language: z.string().optional()
  }).optional(),
  preferences: z.object({
    preferredAgents: z.array(z.nativeEnum(AgentType)).optional(),
    executionMode: z.nativeEnum(ChainExecutionMode).optional(),
    maxSteps: z.number().int().min(1).max(20).optional(),
    prioritizeSpeed: z.boolean().optional(),
    prioritizeCost: z.boolean().optional(),
    prioritizeQuality: z.boolean().optional()
  }).optional()
});

// Initialize chain services
const orchestrator = new AgentChainOrchestrator(prisma);
const definitionEngine = new ChainDefinitionEngine(prisma);
const performanceAnalyzer = new ChainPerformanceAnalyzer(prisma);
const communicationProtocol = new AgentCommunicationProtocol(prisma);

export const agentChainsRouter = router({
  // Chain Definition Management
  
  /**
   * Create a new chain definition
   */
  createChain: protectedProcedure
    .input(ChainDefinitionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const chain = await prisma.agentChain.create({
          data: {
            name: input.name,
            description: input.description,
            chainType: input.chainType,
            definition: input,
            agentSequence: input.steps.map(step => ({
              stepNumber: step.stepNumber,
              agentType: step.agentType,
              agentConfig: step.agentConfig
            })),
            executionMode: input.executionMode,
            primaryGoal: input.successCriteria.toString(),
            secondaryGoals: [],
            successCriteria: input.successCriteria,
            maxRetries: input.maxRetries || 3,
            timeoutMinutes: input.timeoutMinutes || 60,
            budgetLimit: input.budgetLimit,
            isActive: true,
            createdBy: ctx.session.user.id
          }
        });

        return {
          success: true,
          chain: {
            id: chain.id,
            name: chain.name,
            description: chain.description,
            chainType: chain.chainType,
            isActive: chain.isActive,
            createdAt: chain.createdAt
          }
        };
      } catch (error) {
        console.error('Chain creation failed:', error);
        throw new Error('Failed to create chain');
      }
    }),

  /**
   * Get all chains for a user
   */
  getChains: protectedProcedure
    .input(z.object({
      chainType: z.nativeEnum(ChainType).optional(),
      isActive: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0)
    }))
    .query(async ({ input, ctx }) => {
      const whereClause: any = {};
      
      if (input.chainType) {
        whereClause.chainType = input.chainType;
      }
      
      if (input.isActive !== undefined) {
        whereClause.isActive = input.isActive;
      }

      const chains = await prisma.agentChain.findMany({
        where: whereClause,
        include: {
          executions: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
              successRate: true,
              totalCost: true
            },
            orderBy: { startedAt: 'desc' },
            take: 5
          },
          _count: {
            select: {
              executions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset
      });

      return chains.map(chain => ({
        id: chain.id,
        name: chain.name,
        description: chain.description,
        chainType: chain.chainType,
        executionMode: chain.executionMode,
        isActive: chain.isActive,
        executionCount: chain._count.executions,
        successCount: chain.successCount,
        failureCount: chain.failureCount,
        averageExecutionTime: chain.averageExecutionTime,
        averageSuccessRate: chain.averageSuccessRate,
        recentExecutions: chain.executions,
        createdAt: chain.createdAt,
        lastExecuted: chain.lastExecuted
      }));
    }),

  /**
   * Get chain details by ID
   */
  getChain: protectedProcedure
    .input(z.object({ chainId: z.string() }))
    .query(async ({ input }) => {
      const chain = await prisma.agentChain.findUnique({
        where: { id: input.chainId },
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 10,
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' }
              }
            }
          }
        }
      });

      if (!chain) {
        throw new Error('Chain not found');
      }

      return {
        id: chain.id,
        name: chain.name,
        description: chain.description,
        chainType: chain.chainType,
        executionMode: chain.executionMode,
        definition: chain.definition,
        agentSequence: chain.agentSequence,
        successCriteria: chain.successCriteria,
        isActive: chain.isActive,
        performance: {
          executionCount: chain.executionCount,
          successCount: chain.successCount,
          failureCount: chain.failureCount,
          averageExecutionTime: chain.averageExecutionTime,
          averageSuccessRate: chain.averageSuccessRate,
          actualCost: chain.actualCost
        },
        recentExecutions: chain.executions,
        createdAt: chain.createdAt,
        updatedAt: chain.updatedAt
      };
    }),

  /**
   * Update chain definition
   */
  updateChain: protectedProcedure
    .input(z.object({
      chainId: z.string(),
      updates: ChainDefinitionSchema.partial()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const chain = await prisma.agentChain.update({
          where: { id: input.chainId },
          data: {
            name: input.updates.name,
            description: input.updates.description,
            chainType: input.updates.chainType,
            definition: input.updates as any,
            executionMode: input.updates.executionMode,
            successCriteria: input.updates.successCriteria,
            maxRetries: input.updates.maxRetries,
            timeoutMinutes: input.updates.timeoutMinutes,
            budgetLimit: input.updates.budgetLimit,
            updatedAt: new Date()
          }
        });

        return {
          success: true,
          chain: {
            id: chain.id,
            name: chain.name,
            updatedAt: chain.updatedAt
          }
        };
      } catch (error) {
        console.error('Chain update failed:', error);
        throw new Error('Failed to update chain');
      }
    }),

  /**
   * Delete chain
   */
  deleteChain: protectedProcedure
    .input(z.object({ chainId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.agentChain.delete({
          where: { id: input.chainId }
        });

        return { success: true };
      } catch (error) {
        console.error('Chain deletion failed:', error);
        throw new Error('Failed to delete chain');
      }
    }),

  // Chain Execution Management

  /**
   * Execute a chain
   */
  executeChain: protectedProcedure
    .input(z.object({
      chainId: z.string(),
      context: z.object({
        campaignId: z.string().optional(),
        triggeredBy: z.string().optional(),
        triggerType: z.nativeEnum(ChainTriggerType),
        triggerData: z.record(z.any()).optional(),
        environment: z.string().default('production'),
        config: z.record(z.any()).optional()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get chain definition
        const chain = await prisma.agentChain.findUnique({
          where: { id: input.chainId }
        });

        if (!chain) {
          throw new Error('Chain not found');
        }

        if (!chain.isActive) {
          throw new Error('Chain is not active');
        }

        // Prepare execution context
        const executionContext: ChainExecutionContext = {
          executionId: '', // Will be set by orchestrator
          chainId: input.chainId,
          campaignId: input.context.campaignId,
          triggeredBy: input.context.triggeredBy || ctx.session.user.id,
          triggerType: input.context.triggerType,
          triggerData: input.context.triggerData,
          environment: input.context.environment,
          config: input.context.config
        };

        // Execute the chain
        const result = await orchestrator.executeChain(
          chain.definition as ChainDefinition,
          executionContext
        );

        // Update chain statistics
        await prisma.agentChain.update({
          where: { id: input.chainId },
          data: {
            executionCount: { increment: 1 },
            successCount: result.success ? { increment: 1 } : undefined,
            failureCount: !result.success ? { increment: 1 } : undefined,
            actualCost: { increment: result.performance.totalCost },
            lastExecuted: new Date()
          }
        });

        return {
          success: true,
          execution: {
            id: result.executionId,
            status: result.success ? 'completed' : 'failed',
            finalResult: result.finalResult,
            performance: result.performance,
            errors: result.errors
          }
        };
      } catch (error) {
        console.error('Chain execution failed:', error);
        throw new Error(`Chain execution failed: ${error}`);
      }
    }),

  /**
   * Get chain executions
   */
  getExecutions: protectedProcedure
    .input(z.object({
      chainId: z.string().optional(),
      status: z.nativeEnum(ChainExecutionStatus).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0)
    }))
    .query(async ({ input }) => {
      const whereClause: any = {};
      
      if (input.chainId) {
        whereClause.chainId = input.chainId;
      }
      
      if (input.status) {
        whereClause.status = input.status;
      }

      const executions = await prisma.chainExecution.findMany({
        where: whereClause,
        include: {
          chain: {
            select: {
              id: true,
              name: true,
              chainType: true
            }
          },
          steps: {
            select: {
              id: true,
              stepNumber: true,
              agentType: true,
              status: true,
              executionTime: true,
              cost: true
            },
            orderBy: { stepNumber: 'asc' }
          },
          _count: {
            select: {
              steps: true,
              handoffs: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: input.limit,
        skip: input.offset
      });

      return executions.map(execution => ({
        id: execution.id,
        chainId: execution.chainId,
        chainName: execution.chain.name,
        chainType: execution.chain.chainType,
        executionNumber: execution.executionNumber,
        status: execution.status,
        triggerType: execution.triggerType,
        campaignId: execution.campaignId,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        executionTime: execution.executionTime,
        totalCost: execution.totalCost,
        successRate: execution.successRate,
        stepCount: execution._count.steps,
        handoffCount: execution._count.handoffs,
        steps: execution.steps,
        agentsUsed: execution.agentsUsed
      }));
    }),

  /**
   * Get execution details
   */
  getExecution: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input }) => {
      const execution = await prisma.chainExecution.findUnique({
        where: { id: input.executionId },
        include: {
          chain: {
            select: {
              id: true,
              name: true,
              description: true,
              chainType: true,
              executionMode: true
            }
          },
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          handoffs: {
            orderBy: { handoffNumber: 'asc' }
          }
        }
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      return {
        id: execution.id,
        chain: execution.chain,
        executionNumber: execution.executionNumber,
        status: execution.status,
        triggerType: execution.triggerType,
        triggerData: execution.triggerData,
        campaignId: execution.campaignId,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        failedAt: execution.failedAt,
        executionTime: execution.executionTime,
        totalCost: execution.totalCost,
        successRate: execution.successRate,
        finalResult: execution.finalResult,
        outputs: execution.outputs,
        errorDetails: execution.errorDetails,
        steps: execution.steps,
        handoffs: execution.handoffs,
        agentsUsed: execution.agentsUsed,
        resultQuality: execution.resultQuality,
        userFeedback: execution.userFeedback,
        userRating: execution.userRating
      };
    }),

  /**
   * Cancel running execution
   */
  cancelExecution: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const execution = await prisma.chainExecution.update({
          where: { id: input.executionId },
          data: {
            status: ChainExecutionStatus.CANCELLED,
            completedAt: new Date()
          }
        });

        return {
          success: true,
          execution: {
            id: execution.id,
            status: execution.status
          }
        };
      } catch (error) {
        console.error('Execution cancellation failed:', error);
        throw new Error('Failed to cancel execution');
      }
    }),

  // Dynamic Chain Generation

  /**
   * Generate chain recommendation based on goals
   */
  recommendChain: protectedProcedure
    .input(DynamicChainRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const recommendation = await definitionEngine.recommendChain(input);
        
        return {
          success: true,
          recommendation: {
            template: recommendation.template,
            customChain: recommendation.customChain,
            confidence: recommendation.confidence,
            reasoning: recommendation.reasoning,
            expectedOutcome: recommendation.expectedOutcome,
            alternatives: recommendation.alternatives
          }
        };
      } catch (error) {
        console.error('Chain recommendation failed:', error);
        throw new Error('Failed to generate chain recommendation');
      }
    }),

  /**
   * Get available chain templates
   */
  getTemplates: protectedProcedure
    .input(z.object({
      category: z.nativeEnum(ChainCategory).optional(),
      complexity: z.nativeEnum(ChainComplexity).optional(),
      agentTypes: z.array(z.nativeEnum(AgentType)).optional()
    }))
    .query(async ({ input }) => {
      const templates = await definitionEngine.getAvailableTemplates(input);
      
      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        complexity: template.complexity,
        agentTypes: template.agentTypes,
        successRate: template.successRate,
        averageCost: template.averageCost,
        averageExecutionTime: template.averageExecutionTime
      }));
    }),

  /**
   * Create custom template
   */
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
      category: z.nativeEnum(ChainCategory),
      definition: ChainDefinitionSchema
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const template = await definitionEngine.createCustomTemplate(
          input.name,
          input.description,
          input.definition,
          input.category,
          ctx.session.user.id
        );

        return {
          success: true,
          template: {
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            complexity: template.complexity
          }
        };
      } catch (error) {
        console.error('Template creation failed:', error);
        throw new Error('Failed to create template');
      }
    }),

  // Performance Analytics

  /**
   * Get chain performance metrics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      chainId: z.string().optional(),
      executionId: z.string().optional(),
      timeRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional()
    }))
    .query(async ({ input }) => {
      try {
        if (input.executionId) {
          const metrics = await performanceAnalyzer.analyzeChainExecution(input.executionId);
          return { executionMetrics: metrics };
        }

        if (input.chainId) {
          const analysis = await performanceAnalyzer.analyzeChainPerformance(
            input.chainId,
            input.timeRange
          );
          return { 
            chainAnalysis: analysis,
            summary: analysis.summary,
            trends: analysis.trends
          };
        }

        throw new Error('Either chainId or executionId must be provided');
      } catch (error) {
        console.error('Performance metrics failed:', error);
        throw new Error('Failed to get performance metrics');
      }
    }),

  /**
   * Get performance heatmap data
   */
  getPerformanceHeatmap: protectedProcedure
    .input(z.object({
      chainIds: z.array(z.string()).optional(),
      timeRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional()
    }))
    .query(async ({ input }) => {
      try {
        const heatmap = await performanceAnalyzer.generatePerformanceHeatmap(
          input.chainIds,
          input.timeRange
        );

        return {
          timeHeatmap: heatmap.timeHeatmap,
          agentHeatmap: heatmap.agentHeatmap,
          costHeatmap: heatmap.costHeatmap,
          qualityHeatmap: heatmap.qualityHeatmap
        };
      } catch (error) {
        console.error('Heatmap generation failed:', error);
        throw new Error('Failed to generate performance heatmap');
      }
    }),

  /**
   * Detect performance bottlenecks
   */
  detectBottlenecks: protectedProcedure
    .input(z.object({
      executionId: z.string(),
      thresholds: z.object({
        timeThreshold: z.number().positive().optional(),
        costThreshold: z.number().positive().optional(),
        qualityThreshold: z.number().min(0).max(1).optional()
      }).optional()
    }))
    .query(async ({ input }) => {
      try {
        const bottlenecks = await performanceAnalyzer.detectBottlenecks(
          input.executionId,
          input.thresholds
        );

        return { bottlenecks };
      } catch (error) {
        console.error('Bottleneck detection failed:', error);
        throw new Error('Failed to detect bottlenecks');
      }
    }),

  /**
   * Get performance recommendations
   */
  getRecommendations: protectedProcedure
    .input(z.object({
      executionId: z.string(),
      includeBottlenecks: z.boolean().default(true)
    }))
    .query(async ({ input }) => {
      try {
        let bottlenecks: any[] = [];
        
        if (input.includeBottlenecks) {
          bottlenecks = await performanceAnalyzer.detectBottlenecks(input.executionId);
        }

        const recommendations = await performanceAnalyzer.generateRecommendations(
          input.executionId,
          bottlenecks
        );

        return { 
          recommendations,
          bottlenecks: input.includeBottlenecks ? bottlenecks : undefined
        };
      } catch (error) {
        console.error('Recommendations generation failed:', error);
        throw new Error('Failed to generate recommendations');
      }
    }),

  // Communication & Handoff Analytics

  /**
   * Get handoff history
   */
  getHandoffHistory: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const history = await communicationProtocol.getHandoffHistory(input.executionId);
        
        return { handoffs: history };
      } catch (error) {
        console.error('Handoff history retrieval failed:', error);
        throw new Error('Failed to get handoff history');
      }
    }),

  /**
   * Analyze handoff patterns
   */
  analyzeHandoffPatterns: protectedProcedure
    .input(z.object({
      agentType: z.nativeEnum(AgentType).optional(),
      timeRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional()
    }))
    .query(async ({ input }) => {
      try {
        const analysis = await communicationProtocol.analyzeHandoffPatterns(
          input.agentType,
          input.timeRange
        );

        return {
          patterns: analysis.patterns,
          recommendations: analysis.recommendations,
          performance: analysis.performance
        };
      } catch (error) {
        console.error('Handoff pattern analysis failed:', error);
        throw new Error('Failed to analyze handoff patterns');
      }
    }),

  // Statistics and Overview

  /**
   * Get chain statistics
   */
  getChainStats: protectedProcedure
    .input(z.object({
      timeRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional()
    }))
    .query(async ({ input }) => {
      const whereClause: any = {};
      
      if (input.timeRange) {
        whereClause.createdAt = {
          gte: input.timeRange.start,
          lte: input.timeRange.end
        };
      }

      const [
        totalChains,
        activeChains,
        totalExecutions,
        runningExecutions,
        completedExecutions,
        failedExecutions
      ] = await Promise.all([
        prisma.agentChain.count({ where: whereClause }),
        prisma.agentChain.count({ where: { ...whereClause, isActive: true } }),
        prisma.chainExecution.count({ where: whereClause }),
        prisma.chainExecution.count({ where: { ...whereClause, status: ChainExecutionStatus.RUNNING } }),
        prisma.chainExecution.count({ where: { ...whereClause, status: ChainExecutionStatus.COMPLETED } }),
        prisma.chainExecution.count({ where: { ...whereClause, status: ChainExecutionStatus.FAILED } })
      ]);

      // Get performance aggregates
      const performanceStats = await prisma.chainExecution.aggregate({
        where: { ...whereClause, status: ChainExecutionStatus.COMPLETED },
        _avg: {
          executionTime: true,
          totalCost: true,
          successRate: true
        },
        _sum: {
          totalCost: true
        }
      });

      return {
        chains: {
          total: totalChains,
          active: activeChains,
          inactive: totalChains - activeChains
        },
        executions: {
          total: totalExecutions,
          running: runningExecutions,
          completed: completedExecutions,
          failed: failedExecutions,
          successRate: totalExecutions > 0 ? completedExecutions / totalExecutions : 0
        },
        performance: {
          averageExecutionTime: performanceStats._avg.executionTime || 0,
          averageCost: performanceStats._avg.totalCost || 0,
          averageSuccessRate: performanceStats._avg.successRate || 0,
          totalCost: performanceStats._sum.totalCost || 0
        }
      };
    }),

  /**
   * Get execution logs
   */
  getExecutionLogs: protectedProcedure
    .input(z.object({
      executionId: z.string(),
      includeSteps: z.boolean().default(true),
      includeHandoffs: z.boolean().default(true)
    }))
    .query(async ({ input }) => {
      const execution = await prisma.chainExecution.findUnique({
        where: { id: input.executionId },
        include: {
          steps: input.includeSteps ? {
            orderBy: { stepNumber: 'asc' }
          } : false,
          handoffs: input.includeHandoffs ? {
            orderBy: { handoffNumber: 'asc' }
          } : false
        }
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      return {
        execution: {
          id: execution.id,
          status: execution.status,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          executionTime: execution.executionTime,
          totalCost: execution.totalCost,
          errorDetails: execution.errorDetails
        },
        steps: input.includeSteps ? execution.steps : undefined,
        handoffs: input.includeHandoffs ? execution.handoffs : undefined
      };
    }),

  // Utility endpoints

  /**
   * Validate chain definition
   */
  validateChain: protectedProcedure
    .input(ChainDefinitionSchema)
    .mutation(async ({ input }) => {
      try {
        // Perform validation logic
        const validation = {
          isValid: true,
          errors: [] as string[],
          warnings: [] as string[],
          suggestions: [] as string[]
        };

        // Basic validation
        if (input.steps.length === 0) {
          validation.isValid = false;
          validation.errors.push('Chain must have at least one step');
        }

        // Step numbering validation
        const stepNumbers = input.steps.map(s => s.stepNumber).sort((a, b) => a - b);
        for (let i = 0; i < stepNumbers.length; i++) {
          if (stepNumbers[i] !== i) {
            validation.isValid = false;
            validation.errors.push(`Step numbering must be sequential starting from 0`);
            break;
          }
        }

        // Dependency validation
        for (const step of input.steps) {
          if (step.dependsOn) {
            for (const dep of step.dependsOn) {
              if (!stepNumbers.includes(dep)) {
                validation.isValid = false;
                validation.errors.push(`Step ${step.stepNumber} depends on non-existent step ${dep}`);
              }
              if (dep >= step.stepNumber) {
                validation.isValid = false;
                validation.errors.push(`Step ${step.stepNumber} cannot depend on step ${dep} (circular dependency)`);
              }
            }
          }
        }

        // Performance suggestions
        if (input.steps.length > 5) {
          validation.suggestions.push('Consider breaking down complex chains into smaller, reusable chains');
        }

        if (input.executionMode === ChainExecutionMode.SEQUENTIAL && input.steps.length > 3) {
          validation.suggestions.push('Consider parallel execution for better performance');
        }

        return validation;
      } catch (error) {
        console.error('Chain validation failed:', error);
        throw new Error('Failed to validate chain');
      }
    }),

  /**
   * Get chain health status
   */
  getChainHealth: protectedProcedure
    .input(z.object({ chainId: z.string() }))
    .query(async ({ input }) => {
      const chain = await prisma.agentChain.findUnique({
        where: { id: input.chainId },
        include: {
          executions: {
            where: {
              startedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            },
            orderBy: { startedAt: 'desc' }
          }
        }
      });

      if (!chain) {
        throw new Error('Chain not found');
      }

      const executions = chain.executions;
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === ChainExecutionStatus.COMPLETED).length;
      const failedExecutions = executions.filter(e => e.status === ChainExecutionStatus.FAILED).length;
      const runningExecutions = executions.filter(e => e.status === ChainExecutionStatus.RUNNING).length;

      const health = {
        status: 'healthy' as 'healthy' | 'warning' | 'critical',
        score: 0,
        factors: [] as string[],
        metrics: {
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          runningExecutions,
          successRate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
          averageExecutionTime: executions.reduce((sum, e) => sum + (e.executionTime || 0), 0) / Math.max(1, totalExecutions)
        }
      };

      // Calculate health score
      let score = 100;

      // Success rate impact
      if (health.metrics.successRate < 0.8) {
        score -= 30;
        health.factors.push('Low success rate');
      } else if (health.metrics.successRate < 0.9) {
        score -= 10;
        health.factors.push('Moderate success rate');
      }

      // Execution time impact
      if (health.metrics.averageExecutionTime > 300000) { // 5 minutes
        score -= 20;
        health.factors.push('High execution time');
      }

      // Recent activity impact
      if (totalExecutions === 0) {
        score -= 15;
        health.factors.push('No recent activity');
      }

      // Stuck executions impact
      if (runningExecutions > 0) {
        const stuckExecutions = executions.filter(e => 
          e.status === ChainExecutionStatus.RUNNING && 
          e.startedAt < new Date(Date.now() - 60 * 60 * 1000) // Running for more than 1 hour
        );
        if (stuckExecutions.length > 0) {
          score -= 25;
          health.factors.push('Stuck executions detected');
        }
      }

      health.score = Math.max(0, score);

      // Determine status
      if (health.score >= 80) {
        health.status = 'healthy';
      } else if (health.score >= 60) {
        health.status = 'warning';
      } else {
        health.status = 'critical';
      }

      return health;
    })
});

export default agentChainsRouter; 