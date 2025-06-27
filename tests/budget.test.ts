import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { runLLMTask, withUsageLogging } from '../packages/core-agents/src/llm/runLLMTask';

// Mock Prisma Client
const mockPrisma = {
  billingLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  monthlyBudget: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  campaign: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock agent logger
jest.mock('../packages/utils/src/agentLogger', () => ({
  logSuccess: jest.fn(),
  logError: jest.fn(),
}));

describe('Billing System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runLLMTask', () => {
    it('should log successful task execution with cost tracking', async () => {
      // Arrange
      const mockTask = jest.fn().mockResolvedValue({ success: true, data: 'test result' });
      mockPrisma.billingLog.create.mockResolvedValue({
        id: 'log-1',
        campaignId: 'campaign-1',
        agentType: 'CONTENT',
        tokensUsed: 100,
        cost: 0.2,
      });
      mockPrisma.monthlyBudget.upsert.mockResolvedValue({
        id: 'budget-1',
        amount: 1000,
        spent: 0.2,
      });

      // Act
      const result = await runLLMTask(mockTask, {
        agentType: 'CONTENT',
        campaignId: 'campaign-1',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, data: 'test result' });
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThan(0);
      expect(mockPrisma.billingLog.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-1',
          agentType: 'CONTENT',
          tokensUsed: expect.any(Number),
          cost: expect.any(Number),
          metadata: {
            costPerToken: expect.any(Number),
            timestamp: expect.any(String),
          },
        },
      });
    });

    it('should handle task execution errors gracefully', async () => {
      // Arrange
      const mockTask = jest.fn().mockRejectedValue(new Error('Task execution failed'));

      // Act
      const result = await runLLMTask(mockTask, {
        agentType: 'CONTENT',
        campaignId: 'campaign-1',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Task execution failed');
      expect(result.tokensUsed).toBe(0);
      expect(result.cost).toBe(0);
    });

    it('should calculate costs correctly for different agent types', async () => {
      // Arrange
      const mockTask = jest.fn().mockResolvedValue('test');
      mockPrisma.billingLog.create.mockResolvedValue({});
      mockPrisma.monthlyBudget.upsert.mockResolvedValue({});

      // Act
      const contentResult = await runLLMTask(mockTask, {
        agentType: 'CONTENT',
        campaignId: 'campaign-1',
      });

      const adResult = await runLLMTask(mockTask, {
        agentType: 'AD',
        campaignId: 'campaign-1',
      });

      // Assert
      expect(contentResult.cost).toBeLessThan(adResult.cost); // AD agent costs more per token
    });
  });

  describe('withUsageLogging', () => {
    it('should wrap execution function with logging', async () => {
      // Arrange
      const mockExecutionFn = jest.fn().mockResolvedValue('execution result');
      mockPrisma.billingLog.create.mockResolvedValue({});
      mockPrisma.monthlyBudget.upsert.mockResolvedValue({});

      // Act
      const result = await withUsageLogging('SEO', 'campaign-2', mockExecutionFn);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('execution result');
      expect(mockExecutionFn).toHaveBeenCalled();
    });
  });

  describe('Cost Calculation', () => {
    const testCases = [
      { agentType: 'CONTENT', tokensUsed: 1000, expectedCost: 2.0 },
      { agentType: 'SEO', tokensUsed: 1000, expectedCost: 1.0 },
      { agentType: 'AD', tokensUsed: 1000, expectedCost: 3.0 },
      { agentType: 'DESIGN', tokensUsed: 1000, expectedCost: 4.0 },
    ];

    testCases.forEach(({ agentType, tokensUsed, expectedCost }) => {
      it(`should calculate correct cost for ${agentType} agent`, async () => {
        // Arrange
        const mockTask = jest.fn().mockResolvedValue('test');
        mockPrisma.billingLog.create.mockImplementation(data => {
          expect(data.data.cost).toBeCloseTo(expectedCost, 2);
          return Promise.resolve({});
        });
        mockPrisma.monthlyBudget.upsert.mockResolvedValue({});

        // Mock the execution time to control token estimation
        const originalNow = Date.now;
        let callCount = 0;
        Date.now = jest.fn(() => {
          const baseTime = 1000000;
          return baseTime + callCount++ * tokensUsed * 10; // Control execution time
        });

        // Act
        await runLLMTask(mockTask, {
          agentType,
          campaignId: 'test-campaign',
        });

        // Cleanup
        Date.now = originalNow;
      });
    });
  });

  describe('Budget System Integration', () => {
    it('should update monthly budget when logging agent usage', async () => {
      // Arrange
      const mockTask = jest.fn().mockResolvedValue('test');
      mockPrisma.billingLog.create.mockResolvedValue({});
      mockPrisma.monthlyBudget.upsert.mockResolvedValue({});

      const currentMonth = new Date().toISOString().slice(0, 7);

      // Act
      await runLLMTask(mockTask, {
        agentType: 'CONTENT',
        campaignId: 'campaign-1',
      });

      // Assert
      expect(mockPrisma.monthlyBudget.upsert).toHaveBeenCalledWith({
        where: { month: currentMonth },
        update: {
          spent: {
            increment: expect.any(Number),
          },
        },
        create: {
          month: currentMonth,
          amount: 1000.0,
          spent: expect.any(Number),
        },
      });
    });

    it('should handle billing log failures gracefully without disrupting execution', async () => {
      // Arrange
      const mockTask = jest.fn().mockResolvedValue('test result');
      mockPrisma.billingLog.create.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await runLLMTask(mockTask, {
        agentType: 'CONTENT',
        campaignId: 'campaign-1',
      });

      // Assert
      expect(result.success).toBe(true); // Should still succeed despite logging failure
      expect(result.data).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log agent usage:', expect.any(Error));

      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});
