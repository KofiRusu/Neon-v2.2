import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AgentCostEfficiencyAnalyzer,
  type AgentEfficiencyMetrics,
} from '../../packages/core-agents/src/utils/agentCostEfficiency';
import { PrismaClient, AgentType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    billingLog: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

describe('Agent Cost Efficiency System', () => {
  let analyzer: AgentCostEfficiencyAnalyzer;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    analyzer = new AgentCostEfficiencyAnalyzer();
    mockPrisma = analyzer['prisma'] as jest.Mocked<PrismaClient>;
  });

  afterEach(async () => {
    await analyzer.close();
  });

  describe('AgentCostEfficiencyAnalyzer', () => {
    test('should calculate metrics correctly for efficient agents', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.CONTENT,
          cost: 0.02,
          tokens: 500,
          impactScore: 0.8,
          conversionAchieved: true,
          qualityScore: 0.9,
          retryCount: 0,
          executionTime: 2000,
          timestamp: new Date('2024-11-15'),
        },
        {
          id: '2',
          agentType: AgentType.CONTENT,
          cost: 0.025,
          tokens: 600,
          impactScore: 0.85,
          conversionAchieved: true,
          qualityScore: 0.88,
          retryCount: 0,
          executionTime: 2200,
          timestamp: new Date('2024-11-16'),
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);

      const metrics = await analyzer.getAgentEfficiencyMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0].agentType).toBe(AgentType.CONTENT);
      expect(metrics[0].totalRuns).toBe(2);
      expect(metrics[0].avgCost).toBe(0.0225); // (0.02 + 0.025) / 2
      expect(metrics[0].avgImpactScore).toBe(0.825); // (0.8 + 0.85) / 2
      expect(metrics[0].conversionRate).toBe(100); // 2/2 * 100
      expect(metrics[0].efficiencyRating).toBe('EXCELLENT');
    });

    test('should identify inefficient agents', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.AD,
          cost: 0.15,
          tokens: 2000,
          impactScore: 0.2,
          conversionAchieved: false,
          qualityScore: 0.3,
          retryCount: 3,
          executionTime: 10000,
          timestamp: new Date('2024-11-15'),
        },
        {
          id: '2',
          agentType: AgentType.AD,
          cost: 0.18,
          tokens: 2200,
          impactScore: 0.15,
          conversionAchieved: false,
          qualityScore: 0.25,
          retryCount: 4,
          executionTime: 12000,
          timestamp: new Date('2024-11-16'),
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);

      const metrics = await analyzer.getAgentEfficiencyMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0].agentType).toBe(AgentType.AD);
      expect(metrics[0].avgCost).toBe(0.165); // (0.15 + 0.18) / 2
      expect(metrics[0].avgImpactScore).toBe(0.175); // (0.2 + 0.15) / 2
      expect(metrics[0].conversionRate).toBe(0); // 0/2 * 100
      expect(metrics[0].efficiencyRating).toBe('CRITICAL');
      expect(metrics[0].recommendedOptimizations.length).toBeGreaterThan(0);
    });

    test('should generate optimization suggestions for poor performers', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.SEO,
          cost: 0.12,
          tokens: 1500,
          impactScore: 0.3,
          conversionAchieved: false,
          qualityScore: 0.4,
          retryCount: 2,
          executionTime: 8000,
          timestamp: new Date('2024-11-15'),
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);

      const suggestions = await analyzer.generateOptimizationSuggestions();

      expect(suggestions.length).toBeGreaterThan(0);

      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'HIGH');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);

      const costSuggestion = suggestions.find(s => s.category === 'COST');
      expect(costSuggestion).toBeDefined();
      expect(costSuggestion!.expectedSavings).toBeGreaterThan(0);
    });

    test('should handle empty billing data gracefully', async () => {
      mockPrisma.billingLog.findMany.mockResolvedValue([]);

      const metrics = await analyzer.getAgentEfficiencyMetrics();

      expect(metrics).toHaveLength(0);
    });

    test('should filter by agent type correctly', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.CONTENT,
          cost: 0.02,
          tokens: 500,
          impactScore: 0.8,
          conversionAchieved: true,
          qualityScore: 0.9,
          retryCount: 0,
          executionTime: 2000,
          timestamp: new Date('2024-11-15'),
        },
        {
          id: '2',
          agentType: AgentType.AD,
          cost: 0.15,
          tokens: 2000,
          impactScore: 0.2,
          conversionAchieved: false,
          qualityScore: 0.3,
          retryCount: 3,
          executionTime: 10000,
          timestamp: new Date('2024-11-15'),
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(
        mockBillingLogs.filter(log => log.agentType === AgentType.CONTENT) as any
      );

      const metrics = await analyzer.getAgentEfficiencyMetrics(AgentType.CONTENT);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].agentType).toBe(AgentType.CONTENT);
    });

    test('should filter by timeframe correctly', async () => {
      const timeframe = {
        start: new Date('2024-11-01'),
        end: new Date('2024-11-30'),
      };

      mockPrisma.billingLog.findMany.mockResolvedValue([]);

      await analyzer.getAgentEfficiencyMetrics(undefined, timeframe);

      expect(mockPrisma.billingLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: timeframe.start,
            lte: timeframe.end,
          },
        },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('Efficiency Rating Calculation', () => {
    test('should rate excellent performance correctly', () => {
      const metrics = {
        avgCost: 0.005, // Very low cost
        avgImpactScore: 0.9, // High impact
        conversionRate: 90, // High conversion
        costPerImpact: 0.0056,
        qualityScore: 0.95, // High quality
        avgRetryCount: 0.1, // Low retries
      };

      const rating = analyzer['calculateEfficiencyRating'](metrics);
      expect(rating).toBe('EXCELLENT');
    });

    test('should rate critical performance correctly', () => {
      const metrics = {
        avgCost: 0.25, // Very high cost
        avgImpactScore: 0.1, // Low impact
        conversionRate: 5, // Low conversion
        costPerImpact: 2.5,
        qualityScore: 0.2, // Low quality
        avgRetryCount: 3, // High retries
      };

      const rating = analyzer['calculateEfficiencyRating'](metrics);
      expect(rating).toBe('CRITICAL');
    });
  });

  describe('Optimization Recommendations', () => {
    test('should recommend cost optimizations for expensive agents', () => {
      const metrics = {
        agentType: AgentType.CONTENT,
        avgCost: 0.08, // High cost
        avgImpactScore: 0.7,
        conversionRate: 60,
        costPerImpact: 0.114,
        qualityScore: 0.8,
        avgRetryCount: 0.2,
        avgExecutionTime: 3000,
      };

      const recommendations = analyzer['generateOptimizationRecommendations'](metrics);

      expect(recommendations.some(r => r.includes('gpt-4o-mini'))).toBe(true);
      expect(recommendations.some(r => r.includes('Simplify prompts'))).toBe(true);
    });

    test('should recommend quality improvements for low impact agents', () => {
      const metrics = {
        agentType: AgentType.AD,
        avgCost: 0.03,
        avgImpactScore: 0.3, // Low impact
        conversionRate: 25, // Low conversion
        costPerImpact: 0.1,
        qualityScore: 0.4, // Low quality
        avgRetryCount: 0.1,
        avgExecutionTime: 2000,
      };

      const recommendations = analyzer['generateOptimizationRecommendations'](metrics);

      expect(recommendations.some(r => r.includes('Refine prompts'))).toBe(true);
      expect(recommendations.some(r => r.includes('quality'))).toBe(true);
    });

    test('should recommend reliability improvements for high retry agents', () => {
      const metrics = {
        agentType: AgentType.SEO,
        avgCost: 0.04,
        avgImpactScore: 0.6,
        conversionRate: 50,
        costPerImpact: 0.067,
        qualityScore: 0.7,
        avgRetryCount: 1.5, // High retries
        avgExecutionTime: 2000,
      };

      const recommendations = analyzer['generateOptimizationRecommendations'](metrics);

      expect(recommendations.some(r => r.includes('error handling'))).toBe(true);
      expect(recommendations.some(r => r.includes('prompt engineering'))).toBe(true);
    });
  });

  describe('Cost Per Metric Calculations', () => {
    test('should calculate cost per impact correctly', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.CONTENT,
          cost: 0.04,
          tokens: 800,
          impactScore: 0.8,
          conversionAchieved: true,
          qualityScore: 0.9,
          retryCount: 0,
          executionTime: 2000,
          timestamp: new Date('2024-11-15'),
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);

      const metrics = await analyzer.getAgentEfficiencyMetrics();
      const costPerImpact = metrics[0].costPerImpact;

      expect(costPerImpact).toBe(0.05); // 0.04 / 0.8
    });

    test('should handle infinity for cost per conversion when no conversions', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.CONTENT,
          cost: 0.04,
          tokens: 800,
          impactScore: 0.8,
          conversionAchieved: false, // No conversion
          qualityScore: 0.9,
          retryCount: 0,
          executionTime: 2000,
          timestamp: new Date('2024-11-15'),
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);

      const metrics = await analyzer.getAgentEfficiencyMetrics();
      const costPerConversion = metrics[0].costPerConversion;

      expect(costPerConversion).toBe(Infinity);
    });
  });
});
