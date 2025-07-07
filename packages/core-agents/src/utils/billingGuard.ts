import { logger } from '@neon/utils';

// Agent cost mapping (cost per execution in USD)
export const AGENT_EXECUTION_COSTS = {
  CONTENT: 0.05,           // Content generation
  SEO: 0.03,              // SEO optimization
  EMAIL_MARKETING: 0.04,   // Email campaigns
  SOCIAL_POSTING: 0.03,    // Social media posts
  CUSTOMER_SUPPORT: 0.02,  // Support responses
  AD: 0.08,               // Ad optimization (more complex)
  OUTREACH: 0.04,         // B2B outreach
  TREND: 0.03,            // Trend analysis
  INSIGHT: 0.06,          // Business insights
  DESIGN: 0.10,           // Design generation
  BRAND_VOICE: 0.02,      // Brand voice analysis
  GOAL_PLANNER: 0.05,     // Goal planning
  PATTERN_MINER: 0.04,    // Pattern analysis
  SEGMENT_ANALYZER: 0.05, // Segment analysis
  BILLING: 0.01,          // Billing operations
} as const;

// Task complexity multipliers
export const TASK_COMPLEXITY_MULTIPLIERS = {
  simple: 1.0,
  standard: 1.2,
  complex: 1.5,
  premium: 2.0,
} as const;

export interface BudgetCheckOptions {
  agentType: string;
  estimatedCost: number;
  campaignId?: string;
  task?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SpendLogOptions {
  agentType: string;
  actualCost: number;
  campaignId?: string;
  task?: string;
  userId?: string;
  executionId?: string;
  tokens?: number;
  executionTime?: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface BudgetStatus {
  canExecute: boolean;
  currentBudget: number;
  estimatedCost: number;
  remainingBudget: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  isNearBudget: boolean;
  reason?: string;
}

export class BudgetInsufficientError extends Error {
  constructor(
    message: string,
    public currentBudget: number,
    public requiredCost: number,
    public suggestedAction: string = 'Please top up your budget to continue using AI agents'
  ) {
    super(message);
    this.name = 'BudgetInsufficientError';
  }
}

/**
 * Main billing guard class for budget enforcement
 */
export class BillingGuard {
  private static instance: BillingGuard;
  private billingApiUrl: string;
  private overrideEnabled: boolean = false;

  private constructor() {
    this.billingApiUrl = process.env.BILLING_API_URL || 'http://localhost:3000/api/trpc';
  }

  static getInstance(): BillingGuard {
    if (!BillingGuard.instance) {
      BillingGuard.instance = new BillingGuard();
    }
    return BillingGuard.instance;
  }

  /**
   * Main method to enforce budget before agent execution
   */
  async enforceAgentBudget(options: BudgetCheckOptions): Promise<BudgetStatus> {
    try {
      const budgetStatus = await this.checkCurrentBudget();
      const estimatedCost = this.calculateEstimatedCost(options);

      const result: BudgetStatus = {
        canExecute: budgetStatus.remainingBudget >= estimatedCost || this.overrideEnabled,
        currentBudget: budgetStatus.totalBudget,
        estimatedCost,
        remainingBudget: budgetStatus.remainingBudget,
        utilizationPercentage: budgetStatus.utilizationPercentage,
        isOverBudget: budgetStatus.isOverBudget,
        isNearBudget: budgetStatus.isNearBudget,
      };

      // Check if budget is sufficient
      if (!result.canExecute && !this.overrideEnabled) {
        const errorMessage = `💸 Insufficient budget for ${options.agentType}. Required: $${estimatedCost.toFixed(2)}, Available: $${budgetStatus.remainingBudget.toFixed(2)}`;
        
        result.reason = errorMessage;
        
        logger.warn('Budget check failed', {
          agentType: options.agentType,
          estimatedCost,
          availableBudget: budgetStatus.remainingBudget,
          task: options.task,
          campaignId: options.campaignId,
        }, 'BillingGuard');

        throw new BudgetInsufficientError(
          errorMessage,
          budgetStatus.remainingBudget,
          estimatedCost,
          'Visit your billing dashboard to add funds via Stripe'
        );
      }

      // Log successful budget check
      logger.info('Budget check passed', {
        agentType: options.agentType,
        estimatedCost,
        remainingBudget: budgetStatus.remainingBudget,
        overrideEnabled: this.overrideEnabled,
      }, 'BillingGuard');

      return result;

    } catch (error) {
      if (error instanceof BudgetInsufficientError) {
        throw error;
      }
      
      logger.error('Budget check failed due to system error', {
        error: error instanceof Error ? error.message : error,
        agentType: options.agentType,
      }, 'BillingGuard');
      
      // In case of system error, allow execution to prevent system breakdown
      // but log the issue for investigation
      return {
        canExecute: true,
        currentBudget: 0,
        estimatedCost: options.estimatedCost,
        remainingBudget: 0,
        utilizationPercentage: 0,
        isOverBudget: false,
        isNearBudget: false,
        reason: 'Budget check system error - execution allowed',
      };
    }
  }

  /**
   * Log actual spend after agent execution
   */
  async logAgentSpend(options: SpendLogOptions): Promise<void> {
    try {
      // Use the existing billing API to log the spend
      const response = await this.makeApiCall('billing.logAgentCost', {
        agentType: options.agentType,
        campaignId: options.campaignId,
        tokens: options.tokens || this.estimateTokensFromCost(options.actualCost, options.agentType),
        task: options.task,
        executionId: options.executionId,
        metadata: {
          userId: options.userId,
          executionTime: options.executionTime,
          success: options.success,
          actualCost: options.actualCost,
          timestamp: new Date().toISOString(),
          ...options.metadata,
        },
      });

      logger.info('Agent spend logged successfully', {
        agentType: options.agentType,
        actualCost: options.actualCost,
        campaignId: options.campaignId,
        success: options.success,
      }, 'BillingGuard');

    } catch (error) {
      logger.error('Failed to log agent spend', {
        error: error instanceof Error ? error.message : error,
        agentType: options.agentType,
        actualCost: options.actualCost,
      }, 'BillingGuard');
      // Don't throw here - logging failure shouldn't break agent execution
    }
  }

  /**
   * Calculate estimated cost for agent execution
   */
  private calculateEstimatedCost(options: BudgetCheckOptions): number {
    const baseCost = AGENT_EXECUTION_COSTS[options.agentType as keyof typeof AGENT_EXECUTION_COSTS] || 0.05;
    
    // Apply complexity multiplier if provided in metadata
    const complexity = options.metadata?.complexity || 'standard';
    const complexityMultiplier = TASK_COMPLEXITY_MULTIPLIERS[complexity as keyof typeof TASK_COMPLEXITY_MULTIPLIERS] || 1.2;
    
    // Apply premium multiplier for certain tasks
    const premiumTasks = ['generate_comprehensive_report', 'create_campaign_strategy', 'optimize_full_funnel'];
    const isPremiumTask = premiumTasks.some(task => options.task?.includes(task));
    const premiumMultiplier = isPremiumTask ? 1.5 : 1.0;
    
    const finalCost = baseCost * complexityMultiplier * premiumMultiplier;
    
    return Math.round(finalCost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get current budget status from billing API
   */
  private async checkCurrentBudget(): Promise<{
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    utilizationPercentage: number;
    isOverBudget: boolean;
    isNearBudget: boolean;
  }> {
    try {
      const response = await this.makeApiCall('billing.getBudgetStatus', {});
      return response;
    } catch (error) {
      logger.error('Failed to check current budget', {
        error: error instanceof Error ? error.message : error,
      }, 'BillingGuard');
      
      // Return safe defaults on error
      return {
        totalBudget: 1000,
        totalSpent: 0,
        remainingBudget: 1000,
        utilizationPercentage: 0,
        isOverBudget: false,
        isNearBudget: false,
      };
    }
  }

  /**
   * Estimate tokens from cost for reverse calculation
   */
  private estimateTokensFromCost(cost: number, agentType: string): number {
    // Rough estimation: most agents use GPT-4 pricing ~$0.02/1K tokens
    const tokensPerDollar = 50000; // 50K tokens per dollar (rough estimate)
    return Math.round(cost * tokensPerDollar);
  }

  /**
   * Make API call to billing endpoint
   */
  private async makeApiCall(method: string, params: any): Promise<any> {
    // In a real implementation, this would make HTTP requests to the tRPC API
    // For now, we'll simulate the API call
    
    if (typeof window !== 'undefined') {
      // Browser environment - use fetch
      const response = await fetch(`${this.billingApiUrl}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return await response.json();
    } else {
      // Server environment - import the billing router directly
      try {
        // Dynamic import to avoid circular dependencies
        const { billingRouter } = await import('../../../../apps/api/src/routers/billing');
        
        // Extract method name from the full path
        const methodName = method.split('.').pop();
        
        if (methodName && methodName in billingRouter._def.procedures) {
          const procedure = billingRouter._def.procedures[methodName];
          return await procedure({ input: params, ctx: {} } as any);
        }
        
        throw new Error(`Method ${methodName} not found in billing router`);
      } catch (error) {
        // Fallback for development/testing
        logger.warn('Direct API access failed, using mock response', {
          method,
          error: error instanceof Error ? error.message : error,
        }, 'BillingGuard');
        
        return this.getMockApiResponse(method, params);
      }
    }
  }

  /**
   * Mock API responses for development/testing
   */
  private getMockApiResponse(method: string, params: any): any {
    switch (method) {
      case 'billing.getBudgetStatus':
        return {
          totalBudget: 500,
          totalSpent: 125.50,
          remainingBudget: 374.50,
          utilizationPercentage: 25.1,
          isOverBudget: false,
          isNearBudget: false,
        };
      
      case 'billing.logAgentCost':
        return {
          success: true,
          id: `log_${Date.now()}`,
          cost: params.tokens * 0.002 / 1000, // Mock cost calculation
        };
      
      default:
        return { success: true };
    }
  }

  /**
   * Enable/disable budget override (admin only)
   */
  setOverride(enabled: boolean): void {
    this.overrideEnabled = enabled;
    logger.info(`Budget override ${enabled ? 'enabled' : 'disabled'}`, {}, 'BillingGuard');
  }

  /**
   * Get current override status
   */
  isOverrideEnabled(): boolean {
    return this.overrideEnabled;
  }
}

/**
 * Convenience function for enforcing agent budget
 */
export async function enforceAgentBudget(
  agentType: string,
  task?: string,
  options?: {
    campaignId?: string;
    userId?: string;
    complexity?: 'simple' | 'standard' | 'complex' | 'premium';
    metadata?: Record<string, any>;
  }
): Promise<BudgetStatus> {
  const guard = BillingGuard.getInstance();
  
  const estimatedCost = guard['calculateEstimatedCost']({
    agentType,
    estimatedCost: 0, // Will be calculated internally
    task,
    ...options,
  });
  
  return await guard.enforceAgentBudget({
    agentType,
    estimatedCost,
    task,
    ...options,
  });
}

/**
 * Convenience function for logging agent spend
 */
export async function logAgentSpend(
  agentType: string,
  actualCost: number,
  options?: {
    campaignId?: string;
    task?: string;
    userId?: string;
    executionId?: string;
    tokens?: number;
    executionTime?: number;
    success?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const guard = BillingGuard.getInstance();
  
  return await guard.logAgentSpend({
    agentType,
    actualCost,
    success: true,
    ...options,
  });
}

export default BillingGuard; 