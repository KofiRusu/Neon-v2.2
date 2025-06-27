import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  BudgetMonitor,
  BudgetLogger,
  runLLMTaskWithCostTracking,
} from '../../packages/core-agents/src/utils/cost-tracker';
import { AgentType } from '@prisma/client';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

// Mock environment variables
const originalEnv = process.env;

describe('Budget Enforcement System', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MAX_MONTHLY_BUDGET: '1000',
      ALLOW_BUDGET_OVERRIDE: 'false',
    };

    // Clean up any existing log files
    const logDir = join(process.cwd(), 'logs', 'budget');
    if (existsSync(logDir)) {
      rmSync(logDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('BudgetMonitor', () => {
    test('should check budget status correctly', async () => {
      const status = await BudgetMonitor.checkBudgetStatus('2024-11');

      expect(status).toHaveProperty('isOverBudget');
      expect(status).toHaveProperty('isNearBudget');
      expect(status).toHaveProperty('budgetUtilization');
      expect(status).toHaveProperty('remainingBudget');
      expect(status).toHaveProperty('currentSpend');
      expect(status).toHaveProperty('budgetLimit');

      expect(typeof status.budgetUtilization).toBe('number');
      expect(status.budgetUtilization).toBeGreaterThanOrEqual(0);
      expect(status.budgetUtilization).toBeLessThanOrEqual(200); // Allow for over-budget scenarios
    });

    test('should determine execution blocking correctly', async () => {
      const result = await BudgetMonitor.shouldBlockExecution(50, '2024-11');

      expect(result).toHaveProperty('shouldBlock');
      expect(result).toHaveProperty('budgetStatus');
      expect(typeof result.shouldBlock).toBe('boolean');
    });

    test('should allow override when globally enabled', async () => {
      process.env.ALLOW_BUDGET_OVERRIDE = 'true';

      // Mock a scenario where budget would be exceeded
      const mockBudgetStatus = {
        isOverBudget: true,
        isNearBudget: true,
        budgetUtilization: 150,
        remainingBudget: 0,
        currentSpend: 1500,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const result = await BudgetMonitor.shouldBlockExecution(100, '2024-11');

      expect(result.shouldBlock).toBe(false);
      expect(result.reason).toContain('override');
    });

    test('should block execution when budget exceeded and no override', async () => {
      process.env.ALLOW_BUDGET_OVERRIDE = 'false';

      const mockBudgetStatus = {
        isOverBudget: true,
        isNearBudget: true,
        budgetUtilization: 150,
        remainingBudget: 0,
        currentSpend: 1500,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const result = await BudgetMonitor.shouldBlockExecution(100, '2024-11');

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toContain('exceeded');
    });
  });

  describe('BudgetLogger', () => {
    test('should log blocked executions', () => {
      const execution = {
        agentType: AgentType.CONTENT,
        campaignId: 'test-campaign',
        task: 'test-task',
        estimatedCost: 25.5,
        currentSpend: 950,
        budgetLimit: 1000,
        month: '2024-11',
      };

      BudgetLogger.logBlockedExecution(execution);

      const logFile = join(process.cwd(), 'logs', 'budget', 'blocked-executions.md');
      expect(existsSync(logFile)).toBe(true);

      const logContent = readFileSync(logFile, 'utf-8');
      expect(logContent).toContain('Budget Exceeded - Execution Blocked');
      expect(logContent).toContain('CONTENT');
      expect(logContent).toContain('test-campaign');
      expect(logContent).toContain('$25.50');
      expect(logContent).toContain('$950.00');
      expect(logContent).toContain('2024-11');
    });

    test('should log override executions', () => {
      const execution = {
        agentType: AgentType.AD,
        campaignId: 'test-campaign-2',
        task: 'test-ad-task',
        estimatedCost: 75.25,
        currentSpend: 1100,
        budgetLimit: 1000,
        month: '2024-11',
        overrideReason: 'Admin override enabled',
      };

      BudgetLogger.logOverrideExecution(execution);

      const logFile = join(process.cwd(), 'logs', 'budget', 'override-executions.md');
      expect(existsSync(logFile)).toBe(true);

      const logContent = readFileSync(logFile, 'utf-8');
      expect(logContent).toContain('Budget Override - Execution Allowed');
      expect(logContent).toContain('AD');
      expect(logContent).toContain('test-campaign-2');
      expect(logContent).toContain('$75.25');
      expect(logContent).toContain('Admin override enabled');
    });
  });

  describe('runLLMTaskWithCostTracking with Budget Enforcement', () => {
    test('should execute successfully when within budget', async () => {
      const mockBudgetStatus = {
        isOverBudget: false,
        isNearBudget: false,
        budgetUtilization: 50,
        remainingBudget: 500,
        currentSpend: 500,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const taskConfig = {
        prompt: 'Test prompt',
        maxTokens: 100,
      };

      const costConfig = {
        agentType: AgentType.CONTENT,
        campaignId: 'test-campaign',
        task: 'content-generation',
        trackCosts: false, // Disable API calls for testing
      };

      const result = await runLLMTaskWithCostTracking(taskConfig, costConfig);

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('cost');
      expect(result.metadata).toHaveProperty('budgetStatus');
      expect(result.metadata.wasOverride).toBe(false);
    });

    test('should throw error when budget exceeded and no override', async () => {
      process.env.ALLOW_BUDGET_OVERRIDE = 'false';

      const mockBudgetStatus = {
        isOverBudget: true,
        isNearBudget: true,
        budgetUtilization: 150,
        remainingBudget: 0,
        currentSpend: 1500,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const taskConfig = {
        prompt: 'Test prompt that should be blocked',
        maxTokens: 100,
      };

      const costConfig = {
        agentType: AgentType.CONTENT,
        campaignId: 'test-campaign',
        task: 'blocked-task',
        trackCosts: false,
      };

      await expect(runLLMTaskWithCostTracking(taskConfig, costConfig)).rejects.toThrow(
        'Budget exceeded. Execution blocked'
      );

      // Verify that blocked execution was logged
      const logFile = join(process.cwd(), 'logs', 'budget', 'blocked-executions.md');
      expect(existsSync(logFile)).toBe(true);
    });

    test('should execute with override when globally enabled', async () => {
      process.env.ALLOW_BUDGET_OVERRIDE = 'true';

      const mockBudgetStatus = {
        isOverBudget: true,
        isNearBudget: true,
        budgetUtilization: 150,
        remainingBudget: 0,
        currentSpend: 1500,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const taskConfig = {
        prompt: 'Test prompt with override',
        maxTokens: 100,
      };

      const costConfig = {
        agentType: AgentType.CONTENT,
        campaignId: 'test-campaign',
        task: 'override-task',
        trackCosts: false,
      };

      const result = await runLLLTaskWithCostTracking(taskConfig, costConfig);

      expect(result).toHaveProperty('response');
      expect(result.metadata.wasOverride).toBe(true);

      // Verify that override execution was logged
      const logFile = join(process.cwd(), 'logs', 'budget', 'override-executions.md');
      expect(existsSync(logFile)).toBe(true);
    });

    test('should execute with execution-level override', async () => {
      process.env.ALLOW_BUDGET_OVERRIDE = 'false'; // Global override disabled

      const mockBudgetStatus = {
        isOverBudget: true,
        isNearBudget: true,
        budgetUtilization: 150,
        remainingBudget: 0,
        currentSpend: 1500,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const taskConfig = {
        prompt: 'Test prompt with execution override',
        maxTokens: 100,
      };

      const costConfig = {
        agentType: AgentType.CONTENT,
        campaignId: 'test-campaign',
        task: 'execution-override-task',
        trackCosts: false,
        allowBudgetOverride: true, // Execution-level override
      };

      const result = await runLLMTaskWithCostTracking(taskConfig, costConfig);

      expect(result).toHaveProperty('response');
      expect(result.metadata.wasOverride).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle multiple sequential executions with budget tracking', async () => {
      const mockBudgetStatus = {
        isOverBudget: false,
        isNearBudget: false,
        budgetUtilization: 80,
        remainingBudget: 200,
        currentSpend: 800,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const taskConfig = {
        prompt: 'Sequential test prompt',
        maxTokens: 50,
      };

      // Execute multiple tasks
      for (let i = 0; i < 3; i++) {
        const costConfig = {
          agentType: AgentType.CONTENT,
          campaignId: `campaign-${i}`,
          task: `sequential-task-${i}`,
          trackCosts: false,
        };

        const result = await runLLMTaskWithCostTracking(taskConfig, costConfig);
        expect(result).toHaveProperty('response');
        expect(result).toHaveProperty('cost');
      }
    });

    test('should handle edge case of exactly hitting budget limit', async () => {
      const mockBudgetStatus = {
        isOverBudget: false,
        isNearBudget: true,
        budgetUtilization: 99.9,
        remainingBudget: 1,
        currentSpend: 999,
        budgetLimit: 1000,
      };

      jest.spyOn(BudgetMonitor, 'checkBudgetStatus').mockResolvedValue(mockBudgetStatus);

      const taskConfig = {
        prompt: 'Edge case test',
        maxTokens: 25, // Very small task
      };

      const costConfig = {
        agentType: AgentType.CONTENT,
        campaignId: 'edge-case-campaign',
        task: 'edge-case-task',
        trackCosts: false,
      };

      // This should still execute as it's within the remaining budget
      const result = await runLLMTaskWithCostTracking(taskConfig, costConfig);
      expect(result).toHaveProperty('response');
    });
  });
});
