import { logSuccess, logError } from '../../../utils/src/agentLogger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LLMTaskOptions {
  agentType: string;
  campaignId: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMTaskResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  cost: number;
  metadata?: Record<string, any>;
}

/**
 * Calculate cost based on tokens used and agent type
 */
const calculateCost = (tokensUsed: number, agentType: string): number => {
  const costPerToken = {
    CONTENT: 0.002,
    SEO: 0.001,
    EMAIL_MARKETING: 0.0015,
    SOCIAL_POSTING: 0.0015,
    CUSTOMER_SUPPORT: 0.001,
    AD: 0.003,
    OUTREACH: 0.002,
    TREND: 0.0025,
    INSIGHT: 0.003,
    DESIGN: 0.004,
    BRAND_VOICE: 0.002,
  };

  return (costPerToken[agentType as keyof typeof costPerToken] || 0.002) * tokensUsed;
};

/**
 * Log agent usage to billing system
 */
const logAgentUsage = async (
  agentType: string,
  campaignId: string,
  tokensUsed: number,
  cost: number
): Promise<void> => {
  try {
    await prisma.billingLog.create({
      data: {
        campaignId,
        agentType,
        tokensUsed,
        cost,
        metadata: {
          costPerToken: cost / tokensUsed,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Update monthly budget spent amount
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await prisma.monthlyBudget.upsert({
      where: { month: currentMonth },
      update: {
        spent: {
          increment: cost,
        },
      },
      create: {
        month: currentMonth,
        amount: 1000.0, // Default budget
        spent: cost,
      },
    });
  } catch (error) {
    // Log error but don't throw to avoid disrupting agent execution
    console.error('Failed to log agent usage:', error);
  }
};

/**
 * Run an LLM task with automatic usage logging and cost tracking
 */
export async function runLLMTask<T = any>(
  taskFn: () => Promise<T>,
  options: LLMTaskOptions
): Promise<LLMTaskResult<T>> {
  const startTime = Date.now();
  const { agentType, campaignId } = options;

  try {
    // Execute the LLM task
    const result = await taskFn();
    const executionTime = Date.now() - startTime;

    // Estimate tokens used (this is a rough estimate - in real implementation,
    // you would get this from the actual LLM API response)
    const tokensUsed = Math.max(100, Math.floor(executionTime / 10));
    const cost = calculateCost(tokensUsed, agentType);

    // Log usage to billing system
    await logAgentUsage(agentType, campaignId, tokensUsed, cost);

    // Log success
    await logSuccess(
      agentType as any,
      'llm_task_execution',
      {
        campaignId,
        tokensUsed,
        cost,
        executionTime,
      },
      executionTime
    );

    return {
      success: true,
      data: result,
      tokensUsed,
      cost,
      metadata: {
        executionTime,
        costPerToken: cost / tokensUsed,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log error
    await logError(agentType as any, 'llm_task_execution', errorMessage, {
      campaignId,
      executionTime,
    });

    return {
      success: false,
      error: errorMessage,
      tokensUsed: 0,
      cost: 0,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Wrapper for existing agent execution with usage logging
 */
export async function withUsageLogging<T>(
  agentType: string,
  campaignId: string,
  executionFn: () => Promise<T>
): Promise<LLMTaskResult<T>> {
  return runLLMTask(executionFn, { agentType, campaignId });
}
