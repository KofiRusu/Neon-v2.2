import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  AgentType, 
  LearningTriggerType,
  LearningType,
  AdjustmentType,
  InsightType,
  InsightPriority,
  InsightImpact,
  InsightStatus,
  PrismaClient 
} from '@neon/data-model';
import { 
  FeedbackLoopEngine,
  FeedbackAnalysis,
  LearningContext,
  LearningConfig,
  PerformanceMetrics
} from '@neon/core-agents/learning/FeedbackLoopEngine';
import { AgentMetricsAggregator } from '@neon/core-agents/metrics/AgentMetricsAggregator';

// Initialize dependencies
const prisma = new PrismaClient();
const metricsAggregator = new AgentMetricsAggregator(prisma);
const feedbackEngine = new FeedbackLoopEngine(prisma);

// Input validation schemas
const LearningContextSchema = z.object({
  agentType: z.nativeEnum(AgentType),
  metricType: z.string(),
  metricSubtype: z.string().optional(),
  category: z.string().optional(),
  campaignId: z.string().optional(),
  platform: z.string().optional(),
  region: z.string().optional(),
  timeframe: z.string().optional()
});

const ProcessActionOutcomeSchema = z.object({
  actionLogId: z.string(),
  forceAnalysis: z.boolean().default(false)
});

const BatchLearningSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  metricType: z.string().optional(),
  timeWindow: z.number().min(1).max(168).default(24), // 1 hour to 1 week
  forceRun: z.boolean().default(false)
});

const LearningConfigSchema = z.object({
  enabledLearningTypes: z.array(z.nativeEnum(LearningType)).optional(),
  learningRate: z.number().min(0.01).max(1.0).optional(),
  confidenceThreshold: z.number().min(0.1).max(1.0).optional(),
  minimumSampleSize: z.number().min(1).max(100).optional(),
  maxAdjustmentPercent: z.number().min(0.05).max(1.0).optional(),
  decayRate: z.number().min(0.001).max(0.1).optional(),
  stabilityWeight: z.number().min(0.0).max(1.0).optional(),
  validationRequired: z.boolean().optional(),
  rollbackOnFailure: z.boolean().optional(),
  batchLearningEnabled: z.boolean().optional(),
  crossAgentLearningEnabled: z.boolean().optional()
});

const MetricWeightFilterSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  metricType: z.string().optional(),
  metricSubtype: z.string().optional(),
  category: z.string().optional(),
  campaignId: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

const LearningLogFilterSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  metricType: z.string().optional(),
  triggerType: z.nativeEnum(LearningTriggerType).optional(),
  learningType: z.nativeEnum(LearningType).optional(),
  validated: z.boolean().optional(),
  rolledBack: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

const InsightFilterSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  metricType: z.string().optional(),
  insightType: z.nativeEnum(InsightType).optional(),
  priority: z.nativeEnum(InsightPriority).optional(),
  impact: z.nativeEnum(InsightImpact).optional(),
  status: z.nativeEnum(InsightStatus).optional(),
  dismissed: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

const UpdateInsightSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(InsightStatus).optional(),
  userFeedback: z.string().optional(),
  userRating: z.number().min(1).max(5).optional(),
  dismissed: z.boolean().optional(),
  dismissedReason: z.string().optional()
});

const LearningStatsFilterSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  groupBy: z.enum(['agent', 'metric', 'learning_type', 'trigger_type']).optional()
});

export const learningRouter = router({
  // Process individual action outcome for learning
  processActionOutcome: protectedProcedure
    .input(ProcessActionOutcomeSchema)
    .mutation(async ({ input }) => {
      try {
        const analysis = await feedbackEngine.processActionOutcome(input.actionLogId);
        
        return {
          success: true,
          analysis,
          message: `Action outcome processed: ${analysis.recommendation}`
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to process action outcome: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Run batch learning analysis
  processBatchLearning: protectedProcedure
    .input(BatchLearningSchema)
    .mutation(async ({ input }) => {
      try {
        const { agentType, metricType, timeWindow } = input;
        
        const analyses = await feedbackEngine.processBatchLearning(agentType, metricType, timeWindow);
        
        const successfulAnalyses = analyses.filter(a => a.success);
        const totalAdjustments = analyses.reduce((sum, a) => sum + a.adjustments.length, 0);
        
        return {
          success: true,
          analyses,
          summary: {
            totalAnalyses: analyses.length,
            successfulAnalyses: successfulAnalyses.length,
            totalAdjustments,
            averageConfidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
            averageImprovement: analyses.reduce((sum, a) => sum + a.improvement, 0) / analyses.length
          },
          message: `Batch learning processed ${analyses.length} contexts with ${totalAdjustments} adjustments`
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to process batch learning: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Run scheduled learning analysis
  runScheduledLearning: protectedProcedure
    .mutation(async () => {
      try {
        const result = await feedbackEngine.runScheduledLearning();
        
        return {
          success: true,
          result,
          message: result.summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to run scheduled learning: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get metric weights with filtering and pagination
  getMetricWeights: protectedProcedure
    .input(MetricWeightFilterSchema)
    .query(async ({ input }) => {
      const { limit, offset, ...filters } = input;
      
      const whereClause: any = {};
      
      if (filters.agentType) whereClause.agentType = filters.agentType;
      if (filters.metricType) whereClause.metricType = filters.metricType;
      if (filters.metricSubtype) whereClause.metricSubtype = filters.metricSubtype;
      if (filters.category) whereClause.category = filters.category;
      if (filters.campaignId) whereClause.campaignId = filters.campaignId;
      if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;
      
      const [weights, totalCount] = await Promise.all([
        prisma.metricWeight.findMany({
          where: whereClause,
          orderBy: [
            { performanceScore: 'desc' },
            { lastAdjustment: 'desc' },
            { version: 'desc' }
          ],
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
            previousVersion: {
              select: {
                id: true,
                weight: true,
                threshold: true,
                confidence: true,
                version: true
              }
            }
          }
        }),
        prisma.metricWeight.count({ where: whereClause })
      ]);
      
      return {
        weights,
        totalCount,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      };
    }),
  
  // Get specific metric weight by context
  getMetricWeight: protectedProcedure
    .input(LearningContextSchema)
    .query(async ({ input }) => {
      const weight = await feedbackEngine.getMetricWeights(input);
      
      if (!weight) {
        return {
          weight: null,
          message: 'No metric weight found for this context'
        };
      }
      
      // Get version history
      const versionHistory = await prisma.metricWeight.findMany({
        where: {
          agentType: weight.agentType,
          metricType: weight.metricType,
          metricSubtype: weight.metricSubtype,
          category: weight.category,
          campaignId: weight.campaignId
        },
        orderBy: { version: 'desc' },
        take: 10
      });
      
      return {
        weight,
        versionHistory,
        message: `Found metric weight v${weight.version}`
      };
    }),
  
  // Update metric weight manually
  updateMetricWeight: protectedProcedure
    .input(z.object({
      context: LearningContextSchema,
      weight: z.number().min(0.1).max(10.0).optional(),
      threshold: z.number().optional(),
      confidence: z.number().min(0.0).max(1.0).optional(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const { context, weight, threshold, confidence, reason } = input;
        
        if (!weight && !threshold && !confidence) {
          throw new Error('At least one value (weight, threshold, or confidence) must be provided');
        }
        
        const updatedWeight = await feedbackEngine.updateMetricWeights(
          context,
          weight!,
          threshold,
          confidence,
          undefined // No learning log ID for manual updates
        );
        
        return {
          success: true,
          weight: updatedWeight,
          message: `Metric weight updated manually: ${reason || 'No reason provided'}`
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to update metric weight: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get learning logs with filtering and pagination
  getLearningLogs: protectedProcedure
    .input(LearningLogFilterSchema)
    .query(async ({ input }) => {
      const { limit, offset, startDate, endDate, ...filters } = input;
      
      const whereClause: any = { ...filters };
      
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = new Date(startDate);
        if (endDate) whereClause.createdAt.lte = new Date(endDate);
      }
      
      const [logs, totalCount] = await Promise.all([
        prisma.learningLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            actionLog: {
              select: {
                id: true,
                actionType: true,
                status: true,
                executedAt: true,
                completedAt: true
              }
            },
            metricWeights: {
              select: {
                id: true,
                weight: true,
                threshold: true,
                confidence: true,
                version: true
              },
              take: 5,
              orderBy: { version: 'desc' }
            }
          }
        }),
        prisma.learningLog.count({ where: whereClause })
      ]);
      
      return {
        logs,
        totalCount,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      };
    }),
  
  // Get learning insights with filtering and pagination
  getLearningInsights: protectedProcedure
    .input(InsightFilterSchema)
    .query(async ({ input }) => {
      const { limit, offset, ...filters } = input;
      
      const [insights, totalCount] = await Promise.all([
        prisma.learningInsight.findMany({
          where: filters,
          orderBy: [
            { priority: 'desc' },
            { confidence: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset,
          include: {
            parentInsight: {
              select: {
                id: true,
                title: true,
                insightType: true
              }
            },
            childInsights: {
              select: {
                id: true,
                title: true,
                insightType: true,
                status: true
              },
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        prisma.learningInsight.count({ where: filters })
      ]);
      
      return {
        insights,
        totalCount,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit < totalCount ? offset + limit : null
      };
    }),
  
  // Update learning insight (user feedback, status changes)
  updateLearningInsight: protectedProcedure
    .input(UpdateInsightSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        
        const insight = await prisma.learningInsight.update({
          where: { id },
          data: {
            ...updateData,
            ...(updateData.status === InsightStatus.IMPLEMENTED && {
              implementedAt: new Date()
            }),
            ...(updateData.status === InsightStatus.VALIDATED && {
              validatedAt: new Date()
            }),
            ...(updateData.status === InsightStatus.ARCHIVED && {
              archivedAt: new Date()
            })
          }
        });
        
        return {
          success: true,
          insight,
          message: 'Learning insight updated successfully'
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to update learning insight: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get performance metrics for a context
  getPerformanceMetrics: protectedProcedure
    .input(LearningContextSchema)
    .query(async ({ input }) => {
      try {
        const metrics = await feedbackEngine.analyzePerformanceMetrics(input);
        
        return {
          success: true,
          metrics,
          context: input,
          message: `Performance metrics analyzed for ${input.agentType}:${input.metricType}`
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to get performance metrics: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get learning statistics and analytics
  getLearningStats: protectedProcedure
    .input(LearningStatsFilterSchema)
    .query(async ({ input }) => {
      const { agentType, timeRange, groupBy } = input;
      
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
        createdAt: { gte: startTime }
      };
      
      if (agentType) {
        whereClause.agentType = agentType;
      }
      
      const [logs, insights, weights] = await Promise.all([
        prisma.learningLog.findMany({
          where: whereClause,
          include: {
            actionLog: {
              select: {
                status: true,
                actionType: true
              }
            }
          }
        }),
        prisma.learningInsight.findMany({
          where: {
            ...(agentType && { agentType }),
            createdAt: { gte: startTime }
          }
        }),
        prisma.metricWeight.findMany({
          where: {
            ...(agentType && { agentType }),
            lastAdjustment: { gte: startTime },
            isActive: true
          }
        })
      ]);
      
      // Calculate basic statistics
      const totalLearningEvents = logs.length;
      const successfulLearningEvents = logs.filter(log => log.validated && !log.rolledBack).length;
      const totalAdjustments = logs.reduce((sum, log) => {
        return sum + (log.newValue !== log.previousValue ? 1 : 0);
      }, 0);
      
      const averageLearningRate = logs.reduce((sum, log) => sum + log.learningRate, 0) / 
                                 Math.max(logs.length, 1);
      
      const averageConfidence = logs.reduce((sum, log) => sum + log.confidence, 0) / 
                               Math.max(logs.length, 1);
      
      const totalInsights = insights.length;
      const implementedInsights = insights.filter(i => i.status === InsightStatus.IMPLEMENTED).length;
      
      // Group by specified dimension
      const groupedStats: Record<string, any> = {};
      
      if (groupBy) {
        for (const log of logs) {
          const key = groupBy === 'agent' ? log.agentType :
                     groupBy === 'metric' ? log.metricType :
                     groupBy === 'learning_type' ? log.learningType :
                     groupBy === 'trigger_type' ? log.triggerType :
                     'total';
          
          if (!groupedStats[key]) {
            groupedStats[key] = {
              learningEvents: 0,
              adjustments: 0,
              successRate: 0,
              averageConfidence: 0,
              averageImprovement: 0
            };
          }
          
          groupedStats[key].learningEvents++;
          if (log.newValue !== log.previousValue) {
            groupedStats[key].adjustments++;
          }
          if (log.validated && !log.rolledBack) {
            groupedStats[key].successRate++;
          }
          groupedStats[key].averageConfidence += log.confidence;
          if (log.actualImprovement) {
            groupedStats[key].averageImprovement += log.actualImprovement;
          }
        }
        
        // Calculate averages
        for (const key in groupedStats) {
          const stats = groupedStats[key];
          stats.successRate = stats.successRate / Math.max(stats.learningEvents, 1);
          stats.averageConfidence = stats.averageConfidence / Math.max(stats.learningEvents, 1);
          stats.averageImprovement = stats.averageImprovement / Math.max(stats.learningEvents, 1);
        }
      }
      
      // Learning type breakdown
      const learningTypeBreakdown: Record<string, number> = {};
      for (const log of logs) {
        learningTypeBreakdown[log.learningType] = (learningTypeBreakdown[log.learningType] || 0) + 1;
      }
      
      // Insight type breakdown
      const insightTypeBreakdown: Record<string, number> = {};
      for (const insight of insights) {
        insightTypeBreakdown[insight.insightType] = (insightTypeBreakdown[insight.insightType] || 0) + 1;
      }
      
      return {
        timeRange,
        summary: {
          totalLearningEvents,
          successfulLearningEvents,
          totalAdjustments,
          totalInsights,
          implementedInsights,
          learningSuccessRate: successfulLearningEvents / Math.max(totalLearningEvents, 1),
          insightImplementationRate: implementedInsights / Math.max(totalInsights, 1),
          averageLearningRate,
          averageConfidence
        },
        breakdowns: {
          learningTypes: learningTypeBreakdown,
          insightTypes: insightTypeBreakdown,
          ...(groupBy && { [groupBy]: groupedStats })
        },
        activeWeights: weights.length,
        recentActivity: {
          lastHour: logs.filter(log => 
            log.createdAt >= new Date(Date.now() - 60 * 60 * 1000)
          ).length,
          last6Hours: logs.filter(log => 
            log.createdAt >= new Date(Date.now() - 6 * 60 * 60 * 1000)
          ).length
        }
      };
    }),
  
  // Update learning configuration
  updateLearningConfig: protectedProcedure
    .input(LearningConfigSchema)
    .mutation(async ({ input }) => {
      try {
        feedbackEngine.updateConfig(input);
        
        return {
          success: true,
          config: input,
          message: 'Learning configuration updated successfully'
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
          success: false,
          message: `Failed to update learning configuration: ${errorMessage}`,
          error: errorMessage
        };
      }
    }),
  
  // Get current learning engine status
  getLearningStatus: protectedProcedure
    .query(async () => {
      const insights = feedbackEngine.getInsights();
      
      // Get recent activity
      const recentLogs = await prisma.learningLog.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      const activeWeights = await prisma.metricWeight.count({
        where: { isActive: true }
      });
      
      const pendingInsights = await prisma.learningInsight.count({
        where: { status: InsightStatus.PENDING }
      });
      
      return {
        isActive: true,
        insights: insights.length,
        activeWeights,
        pendingInsights,
        recentActivity: recentLogs.length,
        lastActivity: recentLogs[0]?.createdAt || null,
        status: 'operational'
      };
    }),
  
  // Clear learning cache (utility endpoint)
  clearLearningCache: protectedProcedure
    .mutation(async () => {
      try {
        feedbackEngine.clearCache();
        
        return {
          success: true,
          message: 'Learning cache cleared successfully'
        };
        
      } catch (error) {
        return {
          success: false,
          message: 'Failed to clear learning cache'
        };
      }
    })
});

export default learningRouter; 