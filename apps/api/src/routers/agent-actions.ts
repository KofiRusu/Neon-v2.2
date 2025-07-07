import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  AgentType, 
  ActionType, 
  ActionStatus, 
  ActionPriority,
  AgentActionLog,
  AgentActionRule,
  PrismaClient 
} from '@neon/data-model';
import { 
  AgentActionRunner, 
  ActionRunnerConfig, 
  ActionRunResult 
} from '@neon/core-agents/agents/agent-action-runner';
import { 
  PerformanceActionsRegistry,
  performanceActionsRegistry,
  COMMON_TRIGGER_CONDITIONS
} from '@neon/core-agents/actions/performanceActions';
import { AgentMetricsAggregator } from '@neon/core-agents/metrics/AgentMetricsAggregator';

// Initialize dependencies
const prisma = new PrismaClient();
const metricsAggregator = new AgentMetricsAggregator(prisma);
const actionRunner = new AgentActionRunner(prisma, metricsAggregator);

// Input validation schemas
const AgentActionLogFilterSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  actionType: z.nativeEnum(ActionType).optional(),
  campaignId: z.string().optional(),
  status: z.nativeEnum(ActionStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

const TriggerActionSchema = z.object({
  agentType: z.nativeEnum(AgentType),
  actionType: z.nativeEnum(ActionType),
  campaignId: z.string().optional(),
  actionConfig: z.record(z.any()),
  reason: z.string().optional(),
  priority: z.nativeEnum(ActionPriority).optional()
});

const CreateActionRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  agentType: z.nativeEnum(AgentType),
  actionType: z.nativeEnum(ActionType),
  metricType: z.string(),
  metricSubtype: z.string().optional(),
  category: z.string().optional(),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'change_percent']),
  threshold: z.number(),
  timeWindow: z.number().optional(),
  consecutiveCount: z.number().optional(),
  cooldownPeriod: z.number().optional(),
  priority: z.nativeEnum(ActionPriority).default(ActionPriority.MEDIUM),
  maxRetries: z.number().min(1).max(10).default(3),
  enabled: z.boolean().default(true),
  campaignIds: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  actionConfig: z.record(z.any()).default({}),
  fallbackAction: z.nativeEnum(ActionType).optional(),
  fallbackConfig: z.record(z.any()).optional()
});

const UpdateActionRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'change_percent']).optional(),
  threshold: z.number().optional(),
  timeWindow: z.number().optional(),
  consecutiveCount: z.number().optional(),
  cooldownPeriod: z.number().optional(),
  priority: z.nativeEnum(ActionPriority).optional(),
  maxRetries: z.number().min(1).max(10).optional(),
  enabled: z.boolean().optional(),
  campaignIds: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  actionConfig: z.record(z.any()).optional(),
  fallbackAction: z.nativeEnum(ActionType).optional(),
  fallbackConfig: z.record(z.any()).optional()
});

const ActionStatsFilterSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  actionType: z.nativeEnum(ActionType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['agent', 'action', 'campaign', 'priority']).optional()
});

export const agentActionsRouter = router({
  // Get action logs with filtering, pagination, and sorting
  getActionLogs: protectedProcedure
    .input(AgentActionLogFilterSchema)
    .query(async ({ input }) => {
      const { limit, offset, startDate, endDate, ...filters } = input;
      
      const whereClause: any = { ...filters };
      
      if (startDate || endDate) {
        whereClause.executedAt = {};
        if (startDate) whereClause.executedAt.gte = new Date(startDate);
        if (endDate) whereClause.executedAt.lte = new Date(endDate);
      }
      
      const [logs, totalCount] = await Promise.all([
        prisma.agentActionLog.findMany({
          where: whereClause,
          orderBy: { executedAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true
              }
            },
            metric: {
              select: {
                id: true,
                metricType: true,
                value: true,
                timestamp: true
              }
            }
          }
        }),
        prisma.agentActionLog.count({ where: whereClause })
      ]);
      
      return {
        logs,
        totalCount,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      };
    }),
  
  // Get action log by ID with full details
  getActionLogById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const actionLog = await prisma.agentActionLog.findUnique({
        where: { id: input.id },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              budget: true,
              startDate: true,
              endDate: true
            }
          },
          metric: {
            select: {
              id: true,
              metricType: true,
              metricSubtype: true,
              value: true,
              previousValue: true,
              timestamp: true,
              performance: true
            }
          },
          dependentActions: {
            select: {
              id: true,
              actionType: true,
              status: true,
              executedAt: true
            }
          },
          parentAction: {
            select: {
              id: true,
              actionType: true,
              status: true,
              executedAt: true
            }
          }
        }
      });
      
      if (!actionLog) {
        throw new Error(`Action log ${input.id} not found`);
      }
      
      return actionLog;
    }),
  
  // Trigger a manual action
  triggerAction: protectedProcedure
    .input(TriggerActionSchema)
    .mutation(async ({ input }) => {
      const { agentType, actionType, campaignId, actionConfig, reason, priority } = input;
      
      try {
        // Validate that the agent supports this action
        const registry = PerformanceActionsRegistry.getInstance();
        const actionExecutor = registry.getAction(actionType);
        
        if (!actionExecutor) {
          throw new Error(`Action type ${actionType} not supported`);
        }
        
        if (!actionExecutor.compatibleAgents.includes(agentType)) {
          throw new Error(`Agent type ${agentType} cannot execute action ${actionType}`);
        }
        
        // Create action log for manual trigger
        const actionLog = await prisma.agentActionLog.create({
          data: {
            agentName: `${agentType}_agent`,
            agentType,
            actionType,
            campaignId,
            triggerValue: 0,
            status: ActionStatus.PENDING,
            priority: priority || ActionPriority.MEDIUM,
            maxRetries: actionExecutor.maxRetries,
            notes: reason || 'Manual trigger',
            metadata: {
              manualTrigger: true,
              triggeredBy: 'user',
              triggerReason: reason,
              actionConfig
            }
          }
        });
        
        // Execute the action
        const result = await actionRunner.triggerAction(agentType, actionType, actionConfig, campaignId);
        
        // Update action log with result
        await prisma.agentActionLog.update({
          where: { id: actionLog.id },
          data: {
            status: result.success ? ActionStatus.COMPLETED : ActionStatus.FAILED,
            completedAt: new Date(),
            notes: result.message,
            errorMessage: result.errorDetails,
            impactMetrics: result.impactMetrics,
            rollbackData: result.rollbackData
          }
        });
        
        return {
          actionLogId: actionLog.id,
          success: result.success,
          message: result.message,
          data: result.data,
          impactMetrics: result.impactMetrics
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          actionLogId: null,
          success: false,
          message: `Failed to trigger action: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Run action checks manually
  runActionChecks: protectedProcedure
    .input(z.object({ 
      agentTypes: z.array(z.nativeEnum(AgentType)).optional(),
      campaignIds: z.array(z.string()).optional(),
      dryRun: z.boolean().default(false)
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await actionRunner.runActionChecks();
        
        return {
          success: true,
          result,
          message: `Action checks completed: ${result.summary}`
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Action checks failed: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get action statistics
  getActionStats: protectedProcedure
    .input(ActionStatsFilterSchema)
    .query(async ({ input }) => {
      const { agentType, actionType, startDate, endDate, groupBy } = input;
      
      const whereClause: any = {};
      
      if (agentType) whereClause.agentType = agentType;
      if (actionType) whereClause.actionType = actionType;
      
      if (startDate || endDate) {
        whereClause.executedAt = {};
        if (startDate) whereClause.executedAt.gte = new Date(startDate);
        if (endDate) whereClause.executedAt.lte = new Date(endDate);
      }
      
      const [logs, totalCount] = await Promise.all([
        prisma.agentActionLog.findMany({
          where: whereClause,
          select: {
            id: true,
            agentType: true,
            actionType: true,
            campaignId: true,
            status: true,
            priority: true,
            executedAt: true,
            completedAt: true,
            retryCount: true,
            metadata: true
          }
        }),
        prisma.agentActionLog.count({ where: whereClause })
      ]);
      
      // Calculate basic statistics
      const successful = logs.filter(log => log.status === ActionStatus.COMPLETED);
      const failed = logs.filter(log => log.status === ActionStatus.FAILED);
      const pending = logs.filter(log => log.status === ActionStatus.PENDING);
      
      const avgExecutionTime = logs
        .filter(log => log.completedAt)
        .reduce((acc, log) => {
          const executionTime = log.completedAt!.getTime() - log.executedAt.getTime();
          return acc + executionTime;
        }, 0) / Math.max(successful.length, 1);
      
      const avgRetryCount = logs.reduce((acc, log) => acc + log.retryCount, 0) / Math.max(logs.length, 1);
      
      // Group by specified dimension
      const groupedStats: Record<string, any> = {};
      
      if (groupBy) {
        for (const log of logs) {
          const key = groupBy === 'agent' ? log.agentType :
                     groupBy === 'action' ? log.actionType :
                     groupBy === 'campaign' ? log.campaignId || 'no_campaign' :
                     groupBy === 'priority' ? log.priority :
                     'total';
          
          if (!groupedStats[key]) {
            groupedStats[key] = {
              total: 0,
              successful: 0,
              failed: 0,
              pending: 0,
              avgExecutionTime: 0,
              avgRetryCount: 0
            };
          }
          
          groupedStats[key].total++;
          
          if (log.status === ActionStatus.COMPLETED) {
            groupedStats[key].successful++;
          } else if (log.status === ActionStatus.FAILED) {
            groupedStats[key].failed++;
          } else if (log.status === ActionStatus.PENDING) {
            groupedStats[key].pending++;
          }
          
          groupedStats[key].avgRetryCount += log.retryCount;
          
          if (log.completedAt) {
            const executionTime = log.completedAt.getTime() - log.executedAt.getTime();
            groupedStats[key].avgExecutionTime += executionTime;
          }
        }
        
        // Calculate averages
        for (const key in groupedStats) {
          const stats = groupedStats[key];
          stats.avgRetryCount = stats.avgRetryCount / Math.max(stats.total, 1);
          stats.avgExecutionTime = stats.avgExecutionTime / Math.max(stats.successful, 1);
          stats.successRate = stats.successful / Math.max(stats.total, 1);
          stats.failureRate = stats.failed / Math.max(stats.total, 1);
        }
      }
      
      return {
        totalActions: totalCount,
        successful: successful.length,
        failed: failed.length,
        pending: pending.length,
        successRate: successful.length / Math.max(totalCount, 1),
        failureRate: failed.length / Math.max(totalCount, 1),
        avgExecutionTime,
        avgRetryCount,
        groupedStats: groupBy ? groupedStats : null,
        
        // Recent activity (last 24 hours)
        recentActivity: {
          last24Hours: logs.filter(log => 
            log.executedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
          lastHour: logs.filter(log => 
            log.executedAt >= new Date(Date.now() - 60 * 60 * 1000)
          ).length
        }
      };
    }),
  
  // Get action rules
  getActionRules: protectedProcedure
    .input(z.object({
      agentType: z.nativeEnum(AgentType).optional(),
      actionType: z.nativeEnum(ActionType).optional(),
      enabled: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ input }) => {
      const { limit, offset, ...filters } = input;
      
      const [rules, totalCount] = await Promise.all([
        prisma.agentActionRule.findMany({
          where: filters,
          orderBy: [
            { priority: 'desc' },
            { updatedAt: 'desc' }
          ],
          take: limit,
          skip: offset
        }),
        prisma.agentActionRule.count({ where: filters })
      ]);
      
      return {
        rules,
        totalCount,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      };
    }),
  
  // Create action rule
  createActionRule: protectedProcedure
    .input(CreateActionRuleSchema)
    .mutation(async ({ input }) => {
      try {
        const rule = await prisma.agentActionRule.create({
          data: {
            ...input,
            createdBy: 'system', // TODO: Get from user context
            triggerCount: 0
          }
        });
        
        return {
          success: true,
          rule,
          message: 'Action rule created successfully'
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to create action rule: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Update action rule
  updateActionRule: protectedProcedure
    .input(UpdateActionRuleSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        
        const rule = await prisma.agentActionRule.update({
          where: { id },
          data: updateData
        });
        
        return {
          success: true,
          rule,
          message: 'Action rule updated successfully'
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to update action rule: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Delete action rule
  deleteActionRule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.agentActionRule.delete({
          where: { id: input.id }
        });
        
        return {
          success: true,
          message: 'Action rule deleted successfully'
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to delete action rule: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get supported actions by agent type
  getSupportedActions: protectedProcedure
    .input(z.object({ agentType: z.nativeEnum(AgentType) }))
    .query(async ({ input }) => {
      const registry = PerformanceActionsRegistry.getInstance();
      const compatibleActions = registry.getCompatibleActions(input.agentType);
      
      return {
        agentType: input.agentType,
        supportedActions: compatibleActions.map(action => ({
          actionType: action.actionType,
          description: action.description,
          priority: action.priority,
          maxRetries: action.maxRetries,
          requiredParams: action.requiredParams,
          optionalParams: action.optionalParams,
          fallbackAction: action.fallbackAction
        }))
      };
    }),
  
  // Get common trigger conditions
  getCommonTriggerConditions: protectedProcedure
    .query(async () => {
      return {
        conditions: Object.entries(COMMON_TRIGGER_CONDITIONS).map(([key, condition]) => ({
          name: key,
          description: `Trigger when ${condition.metricType} ${condition.condition.replace('_', ' ')} ${condition.threshold}`,
          ...condition
        }))
      };
    }),
  
  // Get action runner status
  getActionRunnerStatus: protectedProcedure
    .query(async () => {
      const status = actionRunner.getRunnerStatus();
      
      return {
        ...status,
        lastRun: await prisma.agentActionLog.findFirst({
          orderBy: { executedAt: 'desc' },
          select: { executedAt: true }
        })
      };
    }),
  
  // Get dashboard summary for triggered actions
  getTriggeredActionsSummary: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
      agentType: z.nativeEnum(AgentType).optional()
    }))
    .query(async ({ input }) => {
      const { timeRange, agentType } = input;
      
      // Calculate time range
      const now = new Date();
      const timeRangeMap = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const startTime = new Date(now.getTime() - timeRangeMap[timeRange]);
      
      const whereClause: any = {
        executedAt: { gte: startTime }
      };
      
      if (agentType) {
        whereClause.agentType = agentType;
      }
      
      const [logs, activeRules] = await Promise.all([
        prisma.agentActionLog.findMany({
          where: whereClause,
          orderBy: { executedAt: 'desc' },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }),
        prisma.agentActionRule.findMany({
          where: { 
            enabled: true,
            ...(agentType ? { agentType } : {})
          },
          select: {
            id: true,
            name: true,
            agentType: true,
            actionType: true,
            priority: true,
            lastTriggered: true,
            triggerCount: true
          }
        })
      ]);
      
      // Group actions by type and status
      const actionsByType: Record<string, number> = {};
      const actionsByStatus: Record<string, number> = {};
      const actionsByAgent: Record<string, number> = {};
      
      for (const log of logs) {
        actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1;
        actionsByStatus[log.status] = (actionsByStatus[log.status] || 0) + 1;
        actionsByAgent[log.agentType] = (actionsByAgent[log.agentType] || 0) + 1;
      }
      
      // Get recent critical actions
      const criticalActions = logs.filter(log => 
        log.priority === ActionPriority.CRITICAL || 
        log.priority === ActionPriority.EMERGENCY
      );
      
      // Calculate trends
      const midPoint = new Date(startTime.getTime() + (now.getTime() - startTime.getTime()) / 2);
      const firstHalf = logs.filter(log => log.executedAt < midPoint);
      const secondHalf = logs.filter(log => log.executedAt >= midPoint);
      
      const trend = secondHalf.length > firstHalf.length ? 'increasing' :
                   secondHalf.length < firstHalf.length ? 'decreasing' : 'stable';
      
      return {
        timeRange,
        summary: {
          totalActions: logs.length,
          successfulActions: logs.filter(log => log.status === ActionStatus.COMPLETED).length,
          failedActions: logs.filter(log => log.status === ActionStatus.FAILED).length,
          pendingActions: logs.filter(log => log.status === ActionStatus.PENDING).length,
          criticalActions: criticalActions.length,
          trend
        },
        breakdowns: {
          byType: actionsByType,
          byStatus: actionsByStatus,
          byAgent: actionsByAgent
        },
        activeRules: activeRules.length,
        recentCriticalActions: criticalActions.slice(0, 10),
        topTriggeredRules: activeRules
          .filter(rule => rule.triggerCount > 0)
          .sort((a, b) => b.triggerCount - a.triggerCount)
          .slice(0, 10)
      };
    })
});

export default agentActionsRouter; 