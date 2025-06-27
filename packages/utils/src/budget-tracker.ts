import { db as prisma } from '@neon/data-model';

// Define AgentType enum locally
enum AgentType {
  CONTENT = 'CONTENT',
  SEO = 'SEO',
  EMAIL_MARKETING = 'EMAIL_MARKETING',
  SOCIAL_POSTING = 'SOCIAL_POSTING',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  AD = 'AD',
  OUTREACH = 'OUTREACH',
  TREND = 'TREND',
  INSIGHT = 'INSIGHT',
  DESIGN = 'DESIGN',
  BRAND_VOICE = 'BRAND_VOICE',
  GOAL_PLANNER = 'GOAL_PLANNER',
  PATTERN_MINER = 'PATTERN_MINER',
  SEGMENT_ANALYZER = 'SEGMENT_ANALYZER',
}

type AgentType = keyof typeof AGENT_COST_PER_1K_TOKENS;

// Agent cost mapping (cost per 1K tokens) - keep in sync with server router
export const AGENT_COST_PER_1K_TOKENS = {
  CONTENT: 0.04,
  SEO: 0.03,
  EMAIL_MARKETING: 0.05,
  SOCIAL_POSTING: 0.03,
  CUSTOMER_SUPPORT: 0.04,
  AD: 0.06,
  OUTREACH: 0.04,
  TREND: 0.03,
  INSIGHT: 0.05,
  DESIGN: 0.07,
  BRAND_VOICE: 0.04,
  GOAL_PLANNER: 0.05,
  PATTERN_MINER: 0.04,
  SEGMENT_ANALYZER: 0.05,
} as const;

export interface BudgetStatus {
  canExecute: boolean;
  isOverBudget: boolean;
  overrideEnabled: boolean;
  utilizationPercentage: number;
  totalSpent?: number;
  totalBudget?: number;
  remainingBudget?: number;
}

export interface CostTrackingOptions {
  agentType: AgentType;
  campaignId?: string;
  tokens: number;
  task?: string;
  executionId?: string;
  metadata?: any;
  impactScore?: number;
  conversionAchieved?: boolean;
  qualityScore?: number;
  retryCount?: number;
  executionTime?: number;
  region?: string;
}

export class BudgetTracker {
  /**
   * Check if the current budget allows for agent execution
   */
  static async checkBudgetStatus(month?: string): Promise<BudgetStatus> {
    const currentMonth = month || new Date().toISOString().substring(0, 7);

    try {
      const monthlyBudget = await prisma.monthlyBudget.findUnique({
        where: { month: currentMonth },
      });

      if (!monthlyBudget) {
        return {
          canExecute: true,
          isOverBudget: false,
          overrideEnabled: false,
          utilizationPercentage: 0,
        };
      }

      const isOverBudget = monthlyBudget.totalSpent > monthlyBudget.totalBudget;
      const utilizationPercentage = (monthlyBudget.totalSpent / monthlyBudget.totalBudget) * 100;

      // Note: Budget override is handled at the API level, we assume execution is allowed if this is called
      const canExecute = !isOverBudget;

      return {
        canExecute,
        isOverBudget,
        overrideEnabled: false, // This would need to be passed from API context
        utilizationPercentage,
        totalSpent: monthlyBudget.totalSpent,
        totalBudget: monthlyBudget.totalBudget,
        remainingBudget: monthlyBudget.totalBudget - monthlyBudget.totalSpent,
      };
    } catch (error) {
      console.error('Failed to check budget status:', error);
      // In case of error, allow execution but log the issue
      return {
        canExecute: true,
        isOverBudget: false,
        overrideEnabled: false,
        utilizationPercentage: 0,
      };
    }
  }

  /**
   * Log agent execution cost and update budget tracking
   */
  static async trackCost(options: CostTrackingOptions): Promise<void> {
    const {
      agentType,
      campaignId,
      tokens,
      task,
      executionId,
      metadata,
      region = 'UAE',
      ...costEfficiencyMetrics
    } = options;

    try {
      // Calculate cost based on agent type and tokens
      const costPer1K = AGENT_COST_PER_1K_TOKENS[agentType] || 0.04;
      const cost = (tokens / 1000) * costPer1K;

      // Log the billing entry
      await prisma.billingLog.create({
        data: {
          agentType,
          campaignId,
          tokens,
          cost,
          task,
          executionId,
          metadata,
          impactScore: costEfficiencyMetrics.impactScore,
          conversionAchieved: costEfficiencyMetrics.conversionAchieved,
          qualityScore: costEfficiencyMetrics.qualityScore,
          retryCount: costEfficiencyMetrics.retryCount,
          executionTime: costEfficiencyMetrics.executionTime,
        },
      });

      // Also track execution metrics for launch intelligence (if campaign is specified)
      if (campaignId) {
        await this.trackExecutionMetrics({
          campaignId,
          agentType,
          success: costEfficiencyMetrics.conversionAchieved !== false, // Default to true if not specified
          executionTime: costEfficiencyMetrics.executionTime || 0,
          cost,
          region,
        });
      }

      // Update campaign cost if campaign is specified
      if (campaignId) {
        const currentMonth = new Date().toISOString().substring(0, 7);

        await prisma.campaignCost.upsert({
          where: {
            campaignId,
          },
          update: {
            totalCost: {
              increment: cost,
            },
            currentMonth,
          },
          create: {
            campaignId,
            totalCost: cost,
            currentMonth,
          },
        });
      }

      // Update monthly budget
      const currentMonth = new Date().toISOString().substring(0, 7);
      await prisma.monthlyBudget.upsert({
        where: {
          month: currentMonth,
        },
        update: {
          totalSpent: {
            increment: cost,
          },
        },
        create: {
          month: currentMonth,
          totalSpent: cost,
        },
      });

      console.log(`✅ Cost tracked: $${cost.toFixed(4)} for ${agentType} (${tokens} tokens)`);
    } catch (error) {
      console.error('Failed to track agent cost:', error);
      // Don't throw error as this shouldn't break agent execution
    }
  }

  /**
   * Track execution metrics for launch intelligence
   */
  static async trackExecutionMetrics(options: {
    campaignId: string;
    agentType: AgentType;
    success: boolean;
    executionTime: number;
    cost: number;
    region: string;
  }): Promise<void> {
    const { campaignId, agentType, success, executionTime, cost, region } = options;

    try {
      const now = new Date();
      const hour = now.getHours();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      await prisma.campaignExecutionMetric.upsert({
        where: {
          campaignId_agentType_date_hour: {
            campaignId,
            agentType,
            date,
            hour,
          },
        },
        update: {
          executionCount: { increment: 1 },
          successCount: success ? { increment: 1 } : undefined,
          failureCount: !success ? { increment: 1 } : undefined,
          totalCost: { increment: cost },
          avgExecutionTime: {
            // Simple running average update
            increment: executionTime / 1000, // Convert to seconds
          },
        },
        create: {
          campaignId,
          agentType,
          date,
          hour,
          region,
          executionCount: 1,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          totalCost: cost,
          avgExecutionTime: executionTime / 1000, // Convert to seconds
        },
      });
    } catch (error) {
      console.error('Failed to track execution metrics:', error);
      // Don't throw error as this shouldn't break agent execution
    }
  }

  /**
   * Track sentiment data for launch intelligence
   */
  static async trackSentiment(options: {
    text: string;
    platform: string;
    language: string;
    campaignId?: string;
    source: string;
    region?: string;
    metadata?: any;
  }): Promise<void> {
    const { text, platform, language, campaignId, source, region = 'UAE', metadata } = options;

    try {
      // Simple sentiment analysis (in production, use proper NLP service)
      const sentiment = this.analyzeSentiment(text, language);

      await prisma.sentimentAnalysis.create({
        data: {
          text,
          platform: platform as any, // Type assertion for enum
          language,
          campaignId,
          source,
          region,
          sentiment: sentiment.label,
          score: sentiment.score,
          confidence: sentiment.confidence,
          metadata,
        },
      });

      console.log(
        `📊 Sentiment tracked: ${sentiment.label} (${sentiment.score.toFixed(2)}) for ${language}`
      );
    } catch (error) {
      console.error('Failed to track sentiment:', error);
      // Don't throw error as this shouldn't break execution
    }
  }

  /**
   * Simple sentiment analysis function
   */
  private static analyzeSentiment(text: string, language: string) {
    const positiveWords =
      language === 'ar'
        ? ['ممتاز', 'رائع', 'جيد', 'مذهل', 'أحب', 'سعيد', 'مفيد', 'جميل', 'رائع', 'أفضل']
        : [
            'great',
            'amazing',
            'good',
            'excellent',
            'love',
            'happy',
            'awesome',
            'fantastic',
            'wonderful',
            'best',
          ];

    const negativeWords =
      language === 'ar'
        ? ['سيء', 'فظيع', 'مشكلة', 'صعب', 'أكره', 'محزن', 'مروع', 'خطأ', 'سوء', 'رهيب']
        : [
            'bad',
            'terrible',
            'hate',
            'awful',
            'worst',
            'sad',
            'horrible',
            'poor',
            'disappointing',
            'useless',
          ];

    const lowerText = text.toLowerCase();
    let score = 0;
    let totalWords = 0;

    positiveWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word.toLowerCase(), 'g')) || []).length;
      score += matches * 0.1;
      totalWords += matches;
    });

    negativeWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word.toLowerCase(), 'g')) || []).length;
      score -= matches * 0.1;
      totalWords += matches;
    });

    // Normalize score to -1 to 1 range
    score = Math.max(-1, Math.min(1, score));

    const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    const confidence = totalWords > 0 ? Math.min(1, totalWords * 0.3) : 0.5;

    return { label, score, confidence };
  }

  /**
   * Create launch alert
   */
  static async createAlert(options: {
    campaignId?: string;
    alertType: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    threshold?: number;
    currentValue?: number;
    region?: string;
  }): Promise<void> {
    const {
      campaignId,
      alertType,
      severity,
      title,
      message,
      threshold,
      currentValue,
      region = 'UAE',
    } = options;

    try {
      await prisma.launchAlert.create({
        data: {
          campaignId,
          alertType,
          severity,
          title,
          message,
          threshold,
          currentValue,
          region,
        },
      });

      console.log(`🚨 Launch alert created: ${severity.toUpperCase()} - ${title}`);
    } catch (error) {
      console.error('Failed to create launch alert:', error);
    }
  }

  /**
   * Calculate estimated cost for a given number of tokens
   */
  static calculateCost(agentType: AgentType, tokens: number): number {
    const costPer1K = AGENT_COST_PER_1K_TOKENS[agentType] || 0.04;
    return (tokens / 1000) * costPer1K;
  }

  /**
   * Get agent-specific cost per 1K tokens
   */
  static getCostRate(agentType: AgentType): number {
    return AGENT_COST_PER_1K_TOKENS[agentType] || 0.04;
  }

  /**
   * Execute a task with automatic cost tracking and launch intelligence
   */
  static async executeWithTracking<T>(
    taskFunction: () => Promise<T>,
    options: Omit<CostTrackingOptions, 'tokens'> & { estimatedTokens?: number }
  ): Promise<T> {
    const startTime = Date.now();
    let retryCount = 0;
    let tokens = options.estimatedTokens || 0;
    let result: T;
    let conversionAchieved = false;
    let qualityScore = 0;

    try {
      // Check budget before execution
      const budgetStatus = await this.checkBudgetStatus();
      if (!budgetStatus.canExecute) {
        // Create alert for budget exceeded
        if (options.campaignId) {
          await this.createAlert({
            campaignId: options.campaignId,
            alertType: 'budget_exceeded',
            severity: 'critical',
            title: 'Budget Exceeded',
            message: `Campaign execution blocked due to budget limit (${budgetStatus.utilizationPercentage.toFixed(1)}% utilization)`,
            currentValue: budgetStatus.utilizationPercentage,
            threshold: 100,
            region: options.region,
          });
        }

        throw new Error(
          `Budget exceeded and override not enabled. Current utilization: ${budgetStatus.utilizationPercentage.toFixed(1)}%`
        );
      }

      // Execute the task
      result = await taskFunction();

      // Try to extract actual metrics from result if available
      if (typeof result === 'object' && result !== null) {
        const resultObj = result as any;
        tokens = resultObj.tokensUsed || resultObj.tokens || tokens;
        conversionAchieved = resultObj.conversionAchieved || resultObj.success || false;
        qualityScore = resultObj.qualityScore || resultObj.confidence || 0;
      }

      const executionTime = Date.now() - startTime;

      // Track the cost and execution metrics
      await this.trackCost({
        ...options,
        tokens,
        retryCount,
        executionTime,
        conversionAchieved,
        qualityScore,
      });

      return result;
    } catch (error) {
      retryCount++;
      const executionTime = Date.now() - startTime;

      // Track failed execution cost
      await this.trackCost({
        ...options,
        tokens,
        retryCount,
        executionTime,
        conversionAchieved: false,
        qualityScore: 0,
        metadata: {
          ...options.metadata,
          error: error instanceof Error ? error.message : 'Unknown error',
          failed: true,
        },
      });

      // Create alert for execution failure
      if (options.campaignId) {
        await this.createAlert({
          campaignId: options.campaignId,
          alertType: 'execution_failure',
          severity: 'warning',
          title: 'Agent Execution Failed',
          message: `${options.agentType} agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          region: options.region,
        });
      }

      throw error;
    }
  }
}

// Export utility functions for backwards compatibility
export const checkBudgetStatus = BudgetTracker.checkBudgetStatus;
export const trackAgentCost = BudgetTracker.trackCost;
export const calculateAgentCost = BudgetTracker.calculateCost;
export const executeWithCostTracking = BudgetTracker.executeWithTracking;
export const trackSentiment = BudgetTracker.trackSentiment;
export const createLaunchAlert = BudgetTracker.createAlert;
