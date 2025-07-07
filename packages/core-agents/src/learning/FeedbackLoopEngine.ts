import { 
  AgentType, 
  ActionStatus, 
  AgentActionLog,
  AgentMetric,
  LearningLog,
  MetricWeight,
  LearningInsight,
  LearningTriggerType,
  LearningType,
  AdjustmentType,
  InsightType,
  InsightPriority,
  InsightImpact,
  InsightStatus,
  PrismaClient 
} from '@neon/data-model';

export interface FeedbackAnalysis {
  success: boolean;
  confidence: number;
  improvement: number;
  sampleSize: number;
  recommendation: string;
  adjustments: Array<{
    type: LearningType;
    adjustmentType: AdjustmentType;
    previousValue: number;
    newValue: number;
    confidence: number;
  }>;
}

export interface LearningContext {
  agentType: AgentType;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  campaignId?: string;
  platform?: string;
  region?: string;
  timeframe?: string;
}

export interface LearningConfig {
  enabledLearningTypes: LearningType[];
  learningRate: number;
  confidenceThreshold: number;
  minimumSampleSize: number;
  maxAdjustmentPercent: number;
  decayRate: number;
  stabilityWeight: number;
  validationRequired: boolean;
  rollbackOnFailure: boolean;
  batchLearningEnabled: boolean;
  crossAgentLearningEnabled: boolean;
}

export interface PerformanceMetrics {
  successRate: number;
  averageImprovement: number;
  stability: number;
  reliability: number;
  confidence: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  volatility: number;
}

export interface LearningInsightData {
  type: InsightType;
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  priority: InsightPriority;
  impact: InsightImpact;
  supportingData: Record<string, any>;
  evidenceCount: number;
  sampleSize: number;
  predictedImprovement?: number;
  suggestedActions: string[];
}

export class FeedbackLoopEngine {
  private prisma: PrismaClient;
  private config: LearningConfig;
  private learningCache: Map<string, any> = new Map();
  private insights: LearningInsightData[] = [];

  constructor(prisma: PrismaClient, config: Partial<LearningConfig> = {}) {
    this.prisma = prisma;
    this.config = {
      enabledLearningTypes: [
        LearningType.WEIGHT_ADJUSTMENT,
        LearningType.THRESHOLD_CALIBRATION,
        LearningType.CONFIDENCE_TUNING,
        LearningType.SCORING_RECALIBRATION
      ],
      learningRate: 0.1,
      confidenceThreshold: 0.6,
      minimumSampleSize: 5,
      maxAdjustmentPercent: 0.3,
      decayRate: 0.01,
      stabilityWeight: 0.2,
      validationRequired: true,
      rollbackOnFailure: true,
      batchLearningEnabled: true,
      crossAgentLearningEnabled: true,
      ...config
    };
  }

  /**
   * Main learning entry point - analyzes action outcomes and triggers learning
   */
  public async processActionOutcome(actionLogId: string): Promise<FeedbackAnalysis> {
    const actionLog = await this.getActionLogWithContext(actionLogId);
    if (!actionLog) {
      throw new Error(`Action log ${actionLogId} not found`);
    }

    const context = this.extractLearningContext(actionLog);
    const analysis = await this.analyzeActionOutcome(actionLog, context);
    
    if (analysis.success && analysis.confidence >= this.config.confidenceThreshold) {
      await this.applyLearningAdjustments(context, analysis, actionLog);
      await this.generateInsights(context, analysis, actionLog);
    }

    await this.logLearningEvent(context, analysis, actionLog);
    
    return analysis;
  }

  /**
   * Batch learning process - analyzes multiple actions together
   */
  public async processBatchLearning(
    agentType?: AgentType,
    metricType?: string,
    timeWindow?: number // hours
  ): Promise<FeedbackAnalysis[]> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cutoffTime = new Date();
    if (timeWindow) {
      cutoffTime.setHours(cutoffTime.getHours() - timeWindow);
    } else {
      cutoffTime.setHours(cutoffTime.getHours() - 24); // Default 24 hours
    }

    const actionLogs = await this.prisma.agentActionLog.findMany({
      where: {
        ...(agentType && { agentType }),
        completedAt: { gte: cutoffTime },
        status: { in: [ActionStatus.COMPLETED, ActionStatus.FAILED] }
      },
      include: {
        campaign: true,
        metric: true
      },
      orderBy: { completedAt: 'desc' },
      take: 1000 // Limit for performance
    });

    console.log(`Processing batch learning for ${actionLogs.length} actions`);

    const analyses: FeedbackAnalysis[] = [];
    const contextGroups = this.groupActionsByContext(actionLogs);

    for (const [contextKey, actions] of contextGroups) {
      const context = JSON.parse(contextKey) as LearningContext;
      const batchAnalysis = await this.analyzeBatchOutcomes(actions, context, batchId);
      
      if (batchAnalysis.success && batchAnalysis.confidence >= this.config.confidenceThreshold) {
        await this.applyLearningAdjustments(context, batchAnalysis, actions[0], batchId);
        await this.generateInsights(context, batchAnalysis, actions[0]);
      }

      analyses.push(batchAnalysis);
    }

    console.log(`Batch learning completed: ${analyses.length} contexts processed`);
    return analyses;
  }

  /**
   * Scheduled learning analysis - runs periodically to optimize the system
   */
  public async runScheduledLearning(): Promise<{
    totalAnalyses: number;
    successfulAdjustments: number;
    newInsights: number;
    summary: string;
  }> {
    console.log('Starting scheduled learning analysis...');
    
    // Process recent action outcomes
    const recentAnalyses = await this.processBatchLearning();
    
    // Analyze metric drift and patterns
    const driftAnalyses = await this.analyzeMetricDrift();
    
    // Cross-agent learning
    const crossAgentInsights = await this.performCrossAgentLearning();
    
    // Performance optimization
    const optimizationResults = await this.optimizePerformanceWeights();
    
    // Generate summary insights
    const summaryInsights = await this.generateSummaryInsights();

    const totalAnalyses = recentAnalyses.length + driftAnalyses.length;
    const successfulAdjustments = recentAnalyses.filter(a => a.success).length + 
                                  driftAnalyses.filter(a => a.success).length;
    const newInsights = crossAgentInsights.length + summaryInsights.length;

    const summary = `Processed ${totalAnalyses} analyses, made ${successfulAdjustments} adjustments, generated ${newInsights} insights`;
    
    console.log(`Scheduled learning completed: ${summary}`);
    
    return {
      totalAnalyses,
      successfulAdjustments,
      newInsights,
      summary
    };
  }

  /**
   * Get current metric weights for a context
   */
  public async getMetricWeights(context: LearningContext): Promise<MetricWeight | null> {
    return await this.prisma.metricWeight.findFirst({
      where: {
        agentType: context.agentType,
        metricType: context.metricType,
        metricSubtype: context.metricSubtype,
        category: context.category,
        campaignId: context.campaignId,
        isActive: true
      },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Update metric weights based on learning
   */
  public async updateMetricWeights(
    context: LearningContext,
    newWeight: number,
    newThreshold?: number,
    newConfidence?: number,
    learningLogId?: string
  ): Promise<MetricWeight> {
    const existing = await this.getMetricWeights(context);
    
    if (existing) {
      // Create new version
      const updated = await this.prisma.metricWeight.create({
        data: {
          agentType: existing.agentType,
          metricType: existing.metricType,
          metricSubtype: existing.metricSubtype,
          category: existing.category,
          campaignId: existing.campaignId,
          platform: existing.platform,
          region: existing.region,
          timeframe: existing.timeframe,
          weight: newWeight,
          baselineWeight: existing.baselineWeight,
          threshold: newThreshold ?? existing.threshold,
          baselineThreshold: existing.baselineThreshold,
          thresholdDirection: existing.thresholdDirection,
          confidence: newConfidence ?? existing.confidence,
          reliability: existing.reliability,
          sampleSize: existing.sampleSize + 1,
          performanceScore: existing.performanceScore,
          successRate: existing.successRate,
          adjustmentCount: existing.adjustmentCount + 1,
          lastAdjustment: new Date(),
          totalImprovement: existing.totalImprovement,
          isActive: true,
          isValidated: false,
          learningRate: existing.learningRate,
          decayRate: existing.decayRate,
          stabilityScore: existing.stabilityScore,
          version: existing.version + 1,
          previousVersionId: existing.id,
          metadata: {
            ...existing.metadata as Record<string, any>,
            learningLogId,
            adjustmentReason: 'feedback_learning',
            adjustmentTimestamp: new Date().toISOString()
          }
        }
      });

      // Deactivate old version
      await this.prisma.metricWeight.update({
        where: { id: existing.id },
        data: { isActive: false }
      });

      return updated;
    } else {
      // Create new metric weight
      return await this.prisma.metricWeight.create({
        data: {
          agentType: context.agentType,
          metricType: context.metricType,
          metricSubtype: context.metricSubtype,
          category: context.category,
          campaignId: context.campaignId,
          weight: newWeight,
          baselineWeight: newWeight,
          threshold: newThreshold,
          baselineThreshold: newThreshold,
          confidence: newConfidence ?? 0.5,
          reliability: 0.5,
          sampleSize: 1,
          performanceScore: 0.0,
          successRate: 0.0,
          adjustmentCount: 1,
          lastAdjustment: new Date(),
          totalImprovement: 0.0,
          isActive: true,
          isValidated: false,
          learningRate: this.config.learningRate,
          decayRate: this.config.decayRate,
          stabilityScore: 0.0,
          version: 1,
          metadata: {
            learningLogId,
            creationReason: 'feedback_learning',
            createdAt: new Date().toISOString()
          }
        }
      });
    }
  }

  /**
   * Analyze performance metrics for a context
   */
  public async analyzePerformanceMetrics(context: LearningContext): Promise<PerformanceMetrics> {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 30); // Last 30 days

    const actionLogs = await this.prisma.agentActionLog.findMany({
      where: {
        agentType: context.agentType,
        completedAt: { gte: cutoffTime },
        status: { in: [ActionStatus.COMPLETED, ActionStatus.FAILED] }
      },
      include: { metric: true },
      orderBy: { completedAt: 'desc' }
    });

    const filteredLogs = actionLogs.filter(log => 
      log.metric?.metricType === context.metricType &&
      (!context.metricSubtype || log.metric?.metricSubtype === context.metricSubtype) &&
      (!context.category || log.metric?.category === context.category)
    );

    if (filteredLogs.length === 0) {
      return {
        successRate: 0,
        averageImprovement: 0,
        stability: 0,
        reliability: 0,
        confidence: 0,
        trendDirection: 'stable',
        volatility: 0
      };
    }

    const successfulActions = filteredLogs.filter(log => log.status === ActionStatus.COMPLETED);
    const successRate = successfulActions.length / filteredLogs.length;

    // Calculate average improvement from impact metrics
    const improvements = successfulActions
      .map(log => this.extractImprovementFromMetrics(log.impactMetrics as Record<string, any>))
      .filter(imp => imp !== null) as number[];
    
    const averageImprovement = improvements.length > 0 ? 
      improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length : 0;

    // Calculate stability and volatility
    const performances = filteredLogs.map(log => log.triggerValue);
    const avgPerformance = performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const variance = performances.reduce((sum, p) => sum + Math.pow(p - avgPerformance, 2), 0) / performances.length;
    const volatility = Math.sqrt(variance) / avgPerformance;
    const stability = Math.max(0, 1 - volatility);

    // Calculate trend direction
    const recentHalf = filteredLogs.slice(0, Math.floor(filteredLogs.length / 2));
    const olderHalf = filteredLogs.slice(Math.floor(filteredLogs.length / 2));
    
    const recentAvg = recentHalf.reduce((sum, log) => sum + log.triggerValue, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, log) => sum + log.triggerValue, 0) / olderHalf.length;
    
    const trendChange = (recentAvg - olderAvg) / olderAvg;
    const trendDirection = trendChange > 0.1 ? 'improving' : 
                          trendChange < -0.1 ? 'declining' : 'stable';

    const reliability = Math.min(1, filteredLogs.length / this.config.minimumSampleSize);
    const confidence = (successRate + stability + reliability) / 3;

    return {
      successRate,
      averageImprovement,
      stability,
      reliability,
      confidence,
      trendDirection,
      volatility
    };
  }

  // Private methods

  private async getActionLogWithContext(actionLogId: string): Promise<any> {
    return await this.prisma.agentActionLog.findUnique({
      where: { id: actionLogId },
      include: {
        campaign: true,
        metric: true,
        parentAction: true,
        dependentActions: true
      }
    });
  }

  private extractLearningContext(actionLog: any): LearningContext {
    return {
      agentType: actionLog.agentType,
      metricType: actionLog.metric?.metricType || 'unknown',
      metricSubtype: actionLog.metric?.metricSubtype,
      category: actionLog.metric?.category,
      campaignId: actionLog.campaignId,
      platform: actionLog.metric?.platform,
      region: actionLog.metric?.region,
      timeframe: actionLog.metric?.timeframe
    };
  }

  private async analyzeActionOutcome(actionLog: any, context: LearningContext): Promise<FeedbackAnalysis> {
    const isSuccess = actionLog.status === ActionStatus.COMPLETED;
    const hasImpact = actionLog.impactMetrics && Object.keys(actionLog.impactMetrics).length > 0;
    
    // Calculate improvement from impact metrics
    const improvement = this.extractImprovementFromMetrics(actionLog.impactMetrics as Record<string, any>) || 0;
    
    // Get historical performance for this context
    const performanceMetrics = await this.analyzePerformanceMetrics(context);
    
    // Calculate confidence based on multiple factors
    const confidenceFactors = {
      outcome: isSuccess ? 0.8 : 0.2,
      impact: hasImpact ? 0.7 : 0.3,
      consistency: performanceMetrics.successRate,
      stability: performanceMetrics.stability,
      sampleSize: Math.min(1, performanceMetrics.reliability)
    };
    
    const confidence = Object.values(confidenceFactors).reduce((sum, factor) => sum + factor, 0) / 
                      Object.keys(confidenceFactors).length;

    // Generate adjustment recommendations
    const adjustments = await this.generateAdjustmentRecommendations(
      context, 
      actionLog, 
      performanceMetrics, 
      improvement
    );

    return {
      success: isSuccess && hasImpact,
      confidence,
      improvement,
      sampleSize: 1,
      recommendation: this.generateRecommendationText(context, performanceMetrics, improvement),
      adjustments
    };
  }

  private async analyzeBatchOutcomes(
    actionLogs: any[], 
    context: LearningContext, 
    batchId: string
  ): Promise<FeedbackAnalysis> {
    const successfulActions = actionLogs.filter(log => log.status === ActionStatus.COMPLETED);
    const successRate = successfulActions.length / actionLogs.length;
    
    // Calculate batch improvements
    const improvements = actionLogs
      .map(log => this.extractImprovementFromMetrics(log.impactMetrics as Record<string, any>))
      .filter(imp => imp !== null) as number[];
    
    const averageImprovement = improvements.length > 0 ? 
      improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length : 0;
    
    // Calculate batch confidence
    const confidence = Math.min(1, (successRate + Math.min(1, actionLogs.length / this.config.minimumSampleSize)) / 2);
    
    // Generate batch adjustments
    const adjustments = await this.generateBatchAdjustmentRecommendations(
      context, 
      actionLogs, 
      successRate, 
      averageImprovement
    );

    return {
      success: successRate >= 0.6 && averageImprovement > 0,
      confidence,
      improvement: averageImprovement,
      sampleSize: actionLogs.length,
      recommendation: `Batch analysis of ${actionLogs.length} actions with ${(successRate * 100).toFixed(1)}% success rate`,
      adjustments
    };
  }

  private groupActionsByContext(actionLogs: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    for (const log of actionLogs) {
      const context = this.extractLearningContext(log);
      const key = JSON.stringify({
        agentType: context.agentType,
        metricType: context.metricType,
        metricSubtype: context.metricSubtype,
        category: context.category
      });
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(log);
    }
    
    return groups;
  }

  private async generateAdjustmentRecommendations(
    context: LearningContext,
    actionLog: any,
    performanceMetrics: PerformanceMetrics,
    improvement: number
  ): Promise<any[]> {
    const adjustments: any[] = [];
    const currentWeights = await this.getMetricWeights(context);
    
    // Weight adjustment based on success and improvement
    if (this.config.enabledLearningTypes.includes(LearningType.WEIGHT_ADJUSTMENT)) {
      const currentWeight = currentWeights?.weight || 1.0;
      const adjustmentFactor = improvement > 0 ? (1 + this.config.learningRate * improvement) : 
                              (1 - this.config.learningRate * Math.abs(improvement));
      const newWeight = Math.max(0.1, Math.min(3.0, currentWeight * adjustmentFactor));
      
      if (Math.abs(newWeight - currentWeight) > 0.01) {
        adjustments.push({
          type: LearningType.WEIGHT_ADJUSTMENT,
          adjustmentType: newWeight > currentWeight ? AdjustmentType.INCREASE : AdjustmentType.DECREASE,
          previousValue: currentWeight,
          newValue: newWeight,
          confidence: performanceMetrics.confidence
        });
      }
    }
    
    // Threshold calibration
    if (this.config.enabledLearningTypes.includes(LearningType.THRESHOLD_CALIBRATION) && currentWeights?.threshold) {
      const currentThreshold = currentWeights.threshold;
      const thresholdAdjustment = actionLog.status === ActionStatus.COMPLETED ? 
        (actionLog.triggerValue * 0.95) : (actionLog.triggerValue * 1.05);
      
      if (Math.abs(thresholdAdjustment - currentThreshold) / currentThreshold > 0.05) {
        adjustments.push({
          type: LearningType.THRESHOLD_CALIBRATION,
          adjustmentType: AdjustmentType.CALIBRATE,
          previousValue: currentThreshold,
          newValue: thresholdAdjustment,
          confidence: performanceMetrics.confidence
        });
      }
    }
    
    // Confidence tuning
    if (this.config.enabledLearningTypes.includes(LearningType.CONFIDENCE_TUNING)) {
      const currentConfidence = currentWeights?.confidence || 0.5;
      const newConfidence = Math.max(0.1, Math.min(1.0, 
        currentConfidence + (performanceMetrics.successRate - 0.5) * this.config.learningRate));
      
      if (Math.abs(newConfidence - currentConfidence) > 0.02) {
        adjustments.push({
          type: LearningType.CONFIDENCE_TUNING,
          adjustmentType: newConfidence > currentConfidence ? AdjustmentType.INCREASE : AdjustmentType.DECREASE,
          previousValue: currentConfidence,
          newValue: newConfidence,
          confidence: performanceMetrics.confidence
        });
      }
    }
    
    return adjustments;
  }

  private async generateBatchAdjustmentRecommendations(
    context: LearningContext,
    actionLogs: any[],
    successRate: number,
    averageImprovement: number
  ): Promise<any[]> {
    const adjustments: any[] = [];
    const currentWeights = await this.getMetricWeights(context);
    
    // More conservative batch adjustments
    const batchLearningRate = this.config.learningRate * 0.5;
    
    if (this.config.enabledLearningTypes.includes(LearningType.WEIGHT_ADJUSTMENT)) {
      const currentWeight = currentWeights?.weight || 1.0;
      const adjustmentFactor = averageImprovement > 0 ? 
        (1 + batchLearningRate * averageImprovement * successRate) : 
        (1 - batchLearningRate * Math.abs(averageImprovement) * (1 - successRate));
      const newWeight = Math.max(0.1, Math.min(3.0, currentWeight * adjustmentFactor));
      
      if (Math.abs(newWeight - currentWeight) > 0.02) {
        adjustments.push({
          type: LearningType.WEIGHT_ADJUSTMENT,
          adjustmentType: newWeight > currentWeight ? AdjustmentType.INCREASE : AdjustmentType.DECREASE,
          previousValue: currentWeight,
          newValue: newWeight,
          confidence: Math.min(1, actionLogs.length / this.config.minimumSampleSize)
        });
      }
    }
    
    return adjustments;
  }

  private extractImprovementFromMetrics(impactMetrics: Record<string, any> | null): number | null {
    if (!impactMetrics) return null;
    
    // Extract improvement indicators from impact metrics
    const improvementKeys = ['improvement', 'performance_gain', 'efficiency_gain', 'success_rate_improvement'];
    
    for (const key of improvementKeys) {
      if (key in impactMetrics && typeof impactMetrics[key] === 'number') {
        return impactMetrics[key];
      }
    }
    
    // Calculate improvement from budget changes, CTR improvements, etc.
    if (impactMetrics.budgetChange && impactMetrics.performance) {
      return impactMetrics.performance * 0.01; // Convert percentage to decimal
    }
    
    return 0;
  }

  private generateRecommendationText(
    context: LearningContext, 
    performanceMetrics: PerformanceMetrics, 
    improvement: number
  ): string {
    const agent = context.agentType.toLowerCase();
    const metric = context.metricType;
    const successRate = (performanceMetrics.successRate * 100).toFixed(1);
    
    if (improvement > 0.1) {
      return `${agent} agent shows strong performance on ${metric} (${successRate}% success rate). Consider increasing weight and expanding usage.`;
    } else if (improvement < -0.1) {
      return `${agent} agent performance on ${metric} needs attention (${successRate}% success rate). Consider threshold adjustment or strategy review.`;
    } else {
      return `${agent} agent performance on ${metric} is stable (${successRate}% success rate). Continue monitoring for optimization opportunities.`;
    }
  }

  private async applyLearningAdjustments(
    context: LearningContext,
    analysis: FeedbackAnalysis,
    actionLog: any,
    batchId?: string
  ): Promise<void> {
    for (const adjustment of analysis.adjustments) {
      if (adjustment.type === LearningType.WEIGHT_ADJUSTMENT) {
        await this.updateMetricWeights(
          context,
          adjustment.newValue,
          undefined,
          undefined,
          actionLog.id
        );
      } else if (adjustment.type === LearningType.THRESHOLD_CALIBRATION) {
        await this.updateMetricWeights(
          context,
          undefined,
          adjustment.newValue,
          undefined,
          actionLog.id
        );
      } else if (adjustment.type === LearningType.CONFIDENCE_TUNING) {
        await this.updateMetricWeights(
          context,
          undefined,
          undefined,
          adjustment.newValue,
          actionLog.id
        );
      }
    }
  }

  private async generateInsights(
    context: LearningContext,
    analysis: FeedbackAnalysis,
    actionLog: any
  ): Promise<void> {
    // Generate performance insights
    if (analysis.improvement > 0.2) {
      const insight: LearningInsightData = {
        type: InsightType.PERFORMANCE_ANOMALY,
        title: `High Performance Detected: ${context.agentType} - ${context.metricType}`,
        description: `Exceptional performance improvement (${(analysis.improvement * 100).toFixed(1)}%) detected`,
        recommendation: 'Consider replicating this configuration across similar contexts',
        confidence: analysis.confidence,
        priority: InsightPriority.HIGH,
        impact: InsightImpact.HIGH,
        supportingData: { analysis, actionLog: actionLog.id },
        evidenceCount: analysis.sampleSize,
        sampleSize: analysis.sampleSize,
        predictedImprovement: analysis.improvement * 1.2,
        suggestedActions: ['ADJUST_BUDGET_UP', 'OPTIMIZE_TARGETING', 'UPDATE_STRATEGY']
      };
      
      this.insights.push(insight);
      await this.saveInsightToDatabase(insight, context);
    }
    
    // Generate threshold optimization insights
    const thresholdAdjustment = analysis.adjustments.find(a => 
      a.type === LearningType.THRESHOLD_CALIBRATION
    );
    
    if (thresholdAdjustment) {
      const insight: LearningInsightData = {
        type: InsightType.THRESHOLD_OPTIMIZATION,
        title: `Threshold Optimization: ${context.metricType}`,
        description: `Optimal threshold identified for improved trigger accuracy`,
        recommendation: `Adjust threshold from ${thresholdAdjustment.previousValue} to ${thresholdAdjustment.newValue}`,
        confidence: thresholdAdjustment.confidence,
        priority: InsightPriority.MEDIUM,
        impact: InsightImpact.MEDIUM,
        supportingData: { thresholdAdjustment, analysis },
        evidenceCount: analysis.sampleSize,
        sampleSize: analysis.sampleSize,
        suggestedActions: ['UPDATE_STRATEGY', 'NOTIFY_TEAM']
      };
      
      this.insights.push(insight);
      await this.saveInsightToDatabase(insight, context);
    }
  }

  private async saveInsightToDatabase(insight: LearningInsightData, context: LearningContext): Promise<void> {
    await this.prisma.learningInsight.create({
      data: {
        agentType: context.agentType,
        metricType: context.metricType,
        metricSubtype: context.metricSubtype,
        category: context.category,
        insightType: insight.type,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        confidence: insight.confidence,
        priority: insight.priority,
        impact: insight.impact,
        supportingData: insight.supportingData,
        evidenceCount: insight.evidenceCount,
        sampleSize: insight.sampleSize,
        predictedImprovement: insight.predictedImprovement,
        suggestedActions: insight.suggestedActions,
        status: InsightStatus.PENDING
      }
    });
  }

  private async logLearningEvent(
    context: LearningContext,
    analysis: FeedbackAnalysis,
    actionLog: any,
    batchId?: string
  ): Promise<void> {
    const learningTypes = analysis.adjustments.map(a => a.type);
    
    for (let i = 0; i < learningTypes.length; i++) {
      const adjustment = analysis.adjustments[i];
      
      await this.prisma.learningLog.create({
        data: {
          agentType: context.agentType,
          metricType: context.metricType,
          metricSubtype: context.metricSubtype,
          category: context.category,
          triggerType: batchId ? LearningTriggerType.SCHEDULED_ANALYSIS : LearningTriggerType.ACTION_OUTCOME,
          actionLogId: actionLog.id,
          batchId,
          inputMetrics: { triggerValue: actionLog.triggerValue, threshold: actionLog.threshold },
          actionTaken: actionLog.actionType,
          actionOutcome: actionLog.status,
          learningType: adjustment.type,
          adjustmentType: adjustment.adjustmentType,
          previousValue: adjustment.previousValue,
          newValue: adjustment.newValue,
          algorithm: 'weighted_average',
          learningRate: this.config.learningRate,
          confidence: adjustment.confidence,
          sampleSize: analysis.sampleSize,
          expectedImprovement: analysis.improvement,
          validated: false,
          metadata: {
            analysis,
            context,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  }

  // Placeholder methods for additional learning features
  private async analyzeMetricDrift(): Promise<FeedbackAnalysis[]> {
    // Implement metric drift analysis
    return [];
  }

  private async performCrossAgentLearning(): Promise<LearningInsightData[]> {
    // Implement cross-agent learning
    return [];
  }

  private async optimizePerformanceWeights(): Promise<{ optimized: number; improved: number }> {
    // Implement performance weight optimization
    return { optimized: 0, improved: 0 };
  }

  private async generateSummaryInsights(): Promise<LearningInsightData[]> {
    // Implement summary insight generation
    return [];
  }

  // Public utility methods
  public clearCache(): void {
    this.learningCache.clear();
  }

  public getInsights(): LearningInsightData[] {
    return [...this.insights];
  }

  public updateConfig(newConfig: Partial<LearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
} 